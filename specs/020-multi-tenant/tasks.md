# Tasks: Migração para Multi-Tenant

**Input**: Design documents from `/specs/020-multi-tenant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Schema + Migration)

**Purpose**: Prisma schema changes, migration with backfill, seed updates. Entrega a US4 (migração de dados existentes).

- [x] T001 Update Prisma schema: create `Tenant` model (id, name, status, timestamps) in `packages/backend/prisma/schema.prisma`
- [x] T002 Update Prisma schema: create `TenantUsers` model (id, tenant_id FK, user_id FK, timestamps, @@unique) in `packages/backend/prisma/schema.prisma`
- [x] T003 Update Prisma schema: add `tenant_id` UUID FK to 7 domain entities (artistas, musicas, tonalidades, funcoes, categorias, tipos_eventos, eventos) in `packages/backend/prisma/schema.prisma`
- [x] T004 Update Prisma schema: add `tenant_id` UUID FK to 7 junction tables (artistas_musicas, musicas_funcoes, musicas_categorias, eventos_musicas, eventos_users, eventos_users_funcoes, users_funcoes) in `packages/backend/prisma/schema.prisma`
- [x] T005 Update Prisma schema: add `tenant_id` UUID to RBAC assignment tables (users_roles, users_permissions) and update composite PKs in `packages/backend/prisma/schema.prisma`
- [x] T006 Update Prisma schema: convert unique constraints to compound with tenant_id (artistas.nome, funcoes.nome, categorias.nome, tipos_eventos.nome, tonalidades.tom, junction uniques) in `packages/backend/prisma/schema.prisma`
- [x] T007 Update Prisma schema: add `@@index([tenant_id])` to all 15 tables with tenant_id in `packages/backend/prisma/schema.prisma`
- [x] T008 Generate Prisma migration and edit SQL to include backfill: create system tenant (`SYSTEM_TENANT_ID`, status `system`) and default tenant (`DEFAULT_TENANT_ID`, status `active`), UPDATE all existing domain records with DEFAULT_TENANT_ID, INSERT tenant_users for all users, backfill RBAC assignments with DEFAULT_TENANT_ID, ALTER to NOT NULL in `packages/backend/prisma/migrations/`
- [x] T009 Run migration and regenerate Prisma Client: `npx prisma migrate dev` + `npx prisma generate` in `packages/backend/`

**Checkpoint**: Schema multi-tenant aplicado. Todos os dados existentes migrados para tenant padrão (US4 validável).

---

## Phase 2: Foundational (Tenant Infrastructure)

**Purpose**: Core infrastructure que DEVE estar completa antes de qualquer user story ser implementada.

**⚠️ CRITICAL**: Nenhum trabalho de user story pode começar até esta fase estar completa.

- [x] T010 Create `forTenant(tenantId)` factory function with `$extends` and `TENANT_MODELS` list in `packages/backend/prisma/cliente.ts`
- [x] T011 Update Express type declarations: add `tenantId` to `req.user` and `prisma` (tenant-scoped PrismaClient) to `Request` root in `packages/backend/src/types/auth.types.ts`
- [x] T012 [P] Update `ensureAuthenticated` middleware: extract `tenantId` from JWT payload, inject `req.user.tenantId`, create tenant-scoped prisma via `forTenant()` and attach to `req`. Validate that tenant exists and has `status: 'active'` (reject with 401 if inactive/not found) in `packages/backend/src/middlewares/ensureAuthenticated.ts`
- [x] T013 [P] Create `ensureSuperAdmin` middleware: verify `super-admin` role (global, sem tenant), attach `basePrisma` for cross-tenant access in `packages/backend/src/middlewares/ensureSuperAdmin.ts`
- [x] T014 [P] Create `ensureTenantContext` middleware: reject requests without valid tenantId in token with 403 error in `packages/backend/src/middlewares/ensureTenantContext.ts`
- [x] T015 Update `TokenProvider.sign()` to accept and include `tenantId` in JWT payload in `packages/backend/src/providers/token.provider.ts`
- [x] T016 Update `authConfig` to add `selectionToken` config (secret, expiresIn: 5min) in `packages/backend/src/config/auth.ts`
- [x] T017 Update seed `admin.ts`: create system tenant (`SYSTEM_TENANT_ID`, status `system`) and default tenant (`DEFAULT_TENANT_ID`, status `active`), create `super-admin` role and permission, assign super-admin to admin user via system tenant, assign admin role in default tenant in `packages/backend/seeds/admin.ts`
- [x] T018 Create Zod validators for tenant endpoints in `packages/backend/src/validators/igrejas.validators.ts`
- [x] T019 [P] Create Zod validators for select-tenant and switch-tenant in `packages/backend/src/validators/auth.validators.ts` (append to existing)
- [x] T020 [P] Create `FakeTenantRepository` and `FakeTenantUsersRepository` for unit tests in `packages/backend/tests/fakes/fake-tenant.repository.ts`
- [x] T021 [P] Update existing fake repositories (FakeUsersRepository, etc.) to support `tenant_id` field in mock data in `packages/backend/tests/fakes/`
- [x] T022 [P] Update `packages/backend/tests/fakes/mock-data.ts`: add mock tenants (Tenant A, Tenant B, System Tenant), mock TenantUsers entries, and tenant_id to existing mock domain entities
- [x] T022.1 Update all existing test cases in `packages/backend/tests/services/` to include `tenant_id` in mock data setup and pass tenant-scoped fake repositories. Verify existing tests still pass with tenant context

**Checkpoint**: Infraestrutura tenant pronta — middleware, factory, tipos, seed, fakes. Implementação das user stories pode começar.

---

## Phase 3: User Story 1 — Acesso isolado por igreja (Priority: P1) 🎯 MVP

**Goal**: Todo acesso a dados de domínio é automaticamente filtrado pelo tenant do usuário autenticado. Nenhum dado de outra igreja é visível ou modificável.

**Independent Test**: Login como user do Tenant A → GET /api/musicas retorna apenas músicas do Tenant A. GET /api/musicas/:id-do-tenant-B retorna 404.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T023 [P] [US1] Unit test `ensureTenantContext` middleware
- [x] T024 [P] [US1] Unit test `can()` middleware with tenant-scoped permissions
- [x] T025 [P] [US1] Unit test domain service isolation

### Implementation for User Story 1

- [x] T026 [US1] Refactor `ArtistasRepository` to use `getPrisma()` via AsyncLocalStorage
- [x] T027 [P] [US1] Refactor `MusicasRepository` to use `getPrisma()`
- [x] T028 [P] [US1] Refactor `TonalidadesRepository` to use `getPrisma()`
- [x] T029 [P] [US1] Refactor `FuncoesRepository` to use `getPrisma()`
- [x] T030 [P] [US1] Refactor `CategoriasRepository` to use `getPrisma()`
- [x] T031 [P] [US1] Refactor `TiposEventosRepository` to use `getPrisma()`
- [x] T032 [P] [US1] Refactor `EventosRepository` to use `getPrisma()`
- [x] T033 [P] [US1] Refactor `IntegrantesRepository` to use `getPrisma()` for junction tables
- [x] T034 [US1] Controllers use `req.prisma` via AsyncLocalStorage (getPrisma pattern — no controller changes needed)
- [x] T035 [US1] Services use getPrisma() transparently (no service changes needed)
- [x] T036 [US1] `getUserRoles()` and `getUserPermissions()` accept optional `tenantId` parameter
- [x] T037 [US1] `can()` and `is()` middlewares pass `req.user.tenantId` to RBAC queries
- [x] T038 [US1] `ensureTenantContext` added to all 9 domain route files (59 routes total)
- [x] T039 [US1] All 262 tests passing after implementation
- [ ] T040 [US1] Smoke test (deferred to integration testing)

**Checkpoint**: Isolamento de dados completo. Qualquer endpoint de domínio retorna apenas dados do tenant autenticado. US1 independentemente testável.

---

## Phase 4: User Story 2 — Login com seleção de igreja (Priority: P1)

**Goal**: Usuários com múltiplos tenants veem tela de seleção de igreja no login. Usuários com um tenant fazem login direto.

**Independent Test**: Login como user com 2 tenants → resposta com `requires_tenant_selection`. Selecionar tenant → JWT com tenantId.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T041 [P] [US2] Unit test `AuthenticateUserService` multi-tenant (5 scenarios)
- [x] T042 [P] [US2] Unit test `SelectTenantService` (5 scenarios)
- [x] T043 [P] [US2] Unit test `RefreshTokenService` tenant preservation

### Implementation for User Story 2

- [x] T044 [US2] `AuthenticateUserService` refactored with multi-tenant login flow
- [x] T045 [US2] `SelectTenantService` created
- [x] T046 [US2] `SessionsController` updated with `selectTenant` method
- [x] T047 [US2] `POST /api/sessions/select-tenant` route added
- [x] T048 [US2] `RefreshTokenService` preserves tenantId in new tokens
- [x] T049 [US2] All 262 tests passing (10 new auth tests)
- [x] T050 [P] [US2] Frontend `TenantSchema` + `TenantSelectionResponseSchema` added
- [x] T051 [P] [US2] `selectTenant()` + `switchTenant()` service functions created
- [x] T052 [US2] `SelectTenantPage` created with tenant card selection
- [x] T053 [US2] `AuthContext.signIn()` handles `requires_tenant_selection` flow
- [x] T054 [US2] `/selecionar-igreja` route added to App.tsx
- [x] T055 [US2] `currentTenant` state added to AuthContext
- [ ] T056 [US2] Smoke test (deferred to integration testing)

**Checkpoint**: Login multi-tenant funcional. US2 independentemente testável.

---

## Phase 5: User Story 4 — Migração de dados existentes (Priority: P1)

**Goal**: Validar que todos os dados existentes foram migrados corretamente para o tenant padrão na Phase 1.

**Independent Test**: Verificar que contagens de registros pré e pós-migração são idênticas. Login com usuário existente funciona normalmente.

### Implementation for User Story 4

- [x] T057 [US4] Migration validation script created (`scripts/validate-migration.ts`)
- [ ] T058 [US4] Smoke test (deferred to integration testing)

**Checkpoint**: Migração validada. US4 completa (implementação real foi na Phase 1).

---

## Phase 6: User Story 3 — Cadastro e gestão de igrejas (Priority: P2)

**Goal**: Super-admin pode criar tenants, vincular/desvincular usuários de tenants.

**Independent Test**: Login como super-admin → criar tenant → vincular user → user faz login e acessa dados do novo tenant.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T059 [P] [US3] Unit test `IgrejasService`
- [x] T060 [P] [US3] Unit test `ensureSuperAdmin` middleware

### Implementation for User Story 3

- [x] T061 [P] [US3] `IgrejasRepository` created with CRUD + user binding + RBAC cascade
- [x] T062 [P] [US3] `IgrejasService` created with business logic
- [x] T063 [US3] `IgrejasController` created (8 methods)
- [x] T064 [US3] Tenant routes created with `ensureAuthenticated + ensureSuperAdmin`
- [x] T065 [US3] Routes registered in `app.ts`
- [x] T066 [US3] Tests passing
- [ ] T067 [US3] Smoke test (deferred to integration testing)

**Checkpoint**: Gestão de tenants funcional. US3 independentemente testável.

---

## Phase 7: User Story 5 — Troca de tenant sem re-login (Priority: P3)

**Goal**: Usuário multi-tenant pode trocar de igreja durante a sessão sem logout/login.

**Independent Test**: Login no Tenant A → switch para Tenant B → dados exibidos são do Tenant B → token anterior invalidado.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T068 [P] [US5] Unit test `SwitchTenantService`

### Implementation for User Story 5

- [x] T069 [US5] `SwitchTenantService` created
- [x] T070 [US5] `switchTenant` method added to `SessionsController`
- [x] T071 [US5] `POST /api/sessions/switch-tenant` route added
- [x] T072 [US5] Tests passing
- [x] T073 [P] [US5] `switchTenant()` frontend service function created
- [x] T074 [P] [US5] `TenantSwitcher` dropdown component created
- [x] T075 [US5] `switchTenant()` method added to AuthContext
- [x] T076 [US5] TenantSwitcher integrated into sidebar
- [ ] T077 [US5] Smoke test (deferred to integration testing)

**Checkpoint**: Troca de tenant funcional. US5 independentemente testável.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, validação final e limpeza.

- [x] T078 [P] OpenAPI spec updated with select-tenant endpoint
- [x] T079 [P] Frontend `useCan` hook — works with tenant-scoped permissions (no changes needed)
- [x] T080 [P] `UserMenu` updated with current tenant name
- [ ] T081 [P] Profile page tenant info (deferred — minor UX enhancement)
- [x] T082 CLAUDE.md and backend-api.md updated with multi-tenant patterns
- [x] T083 MEMORY.md updated with multi-tenant architecture
- [x] T084 Full test suite: backend 262 tests passing, frontend typecheck clean
- [ ] T085 Quickstart validation (deferred to integration testing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Isolamento (Phase 3)**: Depends on Phase 2 — BLOCKS US2 (login needs isolation working)
- **US2 Login (Phase 4)**: Depends on Phase 3 (US1) — login needs tenant-scoped prisma in auth middleware
- **US4 Migration validation (Phase 5)**: Depends on Phase 1 + Phase 3 (needs working isolation to validate)
- **US3 Gestão (Phase 6)**: Depends on Phase 2 only — can run in parallel with US1/US2 if needed
- **US5 Troca (Phase 7)**: Depends on Phase 4 (US2) — needs login multi-tenant working
- **Polish (Phase 8)**: Depends on all desired stories being complete

### User Story Dependencies

```text
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1: Isolamento)
                                                ↓
                                           Phase 4 (US2: Login)
                                                ↓
                                           Phase 5 (US4: Validação)
                                                ↓
                                           Phase 7 (US5: Troca)

