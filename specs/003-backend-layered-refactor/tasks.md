# Tasks: Backend Layered Architecture Refactor

**Input**: Design documents from `/specs/003-backend-layered-refactor/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not included — spec clarification confirmed tests are out of scope. Only testable architecture is required.

**Organization**: Tasks grouped by user story. Each module follows the pattern: Repository -> Service -> Controller -> Route (sequential within module, parallelizable across modules).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend source**: `src/backend/src/`
- **Prisma client**: `src/backend/prisma/cliente.ts` (import as `../../prisma/cliente.js`)
- **All imports**: Must use `.js` extensions (NodeNext module resolution)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure for new architectural layers

- [X] T001 Create directories `errors/`, `types/`, `repositories/`, `services/`, `routes/` inside `src/backend/src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T002 [P] Create AppError class in `src/backend/src/errors/AppError.ts` — extends Error with `message: string` and `statusCode: number` (default 400), sets `this.name = 'AppError'`. Export as named export.
- [X] T003 [P] Create shared type interfaces in `src/backend/src/types/index.ts` — extract and consolidate all interfaces currently duplicated across controllers: `IdNome`, `IdTom`, `IntegranteWithFuncoes`, `MusicaRaw`, `Musica`, `VersaoRaw`, `EventoIndexRaw`, `EventoShowRaw`, `EventoShowMusica`, `EventoShowIntegrante`, plus Prisma select constants (`INTEGRANTE_PUBLIC_SELECT`, `MUSICA_SELECT`, `EVENTO_INDEX_SELECT`, `EVENTO_SHOW_SELECT`). Read all existing controllers to extract exact interface definitions before writing.

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Simple CRUD Modules (Priority: P1) — MVP

**Goal**: Refactor Tags, Tonalidades, Funcoes, and Tipos Eventos from fat controllers into Route/Controller/Service/Repository layers while preserving identical API behavior.

**Independent Test**: Send the same HTTP requests to each endpoint (GET, GET/:id, POST, PUT/:id, DELETE/:id) and compare status codes + JSON bodies — must be identical to the original.

### Tags (template module — do first to establish the pattern)

