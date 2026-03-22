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

- [ ] T010 Create `forTenant(tenantId)` factory function with `$extends` and `TENANT_MODELS` list in `packages/backend/prisma/cliente.ts`
- [ ] T011 Update Express type declarations: add `tenantId` to `req.user` and `prisma` (tenant-scoped PrismaClient) to `Request` root in `packages/backend/src/types/express.d.ts`
- [ ] T012 [P] Update `ensureAuthenticated` middleware: extract `tenantId` from JWT payload, inject `req.user.tenantId`, create tenant-scoped prisma via `forTenant()` and attach to `req`. Validate that tenant exists and has `status: 'active'` (reject with 401 if inactive/not found) in `packages/backend/src/middlewares/ensureAuthenticated.ts`
- [ ] T013 [P] Create `ensureSuperAdmin` middleware: verify `super-admin` role (global, sem tenant), attach `basePrisma` for cross-tenant access in `packages/backend/src/middlewares/ensureSuperAdmin.ts`
- [ ] T014 [P] Create `ensureTenantContext` middleware: reject requests without valid tenantId in token with 403 error in `packages/backend/src/middlewares/ensureTenantContext.ts`
- [ ] T015 Update `TokenProvider.sign()` to accept and include `tenantId` in JWT payload in `packages/backend/src/providers/token.provider.ts`
- [ ] T016 Update `authConfig` to add `selectionToken` config (secret, expiresIn: 5min) in `packages/backend/src/config/auth.ts`
- [ ] T017 Update seed `admin.ts`: create system tenant (`SYSTEM_TENANT_ID`, status `system`) and default tenant (`DEFAULT_TENANT_ID`, status `active`), create `super-admin` role and permission, assign super-admin to admin user via system tenant, assign admin role in default tenant in `packages/backend/seeds/admin.ts`
- [ ] T018 Create Zod validators for tenant endpoints in `packages/backend/src/validators/igrejas.validators.ts`
- [ ] T019 [P] Create Zod validators for select-tenant and switch-tenant in `packages/backend/src/validators/auth.validators.ts` (append to existing)
- [ ] T020 [P] Create `FakeTenantRepository` and `FakeTenantUsersRepository` for unit tests in `packages/backend/tests/fakes/fake-tenant.repository.ts`
- [ ] T021 [P] Update existing fake repositories (FakeUsersRepository, etc.) to support `tenant_id` field in mock data in `packages/backend/tests/fakes/`
- [ ] T022 [P] Update `packages/backend/tests/fakes/mock-data.ts`: add mock tenants (Tenant A, Tenant B, System Tenant), mock TenantUsers entries, and tenant_id to existing mock domain entities
- [ ] T022.1 Update all existing test cases in `packages/backend/tests/services/` to include `tenant_id` in mock data setup and pass tenant-scoped fake repositories. Verify existing tests still pass with tenant context

**Checkpoint**: Infraestrutura tenant pronta — middleware, factory, tipos, seed, fakes. Implementação das user stories pode começar.

---

## Phase 3: User Story 1 — Acesso isolado por igreja (Priority: P1) 🎯 MVP

**Goal**: Todo acesso a dados de domínio é automaticamente filtrado pelo tenant do usuário autenticado. Nenhum dado de outra igreja é visível ou modificável.

**Independent Test**: Login como user do Tenant A → GET /api/musicas retorna apenas músicas do Tenant A. GET /api/musicas/:id-do-tenant-B retorna 404.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [P] [US1] Unit test `ensureTenantContext` middleware: rejects request without tenantId (403), allows request with valid tenantId in `packages/backend/tests/middlewares/ensure-tenant-context.test.ts`
- [ ] T024 [P] [US1] Unit test `can()` middleware with tenant-scoped permissions: user with `musicas.write` in Tenant A cannot write in Tenant B; verifies `getUserRoles`/`getUserPermissions` receive tenantId in `packages/backend/tests/middlewares/can-tenant.test.ts`
- [ ] T025 [P] [US1] Unit test domain service isolation: given a fake repository with data from Tenant A and Tenant B, service called with Tenant A context returns only Tenant A data. Test with at least one service (e.g., `MusicasService` or `ArtistasService`) in `packages/backend/tests/services/tenant-isolation.test.ts`

### Implementation for User Story 1