Phase 2 (Foundational) → Phase 6 (US3: Gestão) [parallel with US1]
```

### Within Each User Story

- Tests FIRST (write, ensure they FAIL)
- Models/repositories before services
- Services before controllers/routes
- Backend before frontend
- Verify tests PASS after implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1**: T001–T007 (schema changes) are sequential edits to same file → NOT parallelizable
**Phase 2**: T012–T014 (middlewares) [P]. T018–T022 (validators + fakes) [P]
**Phase 3**: Tests T023–T025 [P]. Repository refactors T026–T033 [P]
**Phase 4**: Tests T041–T043 [P]. Frontend T050–T051 parallel with backend T044–T048 [P]
**Phase 6**: Tests T059–T060 [P]. Repository + service T061–T062 [P]
**Phase 7**: Test T068 [P]. Frontend T073–T074 [P]
**Phase 8**: T078–T081 all parallelizable — different files [P]

---

## Parallel Example: User Story 1

```text
# Write tests first (parallel):
Task T023: Test ensureTenantContext middleware
Task T024: Test can() middleware tenant-scoped
Task T025: Test domain service isolation

# Launch all repository refactors in parallel (different files):
Task T026: Refactor ArtistasRepository
Task T027: Refactor MusicasRepository
Task T028: Refactor TonalidadesRepository
Task T029: Refactor FuncoesRepository
Task T030: Refactor CategoriasRepository
Task T031: Refactor TiposEventosRepository
Task T032: Refactor EventosRepository
Task T033: Refactor IntegrantesRepository