- [X] T004 [US1] Create `src/backend/src/repositories/tags.repository.ts` — extract all Prisma queries from `tagsController.ts`: `findAll()` (select id+nome), `findById(id)`, `findByNome(nome)`, `findByNomeExcludingId(nome, excludeId)`, `create(nome)`, `update(id, nome)`, `delete(id)`. Export singleton instance. Import Prisma client from `../../prisma/cliente.js`.
- [X] T005 [US1] Create `src/backend/src/services/tags.service.ts` — extract all business logic from `tagsController.ts`: `listAll()`, `getById(id)` with ID+existence validation, `create(nome)` with required+uniqueness checks, `update(id, nome)` with ID+existence+required+duplicate checks, `delete(id)` with ID+existence checks. Throw AppError with exact same error messages and status codes as original. Import from tags.repository and AppError.
- [X] T006 [US1] Rewrite `src/backend/src/controllers/tagsController.ts` as `src/backend/src/controllers/tags.controller.ts` — HTTP adapter only: parse req.params/req.body, call TagsService methods, catch AppError and return `res.status(error.statusCode).json({ errors: [error.message] })`, fallback 500 with same generic error messages. Preserve exact response shapes: `{ msg: "Tag criada com sucesso", tag }` etc. Remove all Prisma imports.
- [X] T007 [US1] Rewrite `src/backend/src/router/tagsRoutes.ts` as `src/backend/src/routes/tags.routes.ts` — update import to new `tags.controller.js` path. Keep same route definitions: GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id`.

### Tonalidades, Funcoes, Tipos Eventos (parallel — same pattern as Tags)

- [X] T008 [P] [US1] Create `src/backend/src/repositories/tonalidades.repository.ts` — same pattern as Tags but field is `tom` instead of `nome`. Methods: `findAll()` (select id+tom), `findById(id)`, `findByTom(tom)`, `findByTomExcludingId(tom, excludeId)`, `create(tom)`, `update(id, tom)`, `delete(id)`.
- [X] T009 [P] [US1] Create `src/backend/src/repositories/funcoes.repository.ts` — same pattern as Tags with `nome` field. Methods: `findAll()`, `findById(id)`, `findByNome(nome)`, `findByNomeExcludingId(nome, excludeId)`, `create(nome)`, `update(id, nome)`, `delete(id)`.
- [X] T010 [P] [US1] Create `src/backend/src/repositories/tipos-eventos.repository.ts` — same pattern as Tags with `nome` field. Methods: `findAll()`, `findById(id)`, `findByNome(nome)`, `findByNomeExcludingId(nome, excludeId)`, `create(nome)`, `update(id, nome)`, `delete(id)`. Prisma model is `tipos_Eventos`.
- [X] T011 [P] [US1] Create `src/backend/src/services/tonalidades.service.ts` — same pattern as TagsService but with `tom` field. Error messages must match exactly: "ID de tonalidade nao enviado", "Tom da tonalidade e obrigatorio", "A tonalidade nao foi encontrada ou nao existe", "Ja existe uma tonalidade com esse tom", "Tonalidade com esse ID nao existe ou nao foi encontrada", "Tom ja existe".
- [X] T012 [P] [US1] Create `src/backend/src/services/funcoes.service.ts` — same pattern as TagsService with `nome` field. Error messages must match exactly: "ID de funcao nao enviado", "Nome da funcao e obrigatorio", "A funcao nao foi encontrada ou nao existe", "Ja existe uma funcao com esse nome", "Funcao com esse ID nao existe ou nao foi encontrada", "Nome de funcao ja existe".
- [X] T013 [P] [US1] Create `src/backend/src/services/tipos-eventos.service.ts` — same pattern as TagsService with `nome` field. Error messages must match exactly: "ID de tipo de evento nao enviado", "Nome do tipo de evento e obrigatorio", "O tipo de evento nao foi encontrado ou nao existe", "Ja existe um tipo de evento com esse nome", "Tipo de evento com esse ID nao existe ou nao foi encontrado", "Nome do tipo de evento ja existe".
- [X] T014 [P] [US1] Rewrite `src/backend/src/controllers/tonalidadesController.ts` as `src/backend/src/controllers/tonalidades.controller.ts` — HTTP adapter using TonalidadesService. Response shapes: `{ msg: "Tonalidade criada com sucesso", tonalidade }` etc. Generic 500 messages: "Erro ao buscar tonalidades/tonalidade", "Erro ao criar tonalidade", "Erro ao editar tonalidade", "Erro ao deletar tonalidade".
- [X] T015 [P] [US1] Rewrite `src/backend/src/controllers/funcoesController.ts` as `src/backend/src/controllers/funcoes.controller.ts` — HTTP adapter using FuncoesService. Response shapes: `{ msg: "Funcao criada com sucesso", funcao }` etc.
- [X] T016 [P] [US1] Rewrite `src/backend/src/controllers/tiposEventosController.ts` as `src/backend/src/controllers/tipos-eventos.controller.ts` — HTTP adapter using TiposEventosService. Response shapes: `{ msg: "Tipo de evento criado com sucesso", tipoEvento }` etc.
- [X] T017 [P] [US1] Rewrite `src/backend/src/router/tonalidadesRoutes.ts` as `src/backend/src/routes/tonalidades.routes.ts` — update import to `tonalidades.controller.js`.
- [X] T018 [P] [US1] Rewrite `src/backend/src/router/funcoesRoutes.ts` as `src/backend/src/routes/funcoes.routes.ts` — update import to `funcoes.controller.js`.
- [X] T019 [P] [US1] Rewrite `src/backend/src/router/tiposEventosRoutes.ts` as `src/backend/src/routes/tipos-eventos.routes.ts` — update import to `tipos-eventos.controller.js`.
- [X] T020 [US1] Run `npm run typecheck` in `src/backend/` to verify all Phase 3 changes compile without errors

**Checkpoint**: US1 complete — all 4 simple CRUD modules refactored. Verify each endpoint returns identical responses before proceeding.

---

## Phase 4: User Story 2 — Artistas Module (Priority: P2)

**Goal**: Refactor the Artistas module, which adds nested `include` queries for the show endpoint (music versions with artista, bpm, cifras, lyrics, link_versao).

**Independent Test**: Create an artist, associate music versions, then verify GET /api/artistas/:id returns the same nested structure as the original.

### Implementation for User Story 2

- [X] T021 [US2] Create `src/backend/src/repositories/artistas.repository.ts` — extract Prisma queries: `findAll()` (select id+nome), `findById(id)` with nested include for `Artistas_Musicas` → `artistas_musicas_musica_id_fkey` (select id+nome) + bpm/cifras/lyrics/link_versao, `findByNome(nome)`, `findByNomeExcludingId(nome, excludeId)`, `create(nome)`, `update(id, nome)`, `delete(id)`. Read the existing `artistasController.ts` to get exact `include`/`select` structure.
- [X] T022 [US2] Create `src/backend/src/services/artistas.service.ts` — business logic: `listAll()`, `getById(id)` with ID+existence validation (format response to match original nested shape), `create(nome)` with required+uniqueness, `update(id, nome)` with all validations, `delete(id)`. Error messages must match: "Nome do artista e obrigatorio", "ID de artista nao enviado", "O artista nao foi encontrado ou nao existe", "Ja existe um artista com esse nome", "Artista com esse ID nao existe ou nao foi encontrado", "Nome do artista ja existe".
- [X] T023 [US2] Rewrite `src/backend/src/controllers/artistasController.ts` as `src/backend/src/controllers/artistas.controller.ts` — HTTP adapter using ArtistasService. Response shapes: `{ msg: "Artista criado com sucesso", artista }` etc. Show endpoint returns formatted nested object.
- [X] T024 [US2] Rewrite `src/backend/src/router/artistasRoutes.ts` as `src/backend/src/routes/artistas.routes.ts` — update import to `artistas.controller.js`.
- [X] T025 [US2] Run `npm run typecheck` in `src/backend/` to verify Phase 4 changes compile

**Checkpoint**: US2 complete — Artistas module refactored with nested relations. Verify GET /api/artistas/:id returns same nested versoes structure.

---

## Phase 5: User Story 3 — Complex Modules (Priority: P3)

**Goal**: Refactor Integrantes (bcrypt + junction), Musicas (pagination + 3 junctions + formatMusica + versao CRUD), and Eventos (2 junctions + 2 formatters + ISO 8601 validation) while preserving all endpoint behaviors.

**Independent Test**: Exercise every endpoint (CRUD + junction operations) for each module and compare full response payloads against the original.

### Integrantes (do first — establishes junction table pattern)

- [X] T026 [US3] Create `src/backend/src/repositories/integrantes.repository.ts` — extract Prisma queries: `findAll()` with funcoes include, `findById(id)` with funcoes include, `findByDocId(doc_id)`, `findByDocIdExcludingId(doc_id, excludeId)`, `create(data)` with INTEGRANTE_PUBLIC_SELECT, `update(id, data)` with INTEGRANTE_PUBLIC_SELECT, `delete(id)`, `findFuncoesByIntegranteId(integranteId)`, `findIntegranteFuncao(musico_id, funcao_id)`, `createIntegranteFuncao(musico_id, funcao_id)`, `deleteIntegranteFuncao(id)`. Read existing `integrantesController.ts` for exact select/include structures.
- [X] T027 [US3] Create `src/backend/src/services/integrantes.service.ts` — business logic: `listAll()` with funcoes formatting, `getById(id)`, `create(data)` with bcrypt hash (random salt 10-16 rounds) + doc_id stripping/uniqueness, `update(id, data)` with partial updates + optional password re-hash + doc_id duplicate check, `delete(id)`, `listFuncoes(integranteId)`, `addFuncao(integranteId, funcao_id)` with existence+duplicate checks, `removeFuncao(integranteId, funcaoId)` with existence check. All error messages must match original exactly.
- [X] T028 [US3] Rewrite `src/backend/src/controllers/integrantesController.ts` as `src/backend/src/controllers/integrantes.controller.ts` — HTTP adapter using IntegrantesService. 8 handler methods: index, show, create, update, delete, listFuncoes, addFuncao, removeFuncao. Response shapes must match original.
- [X] T029 [US3] Rewrite `src/backend/src/router/integrantesRoutes.ts` as `src/backend/src/routes/integrantes.routes.ts` — update import. Routes: GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id`, GET `/:integranteId/funcoes`, POST `/:integranteId/funcoes`, DELETE `/:integranteId/funcoes/:funcaoId`.

