# Implementation Plan: Remover Campo Documento de Integrantes

**Branch**: `012-remove-documento-integrante` | **Date**: 2026-02-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-remove-documento-integrante/spec.md`

## Summary

Remover completamente o campo `doc_id` (documento de identificação) da entidade Integrantes em todas as camadas: banco de dados (Prisma), backend (service, repository, types, testes) e frontend (schemas, formulário). Substituir a validação de unicidade de `doc_id` por validação de unicidade de `email` no service layer, já que o email será usado como identificador de login.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend via Sucrase, frontend via Vite)
**Primary Dependencies**: Express 5, Prisma 6, React 18, Zod, shadcn/ui, Vitest 4
**Storage**: PostgreSQL 17 (Docker, porta 35432)
**Testing**: Vitest 4 com fake repositories (padrão existente)
**Target Platform**: Web application (mobile-first responsive)
**Project Type**: web (monorepo com backend + frontend)
**Performance Goals**: N/A (mudança subtrativa)
**Constraints**: Manter compatibilidade com todas as funcionalidades existentes de integrantes
**Scale/Scope**: ~11 arquivos afetados, ~15 mudanças pontuais

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Mobile-First & Cross-Platform Ready | PASS | Remoção de campo não afeta responsividade. |
| II. Relational Data Integrity | PASS | Migração via Prisma. Email mantém unique constraint. |
| III. RESTful API as Single Source of Truth | PASS | Endpoints continuam iguais, apenas campo removido. |
| IV. Version-Centric Repertoire Model | N/A | Não afeta músicas/versões. |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Remoção simplifica o modelo. |

**Gate result**: PASS — nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/012-remove-documento-integrante/
├── spec.md              # Especificação da feature
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── integrantes.yaml # Contrato API atualizado
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma              # Remover doc_id do model Integrantes
│   ├── src/
│   │   ├── types/index.ts             # Remover doc_id da interface e do SELECT
│   │   ├── repositories/
│   │   │   └── integrantes.repository.ts  # Remover findByDocId*, adicionar findByEmail*
│   │   └── services/
│   │       └── integrantes.service.ts     # Trocar validação doc_id por email
│   └── tests/
│       ├── fakes/
│       │   ├── mock-data.ts               # Remover doc_id dos mocks
│       │   └── fake-integrantes.repository.ts  # Atualizar métodos fake
│       └── services/
│           └── integrantes.service.test.ts     # Atualizar testes
└── frontend/
    └── src/
        ├── schemas/integrante.ts          # Remover doc_id dos schemas Zod
        └── components/IntegranteForm.tsx   # Remover campo Documento do form
```

**Structure Decision**: Web application (Option 2) — monorepo existente com `packages/backend` e `packages/frontend`.

## Complexity Tracking

> Nenhuma violação de constitution. Tabela não necessária.

## Implementation Phases

### Phase 1: Schema & Migration (banco de dados)

1. Remover `doc_id String @unique` do model `Integrantes` em `schema.prisma`
2. Executar `npx prisma migrate dev --name remove-doc-id` para gerar migration

**Resultado**: Coluna `doc_id` e índice `integrantes_doc_id_key` removidos do banco.

### Phase 2: Backend — Types & Repository

1. **types/index.ts**:
   - Remover `doc_id: string` de `IntegranteWithFuncoes`
   - Remover `doc_id: true` de `INTEGRANTE_PUBLIC_SELECT`

2. **integrantes.repository.ts**:
   - Remover método `findByDocId(doc_id)`
   - Remover método `findByDocIdExcludingId(doc_id, excludeId)`
   - Adicionar método `findByEmail(email)` — busca por email para validação e login
   - Adicionar método `findByEmailExcludingId(email, excludeId)` — para validação em update

### Phase 3: Backend — Service

1. **integrantes.service.ts** — método `create()`:
   - Remover normalização de `doc_id` (`.replace(/\D/g, '')`)
   - Remover checagem de duplicidade de `doc_id`
   - Adicionar checagem de duplicidade de `email` via `findByEmail()`

2. **integrantes.service.ts** — método `update()`:
   - Remover normalização de `doc_id`
   - Remover checagem de duplicidade de `doc_id`
   - Adicionar checagem de duplicidade de `email` via `findByEmailExcludingId()` (quando email é alterado)

### Phase 4: Backend — Testes

1. **mock-data.ts**: Remover propriedade `doc_id` dos 3 objetos em `MOCK_INTEGRANTES`
2. **fake-integrantes.repository.ts**:
   - Remover `doc_id` de `buildWithFuncoes()` e `buildPublic()`
   - Remover métodos `findByDocId()` e `findByDocIdExcludingId()`
   - Adicionar métodos `findByEmail()` e `findByEmailExcludingId()`
3. **integrantes.service.test.ts**:
   - Remover teste "deve normalizar doc_id removendo caracteres não numéricos"
   - Remover teste de duplicidade de doc_id no create
   - Remover teste de duplicidade de doc_id no update
   - Adicionar teste de duplicidade de email no create
   - Adicionar teste de duplicidade de email no update

### Phase 5: Frontend

1. **schemas/integrante.ts**:
   - Remover `doc_id` de `IntegranteComFuncoesSchema`
   - Remover `doc_id` de `IntegranteResponseSchema`
   - Remover `doc_id` de `CreateIntegranteFormSchema`
   - Remover `doc_id` de `UpdateIntegranteFormSchema`

2. **IntegranteForm.tsx**:
   - Remover `doc_id: ""` dos default values
   - Remover `doc_id: integrante.doc_id` do useEffect de edição
   - Remover `doc_id: ""` do reset
   - Remover bloco JSX do campo "Documento" (FormField com name="doc_id")

### Phase 6: Smoke Test & Validação

1. Executar `npm test` em backend e frontend
2. Smoke test via API: POST /api/integrantes sem doc_id
3. Smoke test via API: GET /api/integrantes — verificar ausência de doc_id na resposta
4. Smoke test via API: POST /api/integrantes com email duplicado — verificar erro 409