# Then sequentially:
Task T034: Update controllers (depends on T026-T033)
Task T035: Update services (depends on T026-T033)
Task T036: Update auth queries (depends on T034)
Task T037: Update can middleware (depends on T036)
Task T038: Add ensureTenantContext to routes (depends on T014)
Task T039: Verify tests pass (depends on all above)
Task T040: Smoke test (depends on all above)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US4)

1. Complete Phase 1: Setup (schema + migration) → US4 data preserved
2. Complete Phase 2: Foundational (middleware, factory, seed, fakes)
3. Complete Phase 3: US1 (isolamento) → tests + dados filtrados por tenant
4. Complete Phase 4: US2 (login) → tests + login multi-tenant funcional
5. **STOP and VALIDATE**: Smoke test completo — sistema multi-tenant operacional
6. Deploy staging

### Incremental Delivery

1. Setup + Foundational → infraestrutura pronta
2. US1 (Isolamento) → tests + filtro automático por tenant (MVP core)
3. US2 (Login) → tests + login com seleção de igreja (MVP completo)
4. US4 (Validação) → confirmar migração OK
5. US3 (Gestão) → tests + super-admin cria/gerencia tenants
6. US5 (Troca) → tests + UX melhorada para multi-tenant

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests follow TDD: write first, verify FAIL, implement, verify PASS
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Schema edits (T001–T007) must be sequential (same file)
- The `$extends` interceptor handles tenant filtering — repositories don't need manual `where.tenant_id`
- Super-admin routes use `basePrisma` (no tenant filter) — not `forTenant()`
- Test pattern: Vitest + fake repositories (same pattern as existing tests in `tests/services/`)