### Musicas (most complex — do after Integrantes)

- [X] T030 [US3] Create `src/backend/src/repositories/musicas.repository.ts` — extract Prisma queries: `findAll(skip, take)` with MUSICA_SELECT + orderBy nome, `count()`, `findById(id)` with full nested select, `create(data)`, `update(id, data)`, `delete(id)`, `findVersoes(musicaId)`, `findVersaoById(versaoId)`, `createVersao(data)`, `updateVersao(versaoId, data)`, `deleteVersao(versaoId)`, `findVersaoDuplicate(musicaId, artistaId)`, `findTags(musicaId)`, `createTag(musicaId, tagId)`, `deleteTag(id)`, `findTagDuplicate(musicaId, tagId)`, `findFuncoes(musicaId)`, `createFuncao(musicaId, funcaoId)`, `deleteFuncao(id)`, `findFuncaoDuplicate(musicaId, funcaoId)`. Read existing `musicasController.ts` for exact select structures.
- [X] T031 [US3] Create `src/backend/src/services/musicas.service.ts` — business logic: `listAll(page, limit)` with pagination (defaults: page=1 min 1, limit=20 min 1 max 100, calculate skip/take, return `{ items: formatted[], meta }`) using `formatMusica()`, `getById(id)`, `create(data)` with required nome+fk_tonalidade, `update(id, data)` with partial updates, `delete(id)`, `formatMusica(raw)` function, `listVersoes(musicaId)`, `addVersao(musicaId, data)` with artista existence+duplicate, `updateVersao(musicaId, versaoId, data)`, `removeVersao(musicaId, versaoId)`, `listTags(musicaId)`, `addTag(musicaId, tagId)` with tag existence+duplicate, `removeTag(musicaId, tagId)`, `listFuncoes(musicaId)`, `addFuncao(musicaId, funcaoId)` with funcao existence+duplicate, `removeFuncao(musicaId, funcaoId)`. All error messages must match original exactly.
- [X] T032 [US3] Rewrite `src/backend/src/controllers/musicasController.ts` as `src/backend/src/controllers/musicas.controller.ts` — HTTP adapter using MusicasService. 16 handler methods: index (parse page/limit from req.query), show, create, update, delete, listVersoes, addVersao, updateVersao, removeVersao, listTags, addTag, removeTag, listFuncoes, addFuncao, removeFuncao. Response shapes must match original.
- [X] T033 [US3] Rewrite `src/backend/src/router/musicasRoutes.ts` as `src/backend/src/routes/musicas.routes.ts` — update import. All 16 route definitions preserved.

