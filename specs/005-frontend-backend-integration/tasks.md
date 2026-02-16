# Tasks: Integração Frontend-Backend (Fase 1)

**Input**: Design documents from `/specs/005-frontend-backend-integration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-endpoints.md, quickstart.md

**Tests**: Not explicitly requested in the specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story. US4 (Loading/Feedback) is cross-cutting and integrated into the Foundational phase + each story's page implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend root**: `src/frontend/src/`
- **Base convention**: All new files under `src/frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure project-level infrastructure needed by all modules — environment, API client, React Query provider.

- [x] T001 [P] Create environment variable file with `VITE_API_BASE_URL=http://localhost:3000/api` in `src/frontend/.env.example`
- [x] T002 [P] Create API Fetch wrapper with `ApiError` class and `apiFetch<T>()` function in `src/frontend/src/lib/api.ts` — handles JSON serialization, error extraction from `{ erro, codigo }` response, network error fallback message, and base URL from `import.meta.env.VITE_API_BASE_URL`
- [x] T003 Configure `QueryClientProvider` wrapping the app with `staleTime: 60000` and `retry: 1` in `src/frontend/src/App.tsx`

**Checkpoint**: API client and React Query provider are configured. `apiFetch()` can make requests to the backend.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Zod schemas, reusable UI components (empty/error states), and support data hooks (tonalidades, funções, tipos-eventos) that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 [P] Create shared Zod schemas (`IdNomeSchema`, `TonalidadeSchema`, `ApiErrorSchema`, `PaginationMetaSchema`) with exported inferred types in `src/frontend/src/schemas/shared.ts`
- [x] T005 [P] Create `EmptyState` reusable component — accepts `title`, `description`, and optional `actionLabel`/`onAction` props — with icon and call-to-action button in `src/frontend/src/components/EmptyState.tsx`
- [x] T006 [P] Create `ErrorState` reusable component — accepts `message` and `onRetry` callback — with retry button and error icon in `src/frontend/src/components/ErrorState.tsx`
- [x] T007 Create support API service functions (`getTonalidades`, `getFuncoes`, `getTiposEventos`) using `apiFetch` in `src/frontend/src/services/support.ts`
- [x] T008 Create support React Query hooks (`useTonalidades`, `useFuncoes`, `useTiposEventos`) wrapping service functions with `useQuery` in `src/frontend/src/hooks/use-support.ts`

**Checkpoint**: Foundation ready — shared schemas, UI components, and lookup data hooks available. User story implementation can now begin.

---

## Phase 3: User Story 1 — Gerenciar Integrantes com Dados Reais (Priority: P1) MVP

**Goal**: Substituir dados hardcoded na página de Integrantes por chamadas reais à API. Listagem do servidor + criação via formulário com validação + feedback visual (loading/error/success/empty).

**Independent Test**: Acessar `/integrantes` — lista carrega do servidor; criar integrante via formulário persiste ao recarregar a página; erros exibem toast; estado vazio mostra orientação.

**Covers**: FR-001, FR-002, FR-003, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015 (para integrantes)

### Implementation for User Story 1

- [x] T009 [P] [US1] Create integrante Zod schemas (`IntegranteComFuncoesSchema`, `IntegranteResponseSchema`, `CreateIntegranteFormSchema`) with inferred types in `src/frontend/src/schemas/integrante.ts` — import `IdNomeSchema` from shared
- [x] T010 [US1] Create integrantes API service functions (`getIntegrantes`, `getIntegrante`, `createIntegrante`) using `apiFetch` and Zod parsing in `src/frontend/src/services/integrantes.ts`
- [x] T011 [US1] Create integrantes React Query hooks (`useIntegrantes` with `useQuery`, `useCreateIntegrante` with `useMutation` + query invalidation + toast success/error) in `src/frontend/src/hooks/use-integrantes.ts`
- [x] T012 [US1] Create `IntegranteForm` component — Dialog with react-hook-form + zodResolver, fields: nome, doc_id, email, senha, telefone (optional), validation messages per field, preserves data on error — in `src/frontend/src/components/IntegranteForm.tsx`
- [x] T013 [US1] Refactor `Members.tsx` page — remove hardcoded data array, use `useIntegrantes()` hook, add Skeleton loading state, ErrorState with retry on error, EmptyState when list is empty, integrate IntegranteForm dialog on "Novo Integrante" button — in `src/frontend/src/pages/Members.tsx`

**Checkpoint**: User Story 1 complete. Integrantes page loads real data, creates members via form, shows loading/error/empty/success states. Independently testable by accessing `/integrantes`.

---

## Phase 4: User Story 2 — Gerenciar Catálogo de Músicas com Dados Reais (Priority: P2)

**Goal**: Substituir dados hardcoded na página de Músicas por chamadas reais à API. Listagem paginada + criação via formulário com seleção de tonalidade + feedback visual.