- [ ] T026 [US1] Refactor `ArtistasRepository`: replace direct `prisma` import with tenant-scoped prisma received via constructor or parameter in `packages/backend/src/repositories/artistas.repository.ts`
- [ ] T027 [P] [US1] Refactor `MusicasRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/musicas.repository.ts`
- [ ] T028 [P] [US1] Refactor `TonalidadesRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/tonalidades.repository.ts`
- [ ] T029 [P] [US1] Refactor `FuncoesRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/funcoes.repository.ts`
- [ ] T030 [P] [US1] Refactor `CategoriasRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/categorias.repository.ts`
- [ ] T031 [P] [US1] Refactor `TiposEventosRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/tipos-eventos.repository.ts`
- [ ] T032 [P] [US1] Refactor `EventosRepository`: replace direct `prisma` import with tenant-scoped prisma in `packages/backend/src/repositories/eventos.repository.ts`
- [ ] T033 [P] [US1] Refactor `IntegrantesRepository` (operates on Users table): add tenant-scoped queries for Users_Funcoes and Eventos_Users in `packages/backend/src/repositories/integrantes.repository.ts`
- [ ] T034 [US1] Update all domain controllers to pass `req.prisma` (tenant-scoped) to services/repositories in `packages/backend/src/controllers/`
- [ ] T035 [US1] Update all domain services to accept and forward tenant-scoped prisma to repositories in `packages/backend/src/services/`
- [ ] T036 [US1] Update `UsersRepository` auth queries: add tenant_id filter to `getUserRoles()` and `getUserPermissions()` methods in `packages/backend/src/repositories/auth/users.repository.ts`
- [ ] T037 [US1] Update `can()` middleware: pass tenantId when fetching user roles/permissions in `packages/backend/src/middlewares/can.ts`
- [ ] T038 [US1] Add `ensureTenantContext` middleware to all domain routes (GET/POST/PUT/DELETE) in `packages/backend/src/routes/` (artistas, musicas, tonalidades, funcoes, categorias, tipos-eventos, eventos, integrantes, relatorios)
- [ ] T039 [US1] Run tests T023–T025 and verify they PASS after implementation in `packages/backend/`
- [ ] T040 [US1] Smoke test: create 2 tenants with distinct data, verify isolation via curl (GET, POST, PUT, DELETE cross-tenant returns 404)

**Checkpoint**: Isolamento de dados completo. Qualquer endpoint de domínio retorna apenas dados do tenant autenticado. US1 independentemente testável.

---

## Phase 4: User Story 2 — Login com seleção de igreja (Priority: P1)

**Goal**: Usuários com múltiplos tenants veem tela de seleção de igreja no login. Usuários com um tenant fazem login direto.

**Independent Test**: Login como user com 2 tenants → resposta com `requires_tenant_selection`. Selecionar tenant → JWT com tenantId.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T041 [P] [US2] Unit test `AuthenticateUserService` multi-tenant: user with 0 active tenants → throws 401; user with 1 tenant → returns token with tenantId; user with 2+ tenants → returns `requires_tenant_selection` + `selection_token` + `tenants[]` in `packages/backend/tests/services/authenticate-user-tenant.test.ts`
- [ ] T042 [P] [US2] Unit test `SelectTenantService`: valid selection_token + valid tenant → returns JWT with tenantId; expired token → throws 401; user not in tenant → throws 403; inactive tenant → throws 404 in `packages/backend/tests/services/select-tenant.test.ts`
- [ ] T043 [P] [US2] Unit test `RefreshTokenService` tenant preservation: refresh token for Tenant A generates new access token that still contains Tenant A's tenantId in `packages/backend/tests/services/refresh-token-tenant.test.ts`

### Implementation for User Story 2

