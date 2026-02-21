# Tasks: Enhanced Music Registration Form

**Input**: Design documents from `/specs/008-enhanced-musica-form/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/composite-create.md

**Tests**: Not requested — manual testing via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Project already exists — skip. No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend types and repository methods shared by US1 and US4. MUST be complete before any user story.

- [x] T001 [P] Add `CreateMusicaCompleteInput` and `UpdateMusicaCompleteInput` type interfaces in `packages/backend/src/types/index.ts`. `CreateMusicaCompleteInput`: `{ nome: string, fk_tonalidade?: string, artista_id?: string, bpm?: number, cifras?: string, lyrics?: string, link_versao?: string }`. `UpdateMusicaCompleteInput`: same fields plus `versao_id?: string`.
- [x] T002 [P] Add `createWithVersao(data: CreateMusicaCompleteInput)` method in `packages/backend/src/repositories/musicas.repository.ts`. Use `prisma.$transaction()` to: (1) create musica with nome + fk_tonalidade, (2) if artista_id provided, create artistas_musicas record with version fields, (3) return full musica with relations using existing `MUSICA_SELECT` constant.
- [x] T003 [P] Add `updateWithVersao(id: string, data: UpdateMusicaCompleteInput)` method in `packages/backend/src/repositories/musicas.repository.ts`. Use `prisma.$transaction()` to: (1) update musica (nome, fk_tonalidade), (2) if versao_id provided, update artistas_musicas record (bpm, cifras, lyrics, link_versao), (3) return full musica with relations.

**Checkpoint**: Backend repository layer ready — types defined, transaction methods implemented.

---

## Phase 3: User Story 1 — Cadastro completo de música em formulário único (Priority: P1) 🎯 MVP

**Goal**: User can create a music with all details (nome, tonalidade, artista, BPM, cifra, letra, link) in a single form submission. Backend creates music + version atomically.

**Independent Test**: Create a music via the form filling all fields. Verify the music and its default version are persisted. Verify redirect to detail page. Also verify creating with only `nome` works (no version created).

### Backend (US1)

- [x] T004 [US1] Add `createComplete(data)` method in `packages/backend/src/services/musicas.service.ts`. Validation: (1) `nome` required → throw AppError 400, (2) if version fields present without `artista_id` → throw AppError 400 `"Artista é obrigatório para criar uma versão"`, (3) if `fk_tonalidade` provided, verify it exists → throw AppError 400, (4) if `artista_id` provided, verify it exists → throw AppError 400. Call `repository.createWithVersao()`. Format result using existing `formatMusica()` method.
- [x] T005 [US1] Add `createComplete(req, res)` handler in `packages/backend/src/controllers/musicas.controller.ts`. Follow existing controller pattern: try/catch, call service, respond with `{ msg: "Música criada com sucesso", musica }` and status 201.
- [x] T006 [US1] Add route `router.post('/complete', musicasController.createComplete)` in `packages/backend/src/routes/musicas.routes.ts`. Place BEFORE `router.get('/:id', ...)` to avoid route conflict with `:id` param.

### Frontend (US1)

- [x] T007 [P] [US1] Add `CreateMusicaCompleteFormSchema` Zod schema in `packages/frontend/src/schemas/musica.ts`. Fields: `nome` (required string), `fk_tonalidade` (optional UUID string), `artista_id` (optional UUID string), `bpm` (optional coerced number), `cifras` (optional string), `lyrics` (optional string), `link_versao` (optional URL string). Add `.superRefine()`: if any of bpm/cifras/lyrics/link_versao is filled and `artista_id` is empty, add error on `artista_id` path with message `"Selecione um artista para salvar os dados da versão"`.
- [x] T008 [P] [US1] Add `createMusicaComplete(data)` function in `packages/frontend/src/services/musicas.ts`. POST to `/api/musicas/complete` with JSON body. Parse response with appropriate Zod schema returning `{ msg, musica }`.
- [x] T009 [US1] Add `useCreateMusicaComplete()` hook in `packages/frontend/src/hooks/use-musicas.ts`. Follow existing `useCreateMusica()` pattern: `useMutation` with `createMusicaComplete`, invalidate `['musicas']` query on success, show success toast, return `musica.id` for redirect.
- [x] T010 [US1] Expand `MusicaForm` component in `packages/frontend/src/components/MusicaForm.tsx`. Replace current 2-field form (nome + tonalidade Select) with unified form using `CreateMusicaCompleteFormSchema`. Add fields: tonalidade (keep existing Select for now — US2 will upgrade to combobox), artista (standard Select from `useArtistas()` for now — US3 will upgrade), BPM (Input type number), cifra (Textarea), letra (Textarea), link (Input type url). On submit success, use `navigate('/musicas/${musica.id}')` to redirect to detail page (from react-router-dom `useNavigate`). Make `fk_tonalidade` optional in the form (remove current required constraint).

**Checkpoint**: Music creation flow works end-to-end. User fills unified form → backend creates music + version atomically → redirects to detail page. Tonalidade and artista use standard Select dropdowns (no inline creation yet).

---

## Phase 4: User Story 2 — Criação inline de tonalidade via combobox (Priority: P1)

**Goal**: Tonalidade field becomes a searchable combobox that allows creating new tonalidades inline without leaving the form.

**Independent Test**: Open the music form, type a tonalidade that doesn't exist (e.g., "F#m"), click "Criar F#m", verify it's created and selected. Type part of an existing tonalidade name and verify filtering works.

- [x] T011 [US2] Create `CreatableCombobox` component in `packages/frontend/src/components/CreatableCombobox.tsx`. Reusable component built on shadcn/ui `Popover` + `Command` (cmdk). Props: `options: Array<{ value: string, label: string }>`, `value: string | undefined`, `onSelect: (value: string) => void`, `onCreate: (inputValue: string) => Promise<string | undefined>` (returns new value or undefined on failure), `placeholder: string`, `searchPlaceholder: string`, `createLabel?: (input: string) => string` (defaults to `"Criar ${input}"`), `disabled?: boolean`, `isLoading?: boolean`. Behavior: (1) Popover trigger shows selected label or placeholder, (2) Command input filters options, (3) if search text has no match, show "Criar X" option at bottom, (4) clicking "Criar X" calls `onCreate`, awaits result, then calls `onSelect` with returned value, (5) shows loading state during creation. Use `ChevronsUpDown` icon and `Check` icon from lucide-react for visual indicators.
- [x] T012 [US2] Replace tonalidade `Select` with `CreatableCombobox` in `packages/frontend/src/components/MusicaForm.tsx`. Map `useTonalidades()` data to `{ value: id, label: tom }` options. Wire `onSelect` to set `fk_tonalidade` form field. Wire `onCreate` to call `useCreateTonalidade()` mutation: `createTonalidade({ tom: inputValue })`, on success return the new tonalidade's `id`. The existing `useCreateTonalidade` hook already invalidates `['tonalidades']` cache.

**Checkpoint**: Tonalidade field is a searchable combobox. Existing tonalidades are filterable. New tonalidades can be created inline and immediately selected.

---

## Phase 5: User Story 3 — Criação inline de artista via combobox (Priority: P1)

**Goal**: Artista field becomes a searchable combobox that allows creating new artistas inline without leaving the form.

**Independent Test**: Open the music form, type an artist name that doesn't exist (e.g., "Fernandinho"), click "Criar Fernandinho", verify it's created and selected. Type part of an existing artist name and verify filtering works.

**Depends on**: US2 (CreatableCombobox component must exist)

- [x] T013 [US3] Replace artista `Select` with `CreatableCombobox` in `packages/frontend/src/components/MusicaForm.tsx`. Map `useArtistas()` data to `{ value: id, label: nome }` options. Wire `onSelect` to set `artista_id` form field. Wire `onCreate` to call `useCreateArtista()` mutation: `createArtista({ nome: inputValue })`, on success return the new artista's `id`. The existing `useCreateArtista` hook already invalidates `['artistas']` cache.

**Checkpoint**: Both tonalidade and artista fields are searchable comboboxes with inline creation. The full creation flow (US1 + US2 + US3) works end-to-end.

---

## Phase 6: User Story 4 — Edição do formulário ampliado (Priority: P2)

**Goal**: Edit form shows the same expanded fields, pre-populated with the current music data and its default version (oldest by `created_at`). Changes are saved atomically.

**Independent Test**: Open an existing music with a version for editing. Verify all fields are pre-populated. Change BPM and tonalidade → save → verify changes persisted. Open a music without versions for editing → verify only music fields (nome, tonalidade) are shown.

**Depends on**: US1 (expanded form), US2 + US3 (comboboxes)

### Backend (US4)

- [x] T014 [US4] Add `updateComplete(id, data)` method in `packages/backend/src/services/musicas.service.ts`. Validation: (1) `nome` required, (2) music must exist → throw AppError 404, (3) if `fk_tonalidade` provided, verify it exists, (4) if `versao_id` provided, verify it exists. Call `repository.updateWithVersao()`. Format result using existing `formatMusica()` method.
- [x] T015 [US4] Add `updateComplete(req, res)` handler in `packages/backend/src/controllers/musicas.controller.ts`. Follow existing controller pattern: try/catch, call service with `req.params.id` and `req.body`, respond with `{ msg: "Música editada com sucesso", musica }` and status 200.
- [x] T016 [US4] Add route `router.put('/:id/complete', musicasController.updateComplete)` in `packages/backend/src/routes/musicas.routes.ts`.

### Frontend (US4)

- [x] T017 [P] [US4] Add `UpdateMusicaCompleteFormSchema` Zod schema in `packages/frontend/src/schemas/musica.ts`. Same fields as `CreateMusicaCompleteFormSchema` plus `versao_id` (optional UUID string). Same `.superRefine()` rule for artista + version fields.
- [x] T018 [P] [US4] Add `updateMusicaComplete(id, data)` function in `packages/frontend/src/services/musicas.ts`. PUT to `/api/musicas/${id}/complete` with JSON body. Parse response with appropriate Zod schema.
- [x] T019 [US4] Add `useUpdateMusicaComplete()` hook in `packages/frontend/src/hooks/use-musicas.ts`. Follow existing `useUpdateMusica()` pattern: `useMutation` with `updateMusicaComplete`, invalidate `['musicas']` and `['musica', id]` queries on success, show success toast.
- [x] T020 [US4] Modify `MusicaDetail` component in `packages/frontend/src/components/MusicaDetail.tsx` to use the expanded edit form. When editing, open `MusicaForm` in edit mode with pre-populated data: (1) extract music fields (nome, fk_tonalidade from `musica.tonalidade?.id`), (2) extract default version = `musica.versoes` sorted by `created_at` ASC, take first — get `versao_id`, `artista_id` (from `versao.artista.id`), `bpm`, `cifras`, `lyrics`, `link_versao`, (3) pass all values to MusicaForm as `defaultValues` prop. MusicaForm should detect edit mode (when `musica` prop is provided) and call `useUpdateMusicaComplete` instead of `useCreateMusicaComplete`.

**Checkpoint**: Full edit flow works. Pre-populated form shows all fields. Changes to music and version are saved atomically. Comboboxes work in edit mode too.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all stories

- [x] T021 [P] Verify all new/modified functions have JSDoc docstrings in Portuguese (PT-BR) per CLAUDE.md requirements — check all files in `packages/backend/src/controllers/`, `packages/backend/src/services/`, `packages/backend/src/repositories/`, `packages/frontend/src/components/`, `packages/frontend/src/hooks/`, `packages/frontend/src/services/`, `packages/frontend/src/schemas/`
- [x] T022 [P] Verify form is mobile-first responsive — test at 375px viewport width. Ensure combobox popover doesn't overflow on small screens. Verify textarea fields are appropriately sized.
- [x] T023 Run full quickstart.md manual testing checklist (both backend curl tests and frontend smoke tests) to validate all acceptance scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Skipped — project exists
- **Phase 2 (Foundational)**: No dependencies — start immediately. BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 3 (US1) — the form must exist to add combobox to it
- **Phase 5 (US3)**: Depends on Phase 4 (US2) — the CreatableCombobox component must exist
- **Phase 6 (US4)**: Depends on Phase 5 (US3) — needs the full form with comboboxes
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational → backend endpoint + expanded form with standard selects
- **US2 (P1)**: After US1 → creates CreatableCombobox, replaces tonalidade Select
- **US3 (P1)**: After US2 → reuses CreatableCombobox, replaces artista Select
- **US4 (P2)**: After US3 → backend update endpoint + edit mode integration

### Within Each User Story

- Backend types/repo (foundational) before service before controller before routes
- Frontend schema before service before hook before component
- Backend before frontend (API must exist for frontend to call)

### Parallel Opportunities

**Phase 2 (Foundational)**: T001, T002, T003 can ALL run in parallel (different files)

**Phase 3 (US1)**:
- T004 → T005 → T006 (backend: sequential — service → controller → routes)
- T007, T008 can run in parallel with each other AND with backend tasks (different packages)
- T009 depends on T008 (hook uses service function)
- T010 depends on T007 + T009 (component uses schema + hook)

**Phase 6 (US4)**:
- T017, T018 can run in parallel (schema + service, different files)
- T014 → T015 → T016 (backend: sequential)
- Backend and frontend T17/T18 can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```text
# All three tasks modify different files — launch together:
Task T001: "Add type interfaces in packages/backend/src/types/index.ts"
Task T002: "Add createWithVersao in packages/backend/src/repositories/musicas.repository.ts"
Task T003: "Add updateWithVersao in packages/backend/src/repositories/musicas.repository.ts"
# Note: T002 and T003 modify the same file — execute T002 first, then T003
```

## Parallel Example: Phase 3 (US1)

```text
# Backend and frontend schemas/services can run in parallel:
Task T004: "Add createComplete service method" (backend)
Task T007: "Add CreateMusicaCompleteFormSchema" (frontend schema)
Task T008: "Add createMusicaComplete service" (frontend service)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational (T001–T003)
2. Complete Phase 3: US1 (T004–T010)
3. **STOP and VALIDATE**: Music creation works with all fields via standard selects
4. The form already captures all data — inline creation is an enhancement added by US2/US3

### Incremental Delivery

1. Phase 2 → Foundation ready
2. US1 → Unified form with standard selects → **Deployable MVP**
3. US2 → Tonalidade combobox with inline creation → Enhanced UX
4. US3 → Artista combobox with inline creation → Full inline creation experience
5. US4 → Edit form with expanded fields → Feature complete

### Single Developer Strategy (Recommended)

Work sequentially through phases: Phase 2 → US1 → US2 → US3 → US4 → Polish.
Each phase builds on the previous. Validate at each checkpoint before proceeding.

---

## Notes

- No database migrations needed — all entities already exist in the schema
- Existing endpoints (tonalidade CRUD, artista CRUD, versão CRUD) are unchanged
- The `CreatableCombobox` component (T011) is reusable beyond this feature
- Frontend cache invalidation is handled by existing mutation hooks — no extra wiring needed
- Commit after each completed phase for clean git history