**Independent Test**: Acessar `/musicas` — catálogo carrega do servidor com paginação; criar música via formulário com seleção de tonalidade persiste ao recarregar.

**Covers**: FR-004, FR-005, FR-006, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015 (para músicas)

### Implementation for User Story 2

- [x] T014 [P] [US2] Create musica Zod schemas (`VersaoSchema`, `MusicaSchema`, `MusicasPaginadasSchema`, `MusicaCreateResponseSchema`, `CreateMusicaFormSchema`) with inferred types in `src/frontend/src/schemas/musica.ts` — import shared schemas
- [x] T015 [US2] Create musicas API service functions (`getMusicas` with page/limit params, `getMusica`, `createMusica`) using `apiFetch` and Zod parsing in `src/frontend/src/services/musicas.ts`
- [x] T016 [US2] Create musicas React Query hooks (`useMusicas` with page/limit as query key, `useCreateMusica` with mutation + invalidation + toast) in `src/frontend/src/hooks/use-musicas.ts`
- [x] T017 [US2] Create `MusicaForm` component — Dialog with react-hook-form + zodResolver, fields: nome, fk_tonalidade (Select populated from `useTonalidades`), validation messages per field — in `src/frontend/src/components/MusicaForm.tsx`
- [x] T018 [US2] Refactor `Songs.tsx` page — remove hardcoded data array, use `useMusicas(page, limit)` hook, add pagination controls using `meta.total_pages`, Skeleton loading state, ErrorState with retry, EmptyState, integrate MusicaForm dialog on "Nova Música" button — in `src/frontend/src/pages/Songs.tsx`

**Checkpoint**: User Story 2 complete. Músicas page loads paginated real data, creates songs with tonality selection, shows all feedback states. Independently testable by accessing `/musicas`.

---

## Phase 5: User Story 3 — Gerenciar Escalas de Serviço com Dados Reais (Priority: P3)

**Goal**: Substituir dados hardcoded na página de Escalas por chamadas reais à API. Listagem de eventos + criação em duas etapas (formulário → detalhe com associações) + feedback visual.

**Independent Test**: Acessar `/escalas` — lista de eventos carrega do servidor; criar evento via formulário redireciona para detalhe onde se associam músicas e integrantes.

**Covers**: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015 (para escalas/eventos)

**Data dependency**: Para testar completamente a associação de músicas e integrantes a eventos, é necessário que existam registros criados via US1 e US2 (ou pré-existentes no banco).

### Implementation for User Story 3

- [x] T019 [P] [US3] Create evento Zod schemas (`EventoIndexSchema`, `EventoShowSchema`, `MusicaEventoSchema`, `IntegranteEventoSchema`, `EventoCreateResponseSchema`, `CreateEventoFormSchema`) with inferred types in `src/frontend/src/schemas/evento.ts` — import shared schemas
- [x] T020 [US3] Create eventos API service functions (`getEventos`, `getEvento`, `createEvento`, `addMusicaToEvento`, `removeMusicaFromEvento`, `addIntegranteToEvento`, `removeIntegranteFromEvento`) using `apiFetch` and Zod parsing in `src/frontend/src/services/eventos.ts`
- [x] T021 [US3] Create eventos React Query hooks (`useEventos` with `useQuery`, `useEvento` with `useQuery` by id, `useCreateEvento` with mutation + toast, `useAddMusicaToEvento`, `useRemoveMusicaFromEvento`, `useAddIntegranteToEvento`, `useRemoveIntegranteFromEvento` — each with invalidation of `['eventos', eventoId]`) in `src/frontend/src/hooks/use-eventos.ts`
- [x] T022 [US3] Create `EventoForm` component — Dialog with react-hook-form + zodResolver, fields: data (date input), fk_tipo_evento (Select populated from `useTiposEventos`), descricao (text), validation messages per field — in `src/frontend/src/components/EventoForm.tsx`
- [x] T023 [US3] Create `EventoDetail` component — displays full evento data using `useEvento(id)`, lists associated músicas (with tonalidade) and integrantes (with funções), allows adding/removing músicas and integrantes via Select + button using `useMusicas`/`useIntegrantes` for options and association hooks, shows loading/error states — in `src/frontend/src/components/EventoDetail.tsx`
- [x] T024 [US3] Add route `/escalas/:id` for EventoDetail page in `src/frontend/src/App.tsx`
- [x] T025 [US3] Refactor `Scales.tsx` page — remove hardcoded data array, use `useEventos()` hook, Skeleton loading state, ErrorState with retry, EmptyState, integrate EventoForm dialog on "Nova Escala" button, "Ver Detalhes" button navigates to `/escalas/:id` — in `src/frontend/src/pages/Scales.tsx`

