# Research: Remover Campo Documento de Integrantes

**Branch**: `012-remove-documento-integrante` | **Date**: 2026-02-25

## Pesquisa 1: Estado atual do campo `doc_id`

**Decision**: O campo `doc_id` (String, @unique) existe no model Integrantes do Prisma e em ~11 arquivos no codebase.

**Rationale**: Mapeamento completo identificou todos os pontos de impacto — não há dependências ocultas ou integrações externas usando o campo.

**Findings**:
- **Prisma schema**: `doc_id String @unique` (linha 142)
- **Migration SQL**: Coluna `doc_id TEXT NOT NULL` + índice único `integrantes_doc_id_key`
- **Backend types**: `IntegranteWithFuncoes.doc_id` + `INTEGRANTE_PUBLIC_SELECT.doc_id`
- **Backend service**: Normalização (remove não-numéricos) e validação de unicidade em create/update
- **Backend repository**: Métodos `findByDocId()` e `findByDocIdExcludingId()`
- **Backend tests**: Mock data (3 registros), fake repository (2 métodos), service tests (3 testes)
- **Frontend schema**: 4 schemas Zod incluem `doc_id`
- **Frontend form**: Campo "Documento" com placeholder "CPF ou RG"

**Alternatives considered**: N/A — remoção completa é a única opção conforme solicitação da cliente.

## Pesquisa 2: Estado atual do campo `email`

**Decision**: O campo `email` já possui constraint `@unique` no Prisma schema e índice único no banco (`integrantes_email_key`). Não há validação de unicidade no service layer — a proteção é apenas via constraint do banco.

**Rationale**: A constraint no banco previne duplicatas, mas erros do Prisma (P2002) são genéricos. Adicionar validação no service melhora a experiência do usuário com mensagens claras de erro.

**Findings**:
- **Prisma schema** (linha 143): `email String @unique @db.VarChar(255)`
- **Migration SQL** (linha 143): `CREATE UNIQUE INDEX "integrantes_email_key" ON "integrantes"("email")`
- **Service layer**: Nenhuma validação de unicidade de email — apenas `doc_id` é verificado
- **Repository**: Não existe método `findByEmail()` — precisa ser criado

**Alternatives considered**:
1. Confiar apenas na constraint do banco — Rejeitado: erros P2002 não são user-friendly.
2. Adicionar validação no service (escolhido) — Melhor UX com mensagem clara "Já existe um integrante com esse email".

## Pesquisa 3: Estratégia de migração Prisma

**Decision**: Usar `npx prisma migrate dev --name remove-doc-id` para gerar migration que dropa a coluna.

**Rationale**: Segue o princípio constitucional II (mudanças de schema via Prisma migrations). A coluna contém dados pessoais que a cliente não quer manter — a perda é intencional.

**Findings**:
- Prisma 6 suporta remoção de campos com migration automática
- A migration gerada incluirá `ALTER TABLE "integrantes" DROP COLUMN "doc_id"`
- O índice único é removido automaticamente junto com a coluna
- Dados existentes na coluna serão perdidos (irreversível)

**Alternatives considered**:
1. Tornar nullable primeiro, remover depois — Rejeitado: complexidade desnecessária para remoção permanente.
2. Remoção direta (escolhido) — Mais simples e alinhado com YAGNI.