### Eventos (complex — can parallel with Musicas if desired)

- [X] T034 [P] [US3] Create `src/backend/src/repositories/eventos.repository.ts` — extract Prisma queries: `findAll()` with EVENTO_INDEX_SELECT + orderBy data desc, `findById(id)` with EVENTO_SHOW_SELECT, `create(data)`, `update(id, data)`, `delete(id)`, `findMusicas(eventoId)`, `createMusica(eventoId, musicasId)`, `deleteMusica(id)`, `findMusicaDuplicate(eventoId, musicasId)`, `findIntegrantes(eventoId)`, `createIntegrante(eventoId, musicoId)`, `deleteIntegrante(id)`, `findIntegranteDuplicate(eventoId, musicoId)`. Read existing `eventosController.ts` for exact select structures.
- [X] T035 [P] [US3] Create `src/backend/src/services/eventos.service.ts` — business logic: `listAll()` using `formatEventoIndex()`, `getById(id)` using `formatEventoShow()`, `create(data)` with required data+fk_tipo_evento+descricao + ISO 8601 date parsing, `update(id, data)` with partial updates + date re-parsing + "ao menos um campo" check, `delete(id)`, `formatEventoIndex(raw)`, `formatEventoShow(raw)`, `listMusicas(eventoId)`, `addMusica(eventoId, musicasId)` with musica existence+duplicate, `removeMusica(eventoId, musicaId)`, `listIntegrantes(eventoId)`, `addIntegrante(eventoId, musicoId)` with integrante existence+duplicate, `removeIntegrante(eventoId, integranteId)`. All error messages must match original exactly.
- [X] T036 [P] [US3] Rewrite `src/backend/src/controllers/eventosController.ts` as `src/backend/src/controllers/eventos.controller.ts` — HTTP adapter using EventosService. 11 handler methods: index, show, create, update, delete, listMusicas, addMusica, removeMusica, listIntegrantes, addIntegrante, removeIntegrante.
- [X] T037 [P] [US3] Rewrite `src/backend/src/router/eventosRoutes.ts` as `src/backend/src/routes/eventos.routes.ts` — update import. All 11 route definitions preserved.
- [X] T038 [US3] Run `npm run typecheck` in `src/backend/` to verify all Phase 5 changes compile

