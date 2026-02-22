# Tasks: Histórico com Dados Reais

**Input**: Design documents from `/specs/010-live-historico/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `packages/backend/src/`, `packages/frontend/src/`
- Backend is NOT modified in this feature

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup needed — project already exists with all dependencies installed.

*Skipped — all hooks (`useEventos`, `useEvento`), services (`getEventos`, `getEvento`), schemas (`EventoIndex`, `EventoShow`), and shared components (`EmptyState`, `ErrorState`, `Skeleton`) already exist and require no changes.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed — all API endpoints, React Query hooks, Zod schemas, and UI components are already in place.

*Skipped — the existing infrastructure fully supports this feature.*

---

## Phase 3: User Story 1 - Visualizar escalas passadas com dados reais (Priority: P1) MVP

**Goal**: Substituir os dados hardcoded da página de Histórico por dados reais da API, com filtragem de eventos passados, ordenação decrescente, e tratamento de estados vazio e erro.

**Independent Test**: Criar eventos com datas passadas na página de Escalas, abrir `/historico` e verificar que aparecem com dados corretos. Verificar empty state quando não há eventos passados.

### Implementation for User Story 1

- [x] T001 [US1] Remove hardcoded `pastScales` array and replace with `useEventos()` hook call, adding imports for `useEventos` from `@/hooks/use-eventos`, `EmptyState` from `@/components/EmptyState`, and `ErrorState` from `@/components/ErrorState` in `packages/frontend/src/pages/History.tsx`
- [x] T002 [US1] Add client-side filtering logic using `useMemo` to filter events where `new Date(evento.data) <= new Date()` and sort by date descending (`b.data` compared to `a.data`) in `packages/frontend/src/pages/History.tsx`
- [x] T003 [US1] Update card rendering to map over filtered events using `EventoIndex` fields: `tipoEvento?.nome ?? "Evento"` for title, `evento.data` for formatted date, `evento.musicas.length` for songs count, `evento.integrantes.length` for team count, and `evento.descricao` for the badge (replacing hardcoded "Ministro") in `packages/frontend/src/pages/History.tsx`
- [x] T004 [US1] Add empty state rendering using `<EmptyState>` component when filtered past events array is empty (and not loading/error), with title "Nenhum histórico disponível" and description "Ainda não há escalas realizadas para exibir." in `packages/frontend/src/pages/History.tsx`
- [x] T005 [US1] Add error state rendering using `<ErrorState>` component with `error.message` and `onRetry={() => refetch()}` when `isError` is true in `packages/frontend/src/pages/History.tsx`

**Checkpoint**: At this point, the History page should display real past events from the API, with correct empty state and error handling.

---

## Phase 4: User Story 2 - Ver detalhes de uma escala passada (Priority: P2)

**Goal**: Conectar o botão "Ver Detalhes" de cada card à página de detalhe de evento existente (`/escalas/:id`).

**Independent Test**: Clicar em "Ver Detalhes" de um evento no histórico e verificar que navega para `/escalas/:id` com os dados corretos.

### Implementation for User Story 2

- [x] T006 [US2] Import `useNavigate` from `react-router-dom` and add `onClick={() => navigate(`/escalas/${evento.id}`)}` to the "Ver Detalhes" `<Button>` in `packages/frontend/src/pages/History.tsx`

**Checkpoint**: "Ver Detalhes" button now navigates to the existing event detail page.

---

## Phase 5: User Story 3 - Feedback visual de carregamento (Priority: P3)

**Goal**: Exibir indicadores visuais de carregamento (skeletons) enquanto os dados estão sendo buscados da API.

**Independent Test**: Simular latência e verificar que skeletons aparecem antes dos dados.

### Implementation for User Story 3

- [x] T007 [US3] Create a `HistorySkeleton` component (local to History page) using `Skeleton` from `@/components/ui/skeleton`, matching the card layout structure (calendar icon placeholder, title, date, music count, team count, badge), and render `Array.from({ length: 3 }).map(() => <HistorySkeleton>)` when `isLoading` is true in `packages/frontend/src/pages/History.tsx`

**Checkpoint**: All three user stories are now functional — real data, navigation, and loading feedback.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ensure code quality and documentation compliance.

- [x] T008 Add JSDoc docstrings in Portuguese (PT-BR) to all new and modified functions, including the component itself, `HistorySkeleton`, and any helper functions, per CLAUDE.md requirements in `packages/frontend/src/pages/History.tsx`
- [x] T009 Run TypeScript compilation check with `npx tsc --noEmit` in `packages/frontend/` to ensure no type errors
- [x] T010 Validate the page visually by accessing `http://localhost:8080/historico` and verifying all states: loading skeleton, data rendering, empty state (no past events), and "Ver Detalhes" navigation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — already complete
- **Foundational (Phase 2)**: Skipped — already complete
- **User Story 1 (Phase 3)**: Can start immediately — no blocking prerequisites
- **User Story 2 (Phase 4)**: Depends on T003 (card rendering must exist to add navigation)
- **User Story 3 (Phase 5)**: Can start in parallel with US1 (separate rendering branch)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies — this is the core MVP
- **User Story 2 (P2)**: Depends on US1 cards being rendered (T003) to add onClick navigation
- **User Story 3 (P3)**: Independent of US1/US2 — skeleton renders during `isLoading` before data

### Parallel Opportunities

- T001 and T007 can theoretically start in parallel (hook setup vs skeleton component), but since they modify the same file, sequential execution is recommended
- T008 and T009 can run in parallel (docstrings vs type check)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T005: Real data with filtering, sorting, empty state, error state
2. **STOP and VALIDATE**: Open `/historico` — verify past events appear correctly
3. Deploy/demo if ready

### Incremental Delivery

1. T001-T005 → US1 complete → Real data rendering (MVP!)
2. T006 → US2 complete → "Ver Detalhes" navigation works
3. T007 → US3 complete → Loading skeletons appear
4. T008-T010 → Polish → Docstrings, type safety, visual validation

### Single-File Strategy

All implementation tasks (T001-T008) modify the same file: `packages/frontend/src/pages/History.tsx`. The recommended approach is sequential execution in task order, building the page incrementally:

1. Wire up hook and filtering (T001-T002)
2. Render cards with real data (T003)
3. Add empty/error states (T004-T005)
4. Add navigation (T006)
5. Add skeletons (T007)
6. Add docstrings (T008)

---

## Notes

- All 10 tasks modify or validate a single file: `packages/frontend/src/pages/History.tsx`
- No backend changes required — all API infrastructure already exists
- No new files need to be created — only the existing History page is rewritten
- The `EventoDetail` component at `/escalas/:id` is reused as-is for the detail view
- Commit after each user story checkpoint for clean git history
