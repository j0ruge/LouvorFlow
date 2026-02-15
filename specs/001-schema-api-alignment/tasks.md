# Tasks: Schema & API Alignment with ER Model

**Input**: Design documents from `/specs/001-schema-api-alignment/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested — manual HTTP testing per quickstart.md.

**Organization**: Tasks grouped by user story. US2 (schema) and US3 (structural fixes) are foundational prerequisites. US1 (CRUDs) is the main body. US4 (frontend) is independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project already exists — no setup tasks needed.

_(Skipped — project structure, dependencies, and database are already configured.)_

---

## Phase 2: Foundational (US2 Schema + US3 Structural Fixes)

**Purpose**: Fix schema gaps and backend structural issues before adding any new endpoints. BLOCKS all user story work.

### Schema Changes (US2)

- [ ] T001 [US2] Update Prisma schema in `src/backend/prisma/schema.prisma` — all changes below go into a **single migration** (see T002):
  - [ ] T001a — Add `Tags` model (`id`, `nome` `@unique`, `created_at`, `updated_at`)
  - [ ] T001b — Add `Musicas_Tags` model (`id`, `musica_id` FK → `Musicas`, `tag_id` FK → `Tags`, `@@unique([musica_id, tag_id])`)
  - [ ] T001c — Add `telefone String? @db.VarChar(20)` to `Integrantes` model
  - [ ] T001d — Add `@unique` on `Funcoes.nome`, `Tonalidades.tom`, and `Tags.nome`
  - [ ] T001e — Add `@@unique` composite constraints on all 6 junction tables: `artistas_musicas` (artista_id + musica_id), `eventos_musicas` (evento_id + musica_id), `eventos_integrantes` (evento_id + integrante_id), `integrantes_funcoes` (integrante_id + funcao_id), `musicas_funcoes` (musica_id + funcao_id), `musicas_tags` (musica_id + tag_id)
  - [ ] T001f — Add `Musicas_Tags` relation fields on both `Musicas` (has-many `musicas_tags`) and `Tags` (has-many `musicas_tags`) models
- [ ] T002 [US2] Run Prisma migration and regenerate client — execute `npx prisma migrate dev --name add_tags_telefone_uniques` then `npx prisma generate` from `src/backend/`

### Backend Structural Refactoring (US3)

- [ ] T003 [P] [US3] Refactor `src/backend/index.js` — replace `require('dotenv').config()` with `import 'dotenv/config'`, replace `const express = require('express')` and `const cors = require('cors')` with ES import syntax, remove `app.use(cors())` and `app.use(express.json())` (these move to app.js), keep only: dotenv import, app import, prisma import, database connection IIFE, and `app.listen()`
- [ ] T004 [P] [US3] Refactor `src/backend/src/app.js` — replace `const express = require('express')` with `import express from 'express'`, add `import cors from 'cors'`, add `this.app.use(cors())` as first middleware (before urlencoded and json), change route mounting from `this.app.use('/artistas', ...)` to `this.app.use('/api/artistas', ...)` and `this.app.use('/integrantes', ...)` to `this.app.use('/api/integrantes', ...)`
- [ ] T005 [P] [US3] Refactor `src/backend/src/controllers/artistasController.js` — change all error responses from `{ errors: 'string' }` and `{ errors: ['array'] }` to consistent `{ errors: ["message"] }` array format per FR-008a; verify response structure matches contract in `contracts/base-entities.md`
- [ ] T006 [P] [US3] Refactor `src/backend/src/controllers/integrantesController.js` — remove `senha` from all Prisma `select` objects (replace with `{ id: true, nome: true, doc_id: true, email: true, telefone: true }`), add `telefone` to all select/response shapes, change all error responses to `{ errors: ["message"] }` array format, remove unused `const { randomInt } = require('crypto')` and `const bcrypt = require('bcryptjs')` — replace with ES import syntax `import { randomInt } from 'crypto'` and `import bcrypt from 'bcryptjs'`
- [ ] T007 [US3] Verify refactored backend starts successfully — run `npm run dev` from `src/backend/`, confirm `GET /api/artistas` returns 200, confirm `GET /api/integrantes` returns 200 without `senha` field, confirm old paths `/artistas` and `/integrantes` return 404

**Checkpoint**: Schema updated, migration applied, backend structure clean. Ready for new endpoints.

---

## Phase 3: User Story 1 — Complete Backend CRUD for All Entities (Priority: P1) MVP

**Goal**: Every entity in the ER model has a working REST API endpoint under `/api/`.

**Independent Test**: Send HTTP requests to each endpoint and verify correct JSON responses with proper status codes. Use quickstart.md smoke test commands.

### Lookup Entity CRUDs (parallel — different files, identical pattern)

- [ ] T008 [P] [US1] Create tonalidades CRUD controller and routes — `src/backend/src/controllers/tonalidadesController.js` (class-based, index/show/create/update/delete, unique `tom` validation, error format `{ errors: [] }`) and `src/backend/src/routes/tonalidadesRoutes.js` (GET /, GET /:id, POST /, PUT /:id, DELETE /:id). Follow contract in `contracts/base-entities.md` Tonalidades section
- [ ] T009 [P] [US1] Create funcoes CRUD controller and routes — `src/backend/src/controllers/funcoesController.js` (unique `nome` validation) and `src/backend/src/routes/funcoesRoutes.js`. Follow contract in `contracts/base-entities.md` Funcoes section
- [ ] T010 [P] [US1] Create tags CRUD controller and routes — `src/backend/src/controllers/tagsController.js` (unique `nome` validation) and `src/backend/src/routes/tagsRoutes.js`. Follow contract in `contracts/base-entities.md` Tags section
- [ ] T011 [P] [US1] Create tipos_eventos CRUD controller and routes — `src/backend/src/controllers/tiposEventosController.js` (unique `nome` validation) and `src/backend/src/routes/tiposEventosRoutes.js`. Follow contract in `contracts/base-entities.md` Tipos_Eventos section

### Complex Entity CRUDs (parallel with each other — different files)

- [ ] T012 [P] [US1] Create musicas base CRUD controller and routes — `src/backend/src/controllers/musicasController.js` (index/show/create/update/delete with Prisma `include` for tonalidade, tags, artistas_musicas with artista, and musicas_funcoes with funcao in GET responses) and `src/backend/src/routes/musicasRoutes.js`. Follow contract in `contracts/base-entities.md` Musicas section
- [ ] T013 [P] [US1] Create eventos base CRUD controller and routes — `src/backend/src/controllers/eventosController.js` (index/show/create/update/delete with Prisma `include` for tipo_evento, eventos_musicas with musica, and eventos_integrantes with integrante in GET responses) and `src/backend/src/routes/eventosRoutes.js`. Follow contract in `contracts/base-entities.md` Eventos section

### Junction Endpoints for Musicas (sequential — same files as T012)

- [ ] T014 [US1] Add versoes (artistas_musicas) junction endpoints to musicas — add listVersoes/addVersao/updateVersao/removeVersao methods to `src/backend/src/controllers/musicasController.js`, add GET/POST/PUT/DELETE `/:musicaId/versoes` routes to `src/backend/src/routes/musicasRoutes.js`. Enforce composite unique (artista_id + musica_id), return 409 on duplicate. Follow contract in `contracts/junction-endpoints.md` Versoes section
- [ ] T015 [US1] Add tags (musicas_tags) junction endpoints to musicas — add listTags/addTag/removeTag methods to `src/backend/src/controllers/musicasController.js`, add GET/POST/DELETE `/:musicaId/tags` routes to `src/backend/src/routes/musicasRoutes.js`. Follow contract in `contracts/junction-endpoints.md` Musicas_Tags section
- [ ] T016 [US1] Add funcoes (musicas_funcoes) junction endpoints to musicas — add listFuncoes/addFuncao/removeFuncao methods to `src/backend/src/controllers/musicasController.js`, add GET/POST/DELETE `/:musicaId/funcoes` routes to `src/backend/src/routes/musicasRoutes.js`. Follow contract in `contracts/junction-endpoints.md` Musicas_Funcoes section

### Junction Endpoints for Eventos (sequential — same files as T013)

- [ ] T017 [US1] Add musicas (eventos_musicas) junction endpoints to eventos — add listMusicas/addMusica/removeMusica methods to `src/backend/src/controllers/eventosController.js`, add GET/POST/DELETE `/:eventoId/musicas` routes to `src/backend/src/routes/eventosRoutes.js`. Follow contract in `contracts/junction-endpoints.md` Eventos_Musicas section
- [ ] T018 [US1] Add integrantes (eventos_integrantes) junction endpoints to eventos — add listIntegrantes/addIntegrante/removeIntegrante methods to `src/backend/src/controllers/eventosController.js`, add GET/POST/DELETE `/:eventoId/integrantes` routes to `src/backend/src/routes/eventosRoutes.js`. Follow contract in `contracts/junction-endpoints.md` Eventos_Integrantes section

### Junction Endpoints for Integrantes (parallel with T014-T018 — different files)

- [ ] T019 [P] [US1] Add funcoes (integrantes_funcoes) junction endpoints to integrantes — add listFuncoes/addFuncao/removeFuncao methods to `src/backend/src/controllers/integrantesController.js`, add GET/POST/DELETE `/:integranteId/funcoes` routes to `src/backend/src/routes/integrantesRoutes.js`. Follow contract in `contracts/junction-endpoints.md` Integrantes_Funcoes section

### Route Registration

- [ ] T020 [US1] Register all new routes in `src/backend/src/app.js` — import musicasRoutes, tonalidadesRoutes, funcoesRoutes, tagsRoutes, tiposEventosRoutes, eventosRoutes and mount them under `/api/musicas`, `/api/tonalidades`, `/api/funcoes`, `/api/tags`, `/api/tipos-eventos`, `/api/eventos` respectively

**Checkpoint**: All 8 base entities and 6 junction tables have working API endpoints. US1 is fully functional and testable via quickstart.md smoke commands.

---

## Phase 4: User Story 4 — Frontend Data Model Alignment (Priority: P2)

**Goal**: All frontend mock data shapes match the ER model and API response contracts. Branding corrected.

**Independent Test**: Run frontend (`npm run dev` from `src/frontend/`), navigate each page, and verify displayed data matches the entity shapes from `contracts/base-entities.md`. Sidebar shows "LouvorFlow".

### Implementation (all parallel — different files)

- [ ] T021 [P] [US4] Update `src/frontend/src/components/AppSidebar.tsx` — change "EscalaCanto" to "LouvorFlow" in the sidebar header text (appears in both collapsed and expanded states)
- [ ] T022 [P] [US4] Update `src/frontend/src/pages/Songs.tsx` — restructure mock data from flat `{ id, title, artist, key, bpm, tags }` to ER-aligned shape: `{ id, nome, tonalidade: { id, tom }, versoes: [{ id, artista: { id, nome }, bpm, cifras }], tags: [{ id, nome }] }`. Update JSX to render from new shape (song.nome, song.tonalidade.tom, song.versoes[0].artista.nome, etc.)
- [ ] T023 [P] [US4] Update `src/frontend/src/pages/Members.tsx` — replace mock data from `{ id, name, role, email, phone, instruments }` to ER-aligned shape: `{ id, nome, doc_id, email, telefone, funcoes: [{ id, nome }] }`. Remove `phone` and `instruments` fields, add `telefone` and `funcoes` array. Update JSX to render funcoes as badges instead of instruments
- [ ] T024 [P] [US4] Update `src/frontend/src/pages/Scales.tsx` — replace mock data from `{ id, date, service, minister, singers, musicians, songs, status }` to ER-aligned shape: `{ id, data, descricao, tipoEvento: { id, nome }, musicas: [{ id, nome }], integrantes: [{ id, nome, funcoes: [{ nome }] }] }`. Update JSX to render from new shape
- [ ] T025 [P] [US4] Update `src/frontend/src/pages/Dashboard.tsx` — align stats mock data to use entity counts matching API shapes; update recent scales section to use `{ data, tipoEvento: { nome }, musicas: [...], integrantes: [...] }` shape; update trending songs to use `{ nome, tonalidade: { tom } }` shape

**Checkpoint**: All frontend pages display data matching ER model entities. Sidebar reads "LouvorFlow".

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [ ] T026 Run quickstart.md smoke test — start database, backend, and frontend; execute all curl commands from `specs/001-schema-api-alignment/quickstart.md`; verify all endpoints return expected responses
- [ ] T027 Final validation sweep — grep all `src/backend/` files for `require(` to confirm zero CommonJS imports; grep `integrantesController.js` for `senha` to confirm it only appears in password hashing logic (create/update), never in select/response; verify all routes use `/api/` prefix; confirm `{ errors: [] }` format in all controllers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No external dependencies — can start immediately. T001→T002 sequential (schema then migration). T003/T004/T005/T006 parallel (different files). T007 depends on all T001-T006.
- **Phase 3 (US1)**: Depends on Phase 2 completion. T008-T011 parallel. T012/T013 parallel. T014→T015→T016 sequential (same files). T017→T018 sequential (same files). T019 parallel with T014-T018. T020 depends on all T008-T019.
- **Phase 4 (US4)**: Depends on Phase 2 only (not on Phase 3). T021-T025 all parallel.
- **Phase 5 (Polish)**: Depends on Phase 3 + Phase 4 completion.

### User Story Dependencies

```
US2 (Schema) ──┐
                ├──> US1 (CRUDs) ──> Phase 5 (Polish)
US3 (Refactor) ─┘         │
                           │
US4 (Frontend) ────────────┘
   (can start after Phase 2, parallel with US1)
```

### Within Each Phase

- Phase 2: Schema first (T001→T002), then refactoring (T003-T006 parallel), then verify (T007)
- Phase 3: Lookups first (T008-T011 parallel), then complex entities (T012||T013 parallel), then junctions per parent (sequential within, parallel across), then registration (T020)
- Phase 4: All tasks parallel (different files)

### Parallel Opportunities

**Phase 2** — 4 tasks in parallel:

```
T003 (index.js) || T004 (app.js) || T005 (artistasController) || T006 (integrantesController)
```

**Phase 3** — Lookup CRUDs:

```
T008 (tonalidades) || T009 (funcoes) || T010 (tags) || T011 (tiposEventos)
```

**Phase 3** — Complex entities + junctions (3 parallel streams):

```
Stream A: T012 (musicas CRUD) → T014 (versoes) → T015 (tags) → T016 (funcoes)
Stream B: T013 (eventos CRUD) → T017 (musicas) → T018 (integrantes)
Stream C: T019 (integrantes funcoes) — independent
```

**Phase 4** — All frontend tasks:

```
T021 (sidebar) || T022 (songs) || T023 (members) || T024 (scales) || T025 (dashboard)
```

---

## Implementation Strategy

### MVP First (Phase 2 + Phase 3)

1. Complete Phase 2: Schema + Structural Fixes
2. Complete Phase 3: All CRUD Endpoints
3. **STOP and VALIDATE**: Run quickstart.md smoke test
4. Backend is fully functional — all 14 entities accessible via API

### Incremental Delivery

1. Phase 2 → Foundation ready (schema correct, backend clean)
2. Phase 3 (T008-T011) → Lookup CRUDs working (tonalidades, funcoes, tags, tipos_eventos)
3. Phase 3 (T012-T020) → All CRUDs + junctions working (full API)
4. Phase 4 → Frontend aligned with ER model
5. Phase 5 → Final validation

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Phase 2 (Foundational) | 7 | T003/T004/T005/T006 |
| Phase 3 (US1 CRUDs) | 13 | T008-T011, T012/T013, 3 parallel streams |
| Phase 4 (US4 Frontend) | 5 | All 5 tasks |
| Phase 5 (Polish) | 2 | Sequential |
| **Total** | **27** | |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All controllers follow existing class-based pattern from `artistasController.js`
- All error responses use `{ errors: ["message"] }` format
- All GET responses include direct relations via Prisma `include`
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