**Checkpoint**: US3 complete — all 3 complex modules refactored. Verify junction operations, pagination, formatting, bcrypt, and date validation all produce identical responses.

---

## Phase 6: User Story 4 — Testability Verification (Priority: P4)

**Goal**: Verify the refactored architecture supports independent unit testing of business logic by confirming layer boundary rules are enforced.

**Independent Test**: Verify import boundaries — no controller imports Prisma, no service imports Express types.

### Verification for User Story 4

- [X] T039 [P] [US4] Verify no controller file in `src/backend/src/controllers/` imports from `prisma/cliente` or `@prisma/client` — search all `.controller.ts` files for Prisma-related imports. If any found, fix the violation.
- [X] T040 [P] [US4] Verify no service file in `src/backend/src/services/` imports from `express` or uses `Request`/`Response` types — search all `.service.ts` files for Express-related imports. If any found, fix the violation.

**Checkpoint**: US4 complete — architecture confirmed testable. Services can be unit tested by mocking repositories without HTTP or database dependencies.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup — Home module, app.ts wiring, old file deletion, final validation

- [X] T041 [P] Rewrite `src/backend/src/controllers/homeController.ts` as `src/backend/src/controllers/home.controller.ts` — simple controller with no service/repository (FR-018). Preserve exact same response.
- [X] T042 [P] Rewrite `src/backend/src/router/homeRoutes.ts` as `src/backend/src/routes/home.routes.ts` — update import to `home.controller.js`.
- [X] T043 Update `src/backend/src/app.ts` — change all 9 route imports from `./router/xxxRoutes.js` to `./routes/xxx.routes.js`. Preserve all route registrations with same base paths. Do NOT change middleware or error handler.
- [X] T044 Delete old files: remove all original files in `src/backend/src/router/` directory (8 old route files) and all original controller files in `src/backend/src/controllers/` that have been replaced (9 old controller files). Then delete the empty `src/backend/src/router/` directory.
- [X] T045 Run final `npm run typecheck` in `src/backend/` — must pass with zero errors. This validates the entire refactoring.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — Tags first as template, then Tonalidades/Funcoes/Tipos Eventos in parallel
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 but recommended after US1 validates the pattern
- **US3 (Phase 5)**: Depends on Phase 2 — Integrantes first (establishes junction pattern), then Musicas and Eventos can be parallel
- **US4 (Phase 6)**: Depends on US1 + US2 + US3 completion
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. No dependencies on other stories.
- **US2 (P2)**: Can start after Phase 2. Recommended after US1 to reuse the validated pattern.
- **US3 (P3)**: Can start after Phase 2. Recommended after US1+US2 to build on proven patterns.
- **US4 (P4)**: Depends on US1 + US2 + US3 — verification of all layers.

