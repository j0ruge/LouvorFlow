# Research: Unificação Users/Integrantes

**Date**: 2026-03-15 | **Branch**: `018-unify-users-integrantes`

## R1: Estratégia de Migração Prisma com Dados

**Decision**: Migration em duas etapas — (1) Prisma schema migration para DDL, (2) script TypeScript separado para migração de dados usando `prisma.$transaction()`.

**Rationale**: Prisma `migrate dev` gera SQL para alterações de schema (add column, rename table, drop table), mas não suporta lógica de negócio na migração (merge por email, hash de senha). O script de dados roda dentro de uma transação única, garantindo rollback total em caso de falha. A migração de schema cria as novas estruturas ANTES de dropar as antigas, permitindo o script copiar dados.

**Alternatives considered**:
- Raw SQL migration: Rejeitado — lógica de merge por email e hash de UUID requer código aplicação (bcryptjs).
- Prisma seed script: Rejeitado — seeds são para dados iniciais, não migrações de dados existentes.

## R2: Merge de Integrantes com Users por Email

**Decision**: Lógica de merge em 3 passos dentro da transação:
1. Para cada integrante, buscar user com mesmo email
2. Se encontrar: atualizar `telefone` do user, reatribuir FKs das junction tables
3. Se não encontrar: criar novo user com `name=nome`, `email=email`, `password=hash(uuid())`, `telefone=telefone`, reatribuir FKs

**Rationale**: O email é `@unique` em ambas as tabelas, tornando-o o campo natural de merge. A prioridade é manter os dados de auth do user existente (password, avatar, roles) e absorver apenas o `telefone` do integrante.

**Alternatives considered**:
- Merge por nome: Rejeitado — nomes podem ter variações (acentos, abreviações).
- Criar novo user sempre: Rejeitado — duplicaria users existentes.

## R3: Renomeação de Junction Tables

**Decision**: Renomear via Prisma migration: `eventos_integrantes` → `eventos_users`, `integrantes_funcoes` → `users_funcoes`. Atualizar FK de `fk_integrante_id` → `fk_user_id` em ambas.

**Rationale**: Prisma `@@map()` e `@map()` controlam os nomes físicos. A renomeação da FK mantém consistência semântica. O `@@unique` constraint é preservado com os novos nomes de campo.

**Alternatives considered**:
- Manter nomes antigos: Rejeitado — confuso ter `integrante_id` apontando para tabela `users`.
- Criar novas tables e copiar: Rejeitado — mais complexo, mesmo resultado.

## R4: Remoção da Extensão Prisma `$extends` para `senha`

**Decision**: Remover completamente o bloco `query.integrantes` do `$extends` em `prisma/cliente.ts`. O model `Integrantes` não existirá mais, e o campo `password` do Users já é protegido pelo `INTEGRANTE_PUBLIC_SELECT` (que será atualizado) e pelo padrão de não incluir `password` em queries.

**Rationale**: A extensão filtrava `senha` do model `Integrantes`. Com a unificação, o campo `senha` não existe mais. O `password` do Users é protegido pela mesma abordagem usada nos endpoints de auth (select explícito, nunca retornar password).

**Alternatives considered**:
- Manter extensão para Users.password: Rejeitado — os endpoints de auth já controlam isso via select explícito. Adicionar extensão global seria over-engineering.

## R5: Contagem do Dashboard — Users com Funções Musicais

**Decision**: O card "Equipe" no Dashboard contará users com pelo menos um vínculo em `Users_Funcoes` (query: `prisma.users_Funcoes.groupBy({ by: ['fk_user_id'] })` ou `count distinct`). O frontend atualmente faz isso client-side via `useIntegrantes().length`.

**Rationale**: Clarificação da spec — nem todo user é membro da equipe de louvor. Admins sem funções musicais não devem ser contados. A query mais simples é contar users distintos na junction table `Users_Funcoes`.

**Alternatives considered**:
- Contar todos os users: Rejeitado pelo stakeholder — inflaria a contagem com admins.
- Endpoint dedicado no backend: Considerado para futuro — por ora o frontend pode filtrar client-side ou usar o endpoint existente que já inclui `funcoes[]`.

## R6: Mapeamento de Campos nos Endpoints `/api/integrantes`

**Decision**: O controller/service de integrantes fará mapeamento de campos entre o model Users (inglês) e o response (português):
- `name` → `nome`
- `password` → não exposto (nunca retornado)
- `email` → `email` (mesmo nome)
- `telefone` → `telefone` (mesmo nome)
- `avatar` → não exposto nos endpoints de integrantes

No input (create/update): `nome` → `name`, `senha` → `password` (hasheado).

**Rationale**: Retrocompatibilidade total — o frontend e qualquer integração existente esperam campos em português. O mapeamento é feito no service layer, mantendo o repository operando diretamente sobre o model Users.

**Alternatives considered**:
- Renomear campos do Users para português: Rejeitado — quebraria toda a camada de auth existente.
- Usar Prisma computed fields: Rejeitado — over-engineering para mapeamento simples.

## R7: Prisma Migration Steps (Ordem)

**Decision**: A migração de schema será dividida em passos ordenados para evitar perda de dados:

1. `ALTER TABLE users ADD COLUMN telefone VARCHAR(20) NULL` — adicionar campo
2. Executar script de dados (merge integrantes → users, reatribuir FKs)
3. `ALTER TABLE eventos_integrantes RENAME TO eventos_users` — renomear junction
4. `ALTER TABLE integrantes_funcoes RENAME TO users_funcoes` — renomear junction
5. Renomear FK columns: `fk_integrante_id` → `fk_user_id` em ambas junction tables
6. Atualizar FK constraints para apontar para `users` ao invés de `integrantes`
7. `DROP TABLE integrantes` — remover tabela após migração completa

**Rationale**: A ordem garante que dados são migrados ANTES de dropar a tabela fonte. Prisma migration gera os passos 1, 3-7 automaticamente a partir do schema diff. O passo 2 é o script manual dentro da migration.

**Alternatives considered**:
- Fazer tudo em uma única Prisma migration: Parcialmente viável — o DDL sim, mas o script de dados precisa ser executado entre o ADD COLUMN e o DROP TABLE.
