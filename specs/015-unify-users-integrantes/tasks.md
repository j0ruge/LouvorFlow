# Tasks: Unificação das Tabelas Users e Integrantes

**Input**: Design documents from `/specs/018-unify-users-integrantes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/integrantes-api.md, quickstart.md

**Tests**: Not explicitly requested — test adaptation included in Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `packages/backend/`
- **Frontend**: `packages/frontend/`

---

## Phase 1: Foundational / User Story 1 — Migração de Dados (Priority: P1) 🎯 MVP

**Goal**: Unificar o schema Prisma (adicionar `telefone` a Users, renomear junction tables, remover model Integrantes) e migrar todos os dados de integrantes para users com merge por email em transação única.

**Independent Test**: Executar a migração em um banco com dados existentes e verificar que todos os integrantes aparecem como users, com seus eventos e funções preservados. Tabela `integrantes` não existe mais.

### Implementation

- [x] T001 [US1] Update Prisma schema (STEP 1 — keep Integrantes model): add `telefone` to Users, create `Eventos_Users` and `Users_Funcoes` models (with `fk_user_id`), add domain relations to Users, update Eventos and Funcoes relations. Do NOT remove Integrantes, Eventos_Integrantes, or Integrantes_Funcoes yet. Run `npx prisma migrate dev --name add-telefone-and-new-junctions` in `packages/backend/prisma/schema.prisma`
- [x] T002 [US1] Create and execute data migration script with transactional merge logic (match by email, absorve telefone, create new users with bcrypt(uuid()) password using 12 salt rounds, copy junction records from old tables to new tables with fk_user_id, handle integrantes with invalid/null email with clear error) in `packages/backend/prisma/migrations/data-migrate-integrantes.ts`
- [x] T003 [US1] Update Prisma schema (STEP 2 — remove old models): remove model Integrantes, Eventos_Integrantes, and Integrantes_Funcoes. Run `npx prisma migrate dev --name drop-integrantes` then `npx prisma generate` in `packages/backend/prisma/schema.prisma`
- [x] T004 [US1] Remove `integrantes` query extension from `$extends` in `packages/backend/prisma/cliente.ts` (FR-010). If no other extensions remain, simplify to plain `new PrismaClient()`
- [x] T005 [US1] Update type definitions: rename/update `CreateIntegranteInput`, `UpdateIntegranteInput`, `IntegranteWithFuncoes` and `INTEGRANTE_PUBLIC_SELECT` to operate on Users model fields (`name`, `password`, `telefone`) in `packages/backend/src/types/index.ts`

**Checkpoint**: Schema unified, data migrated, Prisma client regenerated. All downstream stories can begin.

---

## Phase 2: User Story 2 — Backend Unificado: APIs de Integrantes operam sobre Users (Priority: P1)

**Goal**: O CRUD `/api/integrantes` e o gerenciamento de funções musicais operam sobre a tabela `users` com mapeamento de campos (nome↔name, senha↔password). Criar integrante agora cria um user com capacidade de login.

**Independent Test**: `GET /api/integrantes` retorna users com campos em português. `POST /api/integrantes` cria user que pode fazer login via `/api/sessions`.

### Implementation

- [x] T006 [US2] Rewrite integrantes repository to query `users` table: update all Prisma queries (`findAll`, `findById`, `findByEmail`, `create`, `update`, `delete`) to use `prisma.users` with `Users_Funcoes` includes, update `INTEGRANTE_PUBLIC_SELECT` to use `name` + map to `nome` in `packages/backend/src/repositories/integrantes.repository.ts`
- [x] T007 [US2] Rewrite integrantes service: map input fields (`nome`→`name`, `senha`→`password` with bcrypt hash), map output fields (`name`→`nome`), update `Users_Funcoes` references (was `Integrantes_Funcoes`), update junction field names (`fk_user_id`, `users_funcoes_funcao_id_fkey`) in `packages/backend/src/services/integrantes.service.ts`
- [x] T008 [US2] Update integrantes controller if needed (service handles mapping, controller should need minimal changes) in `packages/backend/src/controllers/integrantes.controller.ts`
- [x] T009 [P] [US2] Create Zod validation schemas for integrantes endpoints (create, update, params) in `packages/backend/src/validators/integrantes.validators.ts`
- [x] T010 [US2] Add `validateRequest` middleware with Zod schemas to integrantes routes in `packages/backend/src/routes/integrantes.routes.ts`
- [x] T011 [US2] Smoke test: verify `GET /api/integrantes`, `POST /api/integrantes` (creates user), `GET /api/integrantes/:id`, `PUT /api/integrantes/:id`, `DELETE /api/integrantes/:id`, funcoes CRUD, and login via `/api/sessions` with integrante credentials

**Checkpoint**: All `/api/integrantes` endpoints work against Users table. New integrantes can login.

---

## Phase 3: User Story 3 — Frontend: Tela de Integrantes (Priority: P2)

**Goal**: A tela de membros (`Members.tsx`) e o formulário (`IntegranteForm.tsx`) continuam funcionando normalmente consumindo o backend unificado. Schemas Zod do frontend alinhados com o novo contrato.

**Independent Test**: Navegar à tela de Integrantes, criar um novo membro, editar seus dados e funções, verificar que tudo funciona como antes.

### Implementation

- [x] T012 [P] [US3] Update frontend integrante Zod schemas to align with unified API response (verify fields match: `id`, `nome`, `email`, `telefone`, `funcoes[]`) in `packages/frontend/src/schemas/integrante.ts`
- [x] T013 [P] [US3] Update frontend integrantes service if any response parsing changes needed in `packages/frontend/src/schemas/integrante.ts` validation in `packages/frontend/src/services/integrantes.ts`
- [x] T014 [US3] Update integrantes hooks if type references changed in `packages/frontend/src/hooks/use-integrantes.ts`
- [x] T015 [US3] Verify Members page works with unified backend (list, create, edit, delete, funcoes management) — update if needed in `packages/frontend/src/pages/Members.tsx`
- [x] T016 [US3] Verify IntegranteForm works (create with senha, edit without, funcoes management) — update if needed in `packages/frontend/src/components/IntegranteForm.tsx`

**Checkpoint**: Members page fully functional against unified backend.

---

## Phase 4: User Story 4 — Eventos: Escalas referenciam Users (Priority: P2)

**Goal**: Os endpoints de associação evento↔integrante (`/api/eventos/:eventoId/integrantes`) operam sobre `Eventos_Users`. Frontend de eventos exibe membros corretamente.

**Independent Test**: Criar evento, associar membros, verificar que dados aparecem corretamente.

### Implementation

- [x] T017 [US4] Update eventos repository: change junction table queries from `Eventos_Integrantes` → `Eventos_Users`, update FK field from `fk_integrante_id` → `fk_user_id`, update includes to use `Users_Funcoes` instead of `Integrantes_Funcoes`, update relation names in `packages/backend/src/repositories/eventos.repository.ts`
- [x] T018 [US4] Update eventos service: change junction references, update field mappings in `listIntegrantes` transformation (`eventos_users_fk_user_id_fkey` instead of `eventos_integrantes_fk_integrante_id_fkey`), map `name`→`nome` in response, rewrite `addIntegrante` validation to use rewritten integrantesRepository (queries `users` table), map request field `fk_integrante_id` → `fk_user_id` internally in `packages/backend/src/services/eventos.service.ts`
- [x] T019 [US4] Update eventos controller if needed (verify integrante association methods use correct field names) in `packages/backend/src/controllers/eventos.controller.ts`
- [x] T020 [P] [US4] Update frontend evento schemas: verify `IntegranteEventoSchema` and event response schemas match unified API in `packages/frontend/src/schemas/evento.ts`
- [x] T021 [US4] Update EventoDetail component: verify integrante display, add/remove integrante functionality works with unified backend in `packages/frontend/src/components/EventoDetail.tsx`
- [x] T022 [P] [US4] Update frontend eventos service if request/response field names changed in `packages/frontend/src/services/eventos.ts`
- [x] T023 [US4] Smoke test: create event, add integrante, list integrantes in event, remove integrante

**Checkpoint**: Events with member association fully functional.

---

## Phase 5: User Story 5 — Dashboard: Contagem por Funções Musicais (Priority: P3)

**Goal**: O card "Equipe" no Dashboard conta apenas users com pelo menos uma função musical vinculada (via `Users_Funcoes`).

**Independent Test**: Com 10 users (8 com funções, 2 sem), Dashboard mostra 8 no card "Equipe".

### Implementation

- [x] T024 [US5] Update Dashboard page: filter integrantes count to only include users with `funcoes.length > 0` (client-side filtering using existing `useIntegrantes()` data which includes `funcoes[]`) in `packages/frontend/src/pages/Dashboard.tsx`

**Checkpoint**: Dashboard shows accurate member count (excludes admin-only users).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, tests, and final validation across all stories.

- [x] T025 [P] Update OpenAPI documentation to reflect unified schema: update integrantes endpoints, remove Integrantes model, add `telefone` to Users schema, update junction table references in `packages/backend/docs/openapi.json`
- [x] T026 [P] Update backend tests: adapt all integrantes-related test files to use Users model, update fixtures/fakes/mocks, ensure all existing tests pass in `packages/backend/tests/`
- [x] T027 [P] Update frontend tests: adapt integrantes-related test files if any exist in `packages/frontend/tests/` or `packages/frontend/src/**/*.test.*`
- [x] T028 Run full test suite (`npm test` in both packages) and fix any failures
- [x] T029 Run quickstart.md validation: execute smoke test sequence (start DB, apply migration, run data script, start backend, test endpoints, start frontend, verify UI)
- [x] T030 Update project documentation: ensure CLAUDE.md, README.md, backend-api.md rules, and MEMORY.md reflect unified model (model count 20, junction table names, removed Integrantes references)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational/US1)**: No dependencies — start immediately. BLOCKS all other phases.
- **Phase 2 (US2)**: Depends on Phase 1 completion (schema must be unified)
- **Phase 3 (US3)**: Depends on Phase 2 (frontend needs working backend)
- **Phase 4 (US4)**: Depends on Phase 1 and Phase 2 (eventos service uses integrantesRepository for validation)
- **Phase 5 (US5)**: Depends on Phase 3 (uses `useIntegrantes()` hook)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Foundation — no dependencies, blocks everything
- **US2 (P1)**: Depends on US1 only
- **US3 (P2)**: Depends on US2 (needs backend API working)
- **US4 (P2)**: Depends on US1 and US2 (T006 minimum — eventos service validates integrante existence via integrantesRepository)
- **US5 (P3)**: Depends on US3 (uses same hooks/services)

### Within Each User Story

- Repository before service
- Service before controller
- Backend before frontend
- Schema changes before code changes

### Parallel Opportunities

- **Phase 1**: T001 must complete before T002-T005. T004 and T005 can run in parallel after T003.
- **Phase 2**: T009 (validators) can run parallel with T006-T008. T006→T007→T008 sequential.
- **Phase 3**: T012 and T013 can run in parallel.
- **Phase 4**: T020 and T022 can run parallel with T017-T019 (frontend ∥ backend).
- **Phase 6**: T025, T026, T027 can all run in parallel.

---

## Parallel Example: Phase 3 + Phase 4 (after Phase 2 completes)

```text
# After Phase 2 completes, these can run in parallel:

# Stream A (US3 — frontend integrantes):
Task T012: "Update frontend integrante schemas"
Task T013: "Update frontend integrantes service"

# Stream B (US4 — eventos backend + frontend):
Task T017: "Update eventos repository"
Task T018: "Update eventos service"
Task T019: "Update eventos controller"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Schema migration + data migration (US1)
2. Complete Phase 2: Backend API unification (US2)
3. **STOP and VALIDATE**: Smoke test all `/api/integrantes` endpoints + login
4. Backend is fully functional — frontend can be updated incrementally

### Incremental Delivery

1. Phase 1 (US1) → Schema unified, data migrated
2. Phase 2 (US2) → Backend APIs working → Smoke test
3. Phase 3 (US3) → Frontend integrantes working → UI test
4. Phase 4 (US4) → Events working → UI test
5. Phase 5 (US5) → Dashboard accurate → Visual check
6. Phase 6 → Tests pass, docs updated → Ready for PR

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The API response contract is unchanged — frontend changes should be minimal
- Field mapping (nome↔name, senha↔password) is handled in the service layer
- The Prisma migration step (T003) requires interactive terminal for `migrate dev`
- Commit after each phase completion for clean git history