### Within Each Module

Sequential: Repository -> Service -> Controller -> Route

### Parallel Opportunities

- T002 and T003 (AppError + types) are parallel
- T008, T009, T010 (Tonalidades/Funcoes/Tipos Eventos repositories) are parallel after Tags is done
- T011, T012, T013 (services for those 3 modules) are parallel after their respective repos
- T014, T015, T016 (controllers for those 3 modules) are parallel
- T017, T018, T019 (routes for those 3 modules) are parallel
- T034-T037 (Eventos) can run in parallel with T030-T033 (Musicas) — different files, no dependencies
- T039, T040 (layer verification) are parallel
- T041, T042 (Home controller + route) are parallel

---

## Parallel Example: User Story 1 (after Tags template)

```bash
# Launch all 3 remaining simple CRUD repositories in parallel:
Task: "Create tonalidades.repository.ts"
Task: "Create funcoes.repository.ts"
Task: "Create tipos-eventos.repository.ts"

# After repos complete, launch all 3 services in parallel:
Task: "Create tonalidades.service.ts"
Task: "Create funcoes.service.ts"
Task: "Create tipos-eventos.service.ts"

# After services complete, launch all 3 controllers in parallel:
Task: "Rewrite tonalidades.controller.ts"
Task: "Rewrite funcoes.controller.ts"
Task: "Rewrite tipos-eventos.controller.ts"

# After controllers, launch all 3 routes in parallel:
Task: "Rewrite tonalidades.routes.ts"
Task: "Rewrite funcoes.routes.ts"
Task: "Rewrite tipos-eventos.routes.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (1 task)
2. Complete Phase 2: Foundational (2 tasks)
3. Complete Phase 3: US1 — Tags first, then 3 remaining CRUDs (17 tasks)
4. **STOP and VALIDATE**: Verify all 4 simple CRUD modules return identical responses
5. This covers 4 of 9 modules and validates the entire architectural pattern

### Incremental Delivery

1. Setup + Foundational -> Foundation ready (3 tasks)
2. US1: 4 simple CRUDs -> Validate -> Pattern proven (17 tasks)
3. US2: Artistas -> Validate nested relations (5 tasks)
4. US3: Integrantes + Musicas + Eventos -> Validate complex logic (13 tasks)
5. US4: Layer boundary verification (2 tasks)
6. Polish: Home + app.ts + cleanup (5 tasks)
7. Each increment adds value without breaking previous modules

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- All error messages must be character-for-character identical to the original — read existing controllers before writing services
- All imports must use `.js` extensions (NodeNext module resolution)
- Singleton pattern: `export default new XxxRepository()` / `export default new XxxService()`
- Formatting functions (formatMusica, formatEventoIndex, formatEventoShow) go in the Service file, not utils
- Prisma model names use the exact casing from schema.prisma (e.g., `prisma.tags`, `prisma.tipos_Eventos`)
- After each module, verify `npm run typecheck` passes
- The old router/ directory and old controller files are deleted only in Phase 7 (T044) after all modules are migrated
