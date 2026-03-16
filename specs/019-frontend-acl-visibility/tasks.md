# Tasks: Visibilidade ACL no Frontend

**Input**: Design documents from `/specs/019-frontend-acl-visibility/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `packages/backend/`
- **Frontend**: `packages/frontend/src/`

---

## Phase 1: Setup

**Purpose**: No project initialization needed — existing monorepo. This phase is empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend seed + route migration and frontend permission utilities. MUST be complete before any user story page modifications.

**Why blocking**: All user story phases depend on (a) permissions existing in the database, (b) backend enforcing granular permissions, and (c) frontend having the `useCan` hook available.

### Backend: Seed + Route Migration

- [x] T001 Extend seed script to create 4 domain permissions (`configuracoes.write`, `integrantes.write`, `escalas.write`, `musicas.write`) and associate them to the admin role in `packages/backend/seeds/admin.ts`
- [x] T002 [P] Migrate artistas routes from `ensureHasRole` to `can(['configuracoes.write'])` in `packages/backend/src/routes/artistas.routes.ts`
- [x] T003 [P] Migrate categorias routes from `ensureHasRole` to `can(['configuracoes.write'])` in `packages/backend/src/routes/categorias.routes.ts`
- [x] T004 [P] Migrate funcoes routes from `ensureHasRole` to `can(['configuracoes.write'])` in `packages/backend/src/routes/funcoes.routes.ts`
- [x] T005 [P] Migrate tonalidades routes from `ensureHasRole` to `can(['configuracoes.write'])` in `packages/backend/src/routes/tonalidades.routes.ts`
- [x] T006 [P] Migrate tipos-eventos routes from `ensureHasRole` to `can(['configuracoes.write'])` in `packages/backend/src/routes/tipos-eventos.routes.ts`
- [x] T007 [P] Migrate integrantes routes from `ensureHasRole` to `can(['integrantes.write'])` in `packages/backend/src/routes/integrantes.routes.ts`
- [x] T008 [P] Migrate eventos routes from `ensureHasRole` to `can(['escalas.write'])` in `packages/backend/src/routes/eventos.routes.ts`
- [x] T009 [P] Migrate musicas routes from `ensureHasRole` to `can(['musicas.write'])` in `packages/backend/src/routes/musicas.routes.ts`
- [x] T010 Run backend tests (`npm test` in `packages/backend/`) to verify route migration does not break existing tests

### Frontend: Permission Utilities

- [x] T011 [P] Create `useCan` hook with `useEffectivePermissions()` helper in `packages/frontend/src/hooks/use-can.ts` — computes effective permissions from `user.roles[].permissions[] ∪ user.permissions[]`, returns `{ can: boolean, isLoading: boolean }`, admin bypass via `admin_full_access`
- [x] T012 Create `<Can>` wrapper component in `packages/frontend/src/components/Can.tsx` — props: `permission: string`, `children: ReactNode`, optional `fallback?: ReactNode`; uses `useCan()` internally; fail-closed during loading (depends on T011)

### Frontend: 403 Handling

- [x] T013 Add 403 response handling in `packages/frontend/src/lib/api.ts` — intercept 403 in `apiFetch`, show toast "Permissão negada" via sonner, do not redirect

**Checkpoint**: Foundation ready — seed has permissions, backend enforces granular ACL, frontend has `useCan` hook and 403 toast. User story page modifications can now begin in parallel.

---

## Phase 3: User Story 1 — Permissões granulares propagadas ao frontend (Priority: P1) — MVP

**Goal**: Validate that the frontend auth context contains effective permissions after login, enabling all downstream visibility checks.

**Independent Test**: Login as admin → verify `user` object in AuthContext has `admin_full_access` in effective permissions. Login as user with role having `musicas.write` → verify `musicas.write` appears in effective permissions. Login as user without roles → verify empty effective permissions.

### Implementation for User Story 1

- [x] T014 [US1] Run seed script against local database (`npx tsx seeds/admin.ts` in `packages/backend/`) to create domain permissions and verify they exist in the database
- [x] T015 [US1] Smoke test: Login as admin via API (`POST /api/sessions`), call `GET /api/profile`, verify response includes the 4 new domain permissions (via admin role association) in `roles[0].permissions[]`

**Checkpoint**: US1 complete — frontend auth context now has effective permissions available for all subsequent permission checks.

---

## Phase 4: User Story 2 — Ocultar ações CRUD em Configurações (Priority: P1)

**Goal**: Hide create/edit/delete controls in Settings page for users without `configuracoes.write` permission.

**Independent Test**: Login as user without `configuracoes.write` → navigate to /configuracoes → verify no input fields, pencil icons, or trash icons visible. Login as admin → verify all CRUD controls visible.

### Implementation for User Story 2

- [x] T016 [US2] Add optional `readOnly` prop to `ConfigCrudSection` component in `packages/frontend/src/components/ConfigCrudSection.tsx` — when `true`, hide create input field, edit (Pencil) icons, and delete (Trash2) icons; render list as read-only
- [x] T017 [US2] Add `useCan('configuracoes.write')` check in `packages/frontend/src/pages/Settings.tsx` and pass `readOnly={!canWrite}` to each `ConfigCrudSection` instance

**Checkpoint**: US2 complete — Settings page hides CRUD controls for unauthorized users.

---

## Phase 5: User Story 3 — Ocultar ações CRUD em Integrantes (Priority: P1)

**Goal**: Hide create/edit/delete in Members page for users without `integrantes.write`, except self-edit which is always visible. "Contatar" always visible.

**Independent Test**: Login as user without `integrantes.write` → navigate to /integrantes → verify "Novo Integrante" hidden, edit/delete hidden on other members' cards, but "Editar" visible on own card and "Contatar" visible on all cards.

### Implementation for User Story 3

- [x] T018 [US3] Add permission-based visibility in `packages/frontend/src/pages/Members.tsx` — use `useCan('integrantes.write')` + `useAuth()` to: hide "Novo Integrante" button when `!canWrite`, hide edit/delete on others' cards when `!canWrite`, always show "Editar" on own card (`integrante.id === user.id`), keep "Contatar" visible for all

**Checkpoint**: US3 complete — Members page enforces granular visibility with self-edit exception.

---

## Phase 6: User Story 4 — Ocultar ações CRUD em Escalas (Priority: P1)

**Goal**: Hide create/edit/delete in Scales listing and detail pages for users without `escalas.write`. "Ver Detalhes" always visible.

**Independent Test**: Login as user without `escalas.write` → navigate to /escalas → verify "Nova Escala", "Editar", "Excluir" hidden; "Ver Detalhes" visible. Navigate to /escalas/:id → verify edit/delete/add/remove controls hidden.

### Implementation for User Story 4

- [x] T019 [P] [US4] Add permission-based visibility in `packages/frontend/src/pages/Scales.tsx` — use `useCan('escalas.write')` to hide "Nova Escala" button, "Editar" and "Excluir" buttons on cards; keep "Ver Detalhes" always visible
- [x] T020 [P] [US4] Add permission-based visibility in `packages/frontend/src/components/EventoDetail.tsx` — use `useCan('escalas.write')` to hide "Editar" and "Excluir" buttons in header, hide add/remove controls for músicas and integrantes sections

**Checkpoint**: US4 complete — Scales listing and detail pages enforce granular visibility.

---

## Phase 7: User Story 5 — Ocultar ações CRUD em Músicas (Priority: P1)

**Goal**: Hide create/edit/delete in Songs listing and detail pages for users without `musicas.write`.

**Independent Test**: Login as user without `musicas.write` → navigate to /musicas → verify "Nova Música" hidden. Navigate to /musicas/:id → verify all write controls hidden (delete, edit name, nova versão, edit/remove versões, add/remove categorias, add/remove funções).

### Implementation for User Story 5

- [x] T021 [P] [US5] Add permission-based visibility in `packages/frontend/src/pages/Songs.tsx` — use `useCan('musicas.write')` to hide "Nova Música" button
- [x] T022 [P] [US5] Add permission-based visibility in `packages/frontend/src/components/MusicaDetail.tsx` — use `useCan('musicas.write')` to hide: inline edit (Pencil) on name, "Excluir" button, "Nova Versão" button, edit/remove icons on versions, add/remove controls for categorias and funções

**Checkpoint**: US5 complete — Songs listing and detail pages enforce granular visibility.

---

## Phase 8: User Story 6 — Componente utilitário de verificação de permissão (Priority: P2)

**Goal**: Validate that the `useCan` hook and `<Can>` component created in Phase 2 are working correctly and are reusable across all pages.

**Independent Test**: Verify `useCan` returns `true` for admin on any permission, `false` for user without permission, `true` for user with permission. Verify `<Can>` renders children when allowed and renders nothing when not.

### Implementation for User Story 6

- [x] T023 [US6] Verify `useCan` hook and `<Can>` component work end-to-end by running frontend tests (`npm test` in `packages/frontend/`). If no existing tests, manually verify by switching between admin and regular user accounts across all modified pages

**Checkpoint**: US6 complete — Permission utilities proven reusable across all domain pages.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and cleanup across all user stories.

- [ ] T024 [P] Update OpenAPI spec in `packages/backend/docs/openapi.json` to document new 403 responses on domain write endpoints with specific permission requirements
- [x] T025 [P] Update `packages/frontend/src/hooks/use-can.ts` and `packages/frontend/src/components/Can.tsx` with JSDoc docstrings in PT-BR per CLAUDE.md rules
- [x] T026 [P] Add JSDoc docstrings in PT-BR to all modified frontend files: `ConfigCrudSection.tsx`, `Settings.tsx`, `Members.tsx`, `Scales.tsx`, `Songs.tsx`, `MusicaDetail.tsx`, `EventoDetail.tsx`, `api.ts` (only for new/modified functions)
- [x] T027 [P] Add JSDoc docstrings in PT-BR to all modified backend route files (only for changed middleware references)
- [x] T028 Run full test suite: `npm test` in `packages/backend/` and `npm test` in `packages/frontend/` to verify no regressions
- [ ] T029 Run quickstart.md validation: follow the quickstart steps end-to-end to verify the complete ACL flow works (admin sees everything, restricted user sees only permitted actions)
- [x] T030 Update MEMORY.md with new ACL patterns (useCan hook, Can component, domain permissions convention)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — can start immediately
  - T001 (seed) should complete before T014-T015 (smoke test)
  - T002–T009 (route migration) are all parallelizable
  - T011–T012 (frontend utilities) are parallelizable with backend tasks
  - T013 (403 handling) is independent
- **Phases 3–8 (User Stories)**: All depend on Phase 2 completion
  - **US1 (Phase 3)**: Depends on T001 (seed) — validates foundation
  - **US2 (Phase 4)**: Depends on T011 (useCan hook) — can run parallel with US3–US5
  - **US3 (Phase 5)**: Depends on T011 (useCan hook) — can run parallel with US2, US4–US5
  - **US4 (Phase 6)**: Depends on T011 (useCan hook) — can run parallel with US2–US3, US5
  - **US5 (Phase 7)**: Depends on T011 (useCan hook) — can run parallel with US2–US4
  - **US6 (Phase 8)**: Depends on all previous user stories (validation)
- **Phase 9 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1**: Depends only on Phase 2 (seed + utilities). No cross-story dependencies.
- **US2**: Depends only on Phase 2. Independent of US3–US5.
- **US3**: Depends only on Phase 2. Independent of US2, US4–US5.
- **US4**: Depends only on Phase 2. Independent of US2–US3, US5.
- **US5**: Depends only on Phase 2. Independent of US2–US4.
- **US6**: Depends on US2–US5 (validates reusability across all pages).

### Parallel Opportunities

**Within Phase 2**:

```text
Parallel group A (backend routes — all [P]):
  T002, T003, T004, T005, T006, T007, T008, T009