- [ ] T044 [US2] Refactor `AuthenticateUserService`: after credential validation, query `TenantUsers` for user's active tenants (filter by `tenant.status = 'active'`). If 0 → throw 401 "Usuário não vinculado a nenhuma igreja ativa". If 1 → include tenantId in JWT. If N → return selection_token + tenants list in `packages/backend/src/services/auth/authenticate-user.service.ts`
- [ ] T045 [US2] Create `SelectTenantService`: validate selection_token, verify user belongs to tenant, generate final JWT with tenantId in `packages/backend/src/services/auth/select-tenant.service.ts`
- [ ] T046 [US2] Update `SessionsController`: adapt `create` method for two-response flow, add `selectTenant` method in `packages/backend/src/controllers/auth/sessions.controller.ts`
- [ ] T047 [US2] Add `POST /api/sessions/select-tenant` route with validation in `packages/backend/src/routes/auth/sessions.routes.ts`
- [ ] T048 [US2] Update `RefreshTokenService`: preserve tenantId in new tokens during refresh in `packages/backend/src/services/auth/refresh-token.service.ts`
- [ ] T049 [US2] Run tests T041–T043 and verify they PASS after implementation in `packages/backend/`
- [ ] T050 [P] [US2] Update frontend `LoginResponseSchema` in `packages/frontend/src/schemas/auth.ts`: add optional `requires_tenant_selection`, `tenants[]`, `selection_token` fields + `TenantSchema`
- [ ] T051 [P] [US2] Create `selectTenant()` service function calling `POST /api/sessions/select-tenant` in `packages/frontend/src/services/auth.ts`
- [ ] T052 [US2] Create `SelectTenantPage` component: list of tenant cards, calls selectTenant, navigates to dashboard in `packages/frontend/src/pages/SelectTenant.tsx`
- [ ] T053 [US2] Update `AuthContext.signIn()`: if response has `requires_tenant_selection`, store selection_token and navigate to `/selecionar-igreja` in `packages/frontend/src/contexts/AuthContext.tsx`
- [ ] T054 [US2] Add `/selecionar-igreja` route pointing to `SelectTenantPage` in `packages/frontend/src/App.tsx`
- [ ] T055 [US2] Update `AuthContext` state: add `currentTenant` (id + name) derived from login response in `packages/frontend/src/contexts/AuthContext.tsx`
- [ ] T056 [US2] Smoke test: login with single-tenant user (direct), login with multi-tenant user (selection flow), verify JWT payloads

**Checkpoint**: Login multi-tenant funcional. US2 independentemente testável.

---

## Phase 5: User Story 4 — Migração de dados existentes (Priority: P1)

**Goal**: Validar que todos os dados existentes foram migrados corretamente para o tenant padrão na Phase 1.

**Independent Test**: Verificar que contagens de registros pré e pós-migração são idênticas. Login com usuário existente funciona normalmente.

### Implementation for User Story 4

- [ ] T057 [US4] Create migration validation script: compare record counts per table (pre vs post), verify all tenant_id are set, verify all users have TenantUsers entry in `packages/backend/scripts/validate-migration.ts`
- [ ] T058 [US4] Smoke test: login as existing admin user, verify all domain data accessible, verify RBAC still works, verify no data loss

**Checkpoint**: Migração validada. US4 completa (implementação real foi na Phase 1).

---

## Phase 6: User Story 3 — Cadastro e gestão de igrejas (Priority: P2)

**Goal**: Super-admin pode criar tenants, vincular/desvincular usuários de tenants.

**Independent Test**: Login como super-admin → criar tenant → vincular user → user faz login e acessa dados do novo tenant.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T059 [P] [US3] Unit test `IgrejasService`: create igreja (success + duplicate name 409); bind user (success + already bound 409 + user not found 404); unbind user (success + cascades RBAC cleanup); deactivate igreja (soft-delete) in `packages/backend/tests/services/igrejas.test.ts`
- [ ] T060 [P] [US3] Unit test `ensureSuperAdmin` middleware: user with `super-admin` role → next(); user without → 403; user with only `admin` role → 403 in `packages/backend/tests/middlewares/ensure-super-admin.test.ts`

### Implementation for User Story 3

- [ ] T061 [P] [US3] Create `IgrejasRepository` with CRUD + user binding methods (using basePrisma for cross-tenant) in `packages/backend/src/repositories/igrejas.repository.ts`
- [ ] T062 [P] [US3] Create `IgrejasService` with business logic (validate name unique, check user exists, cascade RBAC cleanup on unbind) in `packages/backend/src/services/igrejas.service.ts`
- [ ] T063 [US3] Create `IgrejasController` with index, show, create, update, destroy, addUser, removeUser, listUsers methods in `packages/backend/src/controllers/igrejas.controller.ts`
- [ ] T064 [US3] Create tenant routes with `ensureAuthenticated + ensureSuperAdmin` middleware chain in `packages/backend/src/routes/igrejas.routes.ts`
- [ ] T065 [US3] Register igrejas routes `app.use('/api/igrejas', igrejasRoutes)` in `packages/backend/src/app.ts`
- [ ] T066 [US3] Run tests T059–T060 and verify they PASS after implementation in `packages/backend/`
- [ ] T067 [US3] Smoke test: super-admin creates tenant, binds user, user logs in to new tenant, super-admin unbinds user, user loses access

