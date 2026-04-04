# Research: Artista Opcional em Versão de Música

**Date**: 2026-04-04 | **Branch**: `024-optional-artist-versao`

## R-001: Nullable FK com partial unique index no Prisma 6 + PostgreSQL

**Decision**: Usar `artista_id String? @db.Uuid` com partial unique index via `@@index` raw SQL na migration.

**Rationale**: Prisma 6 suporta campos nullable em relações opcionais (`Artistas?`). O `@@unique([tenant_id, artista_id, musica_id])` do Prisma não suporta cláusula `WHERE`, então o partial unique index deve ser criado diretamente na migration SQL e o `@@unique` removido do schema (substituído por comentário ou `@@index`).

**Alternatives considered**:
- `@@unique` padrão mantido: Rejeitado — PostgreSQL trata NULLs como distintos, permitindo múltiplas versões sem artista por música.
- Check constraint no banco: Rejeitado — mais complexo que guard no service, e Prisma não modela check constraints nativamente.
- Artista sentinela "Desconhecido": Rejeitado — polui dados, dificulta queries de "versões incompletas".

## R-002: Prisma optional relation com onDelete Cascade

**Decision**: Mudar relação de `Artistas @relation(...)` para `Artistas? @relation(...)`. Manter `onDelete: Cascade`.

**Rationale**: Quando `artista_id` é null, o cascade não se aplica (não há FK para seguir). Quando preenchido, o cascade funciona normalmente. Sem risco para dados existentes.

**Alternatives considered**:
- `onDelete: SetNull`: Rejeitado — já é nullable, e o comportamento desejado ao deletar um artista é remover as versões associadas (cascade), não apenas desvinculá-las.

## R-003: Guard de duplicata null-artist no service layer

**Decision**: Adicionar método `findVersaoWithoutArtist(musicaId)` no repository. No service `addVersao`, quando `artista_id` é ausente/null, verificar se já existe versão sem artista para aquela música → 409 se sim.

**Rationale**: O partial unique index no banco só protege combinações com artista preenchido. A regra de negócio "max 1 versão sem artista por música" precisa de guard explícito no service.

**Alternatives considered**:
- Unique partial index com COALESCE: Rejeitado — hack que mapeia NULL para valor sentinela no índice; frágil e não idiomático.
- Permitir múltiplas versões sem artista: Rejeitado — spec FR-004 exige limite de 1.

## R-004: Frontend — campo artista condicional na edição

**Decision**: No `VersaoForm.tsx`, o `<Select>` de artista fica habilitado (editável) quando `versao.artista` é null. Quando já possui artista, permanece desabilitado (comportamento atual).

**Rationale**: Clarificação da spec (Session 2026-04-04): apenas adicionar artista a versões sem artista (null → artista). Não alterar nem remover artista já vinculado.

**Alternatives considered**:
- Habilitar sempre: Rejeitado — fora do escopo conforme clarificação.
- Campo read-only com botão "Adicionar": Rejeitado — complexidade adicional sem benefício; o Select já serve como mecanismo de adição.

## R-005: Tratamento de string vazia na API

**Decision**: No `addVersaoBodySchema`, usar `z.preprocess` para converter string vazia para `undefined`, idêntico ao padrão já usado no campo `intensidade`.

**Rationale**: Formulários HTML podem enviar string vazia em vez de omitir o campo. O preprocess normaliza antes da validação Zod.

**Alternatives considered**:
- Validar no service: Rejeitado — validação de input pertence ao validator layer.
- `.transform()` no Zod: Funcional, mas `.preprocess()` é o padrão já usado no projeto para o campo `intensidade`.