Parallel group B (frontend utilities — all [P]):
  T011, T012, T013

Groups A and B can run in parallel with each other.
```

**Within Phases 4–7 (after Phase 2 completes)**:

```text
All user stories US2–US5 can run in parallel:
  T016+T017 (US2: Settings)
  T018 (US3: Members)
  T019+T020 (US4: Scales — T019 and T020 are [P])
  T021+T022 (US5: Songs — T021 and T022 are [P])
```

**Within Phase 9**:

```text
Parallel group (documentation):
  T024, T025, T026, T027
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (seed + routes + useCan + 403)
2. Complete Phase 3: US1 (validate permissions in auth context)
3. **STOP and VALIDATE**: Verify admin has all permissions, regular user has restricted permissions
4. This alone provides backend-level granular protection even without frontend visibility changes

### Incremental Delivery

1. Phase 2 → Foundation ready (backend protected, frontend utilities created)
2. Phase 3: US1 → Validate foundation works
3. Phase 4: US2 → Settings page protected → Demo
4. Phase 5: US3 → Members page protected → Demo
5. Phase 6: US4 → Scales page protected → Demo
6. Phase 7: US5 → Songs page protected → Demo
7. Phase 8: US6 → Validate reusability
8. Phase 9 → Documentation and cleanup

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 2 together (or split: backend dev does T001–T010, frontend dev does T011–T013)
2. Once Phase 2 is done:
   - Developer A: US2 (Settings) + US3 (Members)
   - Developer B: US4 (Scales) + US5 (Songs)
3. Both validate independently, then US6 + Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend route migration (T002–T009) is mechanical: swap import + middleware in each file
- No database migration needed — only seed data changes