**Checkpoint**: Gestão de tenants funcional. US3 independentemente testável.

---

## Phase 7: User Story 5 — Troca de tenant sem re-login (Priority: P3)

**Goal**: Usuário multi-tenant pode trocar de igreja durante a sessão sem logout/login.

**Independent Test**: Login no Tenant A → switch para Tenant B → dados exibidos são do Tenant B → token anterior invalidado.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T068 [P] [US5] Unit test `SwitchTenantService`: valid switch (user belongs to target tenant) → returns new JWT pair with new tenantId + old refresh tokens deleted; user not in target tenant → throws 403; inactive tenant → throws 404 in `packages/backend/tests/services/switch-tenant.test.ts`

### Implementation for User Story 5

- [ ] T069 [US5] Create `SwitchTenantService`: validate user belongs to target tenant, invalidate old refresh tokens, generate new JWT pair with new tenantId in `packages/backend/src/services/auth/switch-tenant.service.ts`
- [ ] T070 [US5] Add `switchTenant` method to `SessionsController` in `packages/backend/src/controllers/auth/sessions.controller.ts`
- [ ] T071 [US5] Add `POST /api/sessions/switch-tenant` route with validation in `packages/backend/src/routes/auth/sessions.routes.ts`
- [ ] T072 [US5] Run test T068 and verify it PASSES after implementation in `packages/backend/`
- [ ] T073 [P] [US5] Create `switchTenant()` service function calling `POST /api/sessions/switch-tenant` in `packages/frontend/src/services/auth.ts`
- [ ] T074 [P] [US5] Create `TenantSwitcher` dropdown component showing user's tenants, calls switchTenant on selection in `packages/frontend/src/components/TenantSwitcher.tsx`
- [ ] T075 [US5] Add `switchTenant()` method to `AuthContext`: call API, update tokens, update currentTenant state, invalidate React Query cache in `packages/frontend/src/contexts/AuthContext.tsx`
- [ ] T076 [US5] Integrate `TenantSwitcher` into sidebar or header (only visible for multi-tenant users) in `packages/frontend/src/components/AppSidebar.tsx` or `packages/frontend/src/components/AppLayout.tsx`
- [ ] T077 [US5] Smoke test: login multi-tenant user, switch tenant, verify data changes, verify old token rejected

**Checkpoint**: Troca de tenant funcional. US5 independentemente testável.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, validação final e limpeza.

- [ ] T078 [P] Update OpenAPI spec with new/changed endpoints (sessions, igrejas) in `packages/backend/docs/openapi.json`
- [ ] T079 [P] Update frontend `useCan` hook: consider tenant-scoped permissions from updated AuthUser schema in `packages/frontend/src/hooks/use-can.ts`
- [ ] T080 [P] Update `UserMenu` to display current tenant name in `packages/frontend/src/components/UserMenu.tsx`
- [ ] T081 [P] Add tenant info to `getProfile` response and update frontend `ProfilePage` in `packages/backend/src/controllers/auth/profile.controller.ts` and `packages/frontend/src/pages/Profile.tsx`
- [ ] T082 Update CLAUDE.md and backend-api.md rules with multi-tenant patterns (forTenant, ensureTenantContext, new models) in `CLAUDE.md` and `.claude/rules/backend-api.md`
- [ ] T083 Update MEMORY.md with new multi-tenant patterns and architecture decisions in `C:\Users\pc_admin\.claude\projects\C--Users-pc-admin-source-repos-LouvorFlow\memory\MEMORY.md`
- [ ] T084 Run full test suite (backend + frontend) and fix any regressions in `packages/backend/` and `packages/frontend/`
- [ ] T085 Run quickstart.md validation: 2 tenants, distinct data, full isolation test

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