**Checkpoint**: User Story 3 complete. Escalas page loads real events, creates events and redirects to detail for association, shows all feedback states. Independently testable by accessing `/escalas`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup.

- [x] T026 Verify all hardcoded data removed from Members.tsx, Songs.tsx, and Scales.tsx — validate SC-001 (zero static data)
- [x] T027 Verify all async operations show loading indicators — validate SC-002 (100% loading states)
- [x] T028 Verify no blank screen on error scenarios (server down, network error, 500) — validate SC-003 (resilience)
- [x] T029 [P] Run quickstart.md validation — start backend + frontend per quickstart.md, verify all 3 pages load
- [x] T030 [P] Verify consistent use of Sonner toast (not Radix toast) across all hooks — validate SC-007 (success notification)
- [ ] T031 Verify SC-004 — manually create one integrante, one música and one escala through the UI, each in under 2 minutes, confirming form flow and feedback are efficient
- [x] T032 [P] Verify SC-005 — after creating a record in each module (integrante, música, evento), confirm the corresponding list updates automatically without manual page reload
- [x] T033 [P] Verify SC-006 — submit each creation form with empty required fields, confirm validation messages appear instantly (under 1 second) without a server round-trip

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T002 (api.ts) and T003 (QueryClientProvider) from Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion — no dependency on other stories
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion — no code dependency on US1 (but needs `useTonalidades` from T008)
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion — uses `useMusicas` and `useIntegrantes` hooks from US1/US2 in EventoDetail for association selects. Must be implemented after US1 and US2 or reuse their hooks.
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```text
Phase 1 (Setup)
  └── Phase 2 (Foundational)
        ├── Phase 3 (US1: Integrantes) ─── MVP
        ├── Phase 4 (US2: Músicas)     ─── can start after Phase 2 (parallel with US1)
        └── Phase 5 (US3: Escalas)     ─── depends on US1 + US2 hooks for EventoDetail
              └── Phase 6 (Polish)
```

### Within Each User Story

1. Schemas first (can parallel with other schemas)
2. Service depends on schema + api.ts
3. Hook depends on service
4. Form component depends on hook + support hooks
5. Page refactor depends on hook + form + EmptyState + ErrorState

### Parallel Opportunities

**Phase 1**: T001 and T002 can run in parallel (different files)
**Phase 2**: T004, T005, T006 can all run in parallel (different files, no dependencies)
**Cross-story**: US1 schemas (T009) and US2 schemas (T014) and US3 schemas (T019) can all run in parallel
**Within stories**: Schema tasks are parallelizable across stories since they are in different files

---

## Parallel Example: Phase 2 (Foundational)

```text
# Launch all independent foundational tasks together:
Task T004: "Create shared Zod schemas in src/frontend/src/schemas/shared.ts"
Task T005: "Create EmptyState component in src/frontend/src/components/EmptyState.tsx"
Task T006: "Create ErrorState component in src/frontend/src/components/ErrorState.tsx"

# Then sequentially (depend on T004 + T002):
Task T007: "Create support services in src/frontend/src/services/support.ts"
Task T008: "Create support hooks in src/frontend/src/hooks/use-support.ts"
```

## Parallel Example: Schemas Across Stories

```text
# After Phase 2, launch all story schemas in parallel:
Task T009: "[US1] Create integrante schemas in src/frontend/src/schemas/integrante.ts"
Task T014: "[US2] Create musica schemas in src/frontend/src/schemas/musica.ts"
Task T019: "[US3] Create evento schemas in src/frontend/src/schemas/evento.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T008) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T009–T013)
4. **STOP and VALIDATE**: Test integrantes page — loads from server, form creates, errors show toast
5. Deploy/demo if ready — sistema já funcional para gestão de integrantes

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Integrantes) → Test → Deploy **(MVP!)**
3. Add US2 (Músicas) → Test → Deploy
4. Add US3 (Escalas) → Test → Deploy
5. Polish → Final validation → Deploy

### Recommended Sequential Order

For a single developer, execute in priority order:

```text
T001 → T002 (parallel) → T003 → T004/T005/T006 (parallel) → T007 → T008
  → T009 → T010 → T011 → T012 → T013 [checkpoint US1]
  → T014 → T015 → T016 → T017 → T018 [checkpoint US2]
  → T019 → T020 → T021 → T022 → T023 → T024 → T025 [checkpoint US3]
  → T026 → T027 → T028 → T029 → T030 [final validation]
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 (Loading/Feedback) is not a separate phase — its requirements (FR-009 to FR-015) are fulfilled within each page refactor task by using EmptyState, ErrorState, Skeleton, and toast notifications
- Each page refactor task (T013, T018, T025) must implement ALL feedback states: loading (Skeleton), error (ErrorState + retry), empty (EmptyState), success (toast), validation (per-field messages)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
