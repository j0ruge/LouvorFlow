# Tasks: Backend TypeScript Refactor

**Input**: Design documents from `/specs/002-backend-typescript-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story. US1 (behavior preservation) is the bulk of the work. US2 (type safety) is quality verification. US3 (readability) is acceptance validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend root**: `src/backend/`
- **Controllers**: `src/backend/src/controllers/`
- **Routers**: `src/backend/src/router/`
- **Prisma**: `src/backend/prisma/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install TypeScript tooling, configure compiler, update scripts — no source files changed yet.

- [x] T001 Install TypeScript dev dependencies (`typescript`, `tsx`, `@types/express`, `@types/cors`, `@types/node`, `@types/bcryptjs`) and remove `sucrase` from dependencies and `nodemon` from devDependencies in `src/backend/package.json`
- [x] T002 [P] Create TypeScript configuration with `module: "NodeNext"`, `strict: true`, `outDir: "./dist"` in `src/backend/tsconfig.json` — see `quickstart.md` for exact settings
- [x] T003 [P] Update `scripts` in `src/backend/package.json`: set `dev` to `tsx watch index.ts`, `build` to `tsc`, `start` to `node dist/index.js`, `typecheck` to `tsc --noEmit`
- [x] T004 [P] Delete `src/backend/nodemon.json` — replaced by `tsx watch`
- [x] T005 Run `npx prisma generate` in `src/backend/` to produce TypeScript type definitions from schema

**Checkpoint**: TypeScript tooling installed, tsconfig configured, package.json updated. No source files changed yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Convert the Prisma client — the shared dependency imported by ALL controllers.

**CRITICAL**: No controller conversion can begin until this task is complete.

- [x] T006 Convert `src/backend/prisma/cliente.js` → `src/backend/prisma/cliente.ts` — wrap `PrismaClient().$extends(...)` in a `createPrismaClient()` factory function, export `type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>`, type the `strip` function parameter as `Record<string, unknown>`, type the `$allOperations` callback parameters. Keep all import paths using `.js` extensions. See `research.md` Decision 5 for the exact pattern.

**Checkpoint**: Prisma client converted. Controllers can now be converted in parallel.

---

## Phase 3: User Story 1 — API Behavior Preserved After Refactoring (Priority: P1) — MVP

**Goal**: All 20 backend files converted from `.js` to `.ts` with proper type annotations. The application compiles, starts, and all 59 endpoints return identical responses.

**Independent Test**: Start the app with `npm run dev`, send HTTP requests to every endpoint, confirm responses match the JavaScript version exactly.

### Implementation for User Story 1

**Controllers — Simple CRUD (6 files, all parallelizable):**

- [x] T007 [P] [US1] Convert `src/backend/src/controllers/homeController.js` → `.ts` — add `Request`, `Response` types from `express` to the `index` method signature. Keep `export default new homeController()` pattern.
- [x] T008 [P] [US1] Convert `src/backend/src/controllers/artistasController.js` → `.ts` — add `Request`, `Response` types to all 5 CRUD methods (`index`, `show`, `create`, `update`, `delete`). Type `show`/`update`/`delete` params as `Request<{ id: string }>`. Type `create`/`update` body destructuring. Keep `.js` import extensions unchanged.
- [x] T009 [P] [US1] Convert `src/backend/src/controllers/tonalidadesController.js` → `.ts` — same CRUD pattern as artistasController. Type all 5 methods with `Request`/`Response`. Type `updateData` in `update` method.
- [x] T010 [P] [US1] Convert `src/backend/src/controllers/funcoesController.js` → `.ts` — same CRUD pattern. Type all 5 methods.
- [x] T011 [P] [US1] Convert `src/backend/src/controllers/tagsController.js` → `.ts` — same CRUD pattern. Type all 5 methods.
- [x] T012 [P] [US1] Convert `src/backend/src/controllers/tiposEventosController.js` → `.ts` — same CRUD pattern. Type all 5 methods.

**Controllers — Complex with junction methods (3 files, all parallelizable):**

- [x] T013 [P] [US1] Convert `src/backend/src/controllers/integrantesController.js` → `.ts` — type all 8 methods (5 CRUD + 3 junction). Type `INTEGRANTE_PUBLIC_SELECT` constant. Add `import { randomInt } from 'crypto'` types. Type `bcrypt` usage. Type `updateData` object in `update`. Type junction method params (`integranteId`, `funcaoId`).
- [x] T014 [P] [US1] Convert `src/backend/src/controllers/musicasController.js` → `.ts` — type all 14 methods (5 CRUD + 9 junction). Type `MUSICA_SELECT` constant. Type `formatMusica` function parameter and return. Type pagination logic (`page`, `limit`). Type all junction method params (`musicaId`, `versaoId`, `tagId`, `funcaoId`). Type `updateData` in `update` and `updateVersao`.
- [x] T015 [P] [US1] Convert `src/backend/src/controllers/eventosController.js` → `.ts` — type all 11 methods (5 CRUD + 6 junction). Type `EVENTO_INDEX_SELECT` and `EVENTO_SHOW_SELECT` constants. Type `formatEventoIndex` and `formatEventoShow` function parameters and returns. Type `updateData` in `update`. Type junction method params (`eventoId`, `musicaId`, `integranteId`).

**Routers (8 files):**

- [x] T016 [P] [US1] Convert all 8 router files → `.ts` in `src/backend/src/router/`: `homeRoutes`, `artistasRoutes`, `integrantesRoutes`, `musicasRoutes`, `tonalidadesRoutes`, `funcoesRoutes`, `tagsRoutes`, `tiposEventosRoutes`, `eventosRoutes`. For each: rename `.js` → `.ts`, add `Router` type annotation to `const router: Router = Router()`, keep all `.js` import extensions unchanged. All routers follow the same minimal pattern.

**App & Entry Point (sequential — app imports routers, index imports app):**

- [x] T017 [US1] Convert `src/backend/src/app.js` → `.ts` — type the `App` class: `app` property as `express.Express`, `middlewares()` and `routes()` return types as `void`. Add `import express` type for the Express application instance.
- [x] T018 [US1] Convert `src/backend/index.js` → `.ts` — type `PORT` as `string | undefined` from `process.env.PORT`. Add return type to the async IIFE.
- [x] T019 [US1] Add `dist/` to `src/backend/.gitignore` (create file if it doesn't exist) to exclude production build output

**Verification:**

- [x] T020 [US1] Start the application with `npm run dev` in `src/backend/` and verify: (1) app starts without errors, (2) `GET /` returns `"Rota de Início"`, (3) `GET /api/artistas` returns JSON array, (4) `GET /api/integrantes` returns data without `senha` field, (5) `GET /api/musicas` returns paginated response with `items` and `meta`, (6) error responses return `{ errors: [...] }` format

**Checkpoint**: All 20 files converted to TypeScript. Application starts and serves all 59 endpoints identically to the JavaScript version. US1 is complete and independently verifiable.

---

## Phase 4: User Story 2 — Type-Safe Development Experience (Priority: P2)

**Goal**: The TypeScript compiler catches type errors at development time. Zero `any` types in business logic. All Prisma queries use generated types.

**Independent Test**: Run `npm run typecheck` — should report zero errors. Introduce a deliberate type error (e.g., misspell a Prisma field name) and confirm it's caught.

### Implementation for User Story 2

- [x] T021 [US2] Run `npm run typecheck` (tsc --noEmit) in `src/backend/` and fix ALL reported type errors. Iterate until zero errors remain. Document any tricky type issues encountered.
- [x] T022 [P] [US2] Audit all 9 controller files in `src/backend/src/controllers/` for `any` type usage — replace every instance with specific types (`Record<string, unknown>`, Prisma generated input types, or explicit interfaces). Verify SC-005 compliance.
- [x] T023 [P] [US2] Verify Prisma type integration in `src/backend/src/controllers/` — confirm all model types come from `@prisma/client` (no manual entity type definitions), `select` constants are typed by Prisma inference, `updateData` objects use compatible types.

**Checkpoint**: Type checker reports zero errors. No `any` in business logic. Prisma types properly integrated. US2 is complete.

---

## Phase 5: User Story 3 — Codebase Readability for New Contributors (Priority: P3)

**Goal**: Type annotations serve as self-documenting code. A new contributor can trace data flow from route → controller → database through types alone.

**Independent Test**: Open any router file, follow a route handler to its controller, verify the method signature documents the expected request shape and the Prisma query documents the data model.

### Implementation for User Story 3

- [x] T024 [US3] Review all controller method signatures in `src/backend/src/controllers/` and verify: (1) every method has explicit `Request` and `Response` types, (2) methods with path params use `Request<{ paramName: string }>` generics, (3) Prisma select constants have inferred types that show the response shape, (4) `formatMusica`, `formatEventoIndex`, `formatEventoShow` helper functions have typed parameters

**Checkpoint**: Type annotations serve as living documentation. US3 is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all user stories.

- [x] T025 Run full validation in `src/backend/`: (1) `npm run typecheck` passes with zero errors, (2) `npm run dev` starts the app, (3) spot-check at least one endpoint per resource (9 resources), (4) verify `npm run build` produces output in `dist/`
- [x] T026 Verify no leftover `.js` source files remain in `src/backend/src/` and `src/backend/prisma/` (only `.ts` files should exist). Confirm `src/backend/index.ts` is the entry point (no `index.js` remains).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────┐
                                                  │
Phase 2: Foundational (T006 - Prisma client) ←───┘
     │
     ├──→ Phase 3: US1 (P1) - File conversion & behavior verification
     │         │
     │         └──→ Phase 4: US2 (P2) - Type safety audit
     │                   │
     │                   └──→ Phase 5: US3 (P3) - Readability verification
     │                             │
     └─────────────────────────────└──→ Phase 6: Polish
```

### User Story Dependencies

- **US1 (P1)**: Depends on Setup + Foundational only. This is the MVP — can stop here and have a working TypeScript backend.
- **US2 (P2)**: Depends on US1 completion (all files must be .ts before type auditing).
- **US3 (P3)**: Depends on US2 completion (types must be correct before assessing readability).

### Within User Story 1

```
T007-T015 (controllers) ──→ all parallelizable, independent files
T016 (routers) ────────────→ parallelizable with controllers (different files)
T017 (app.ts) ─────────────→ after controllers + routers (imports them)
T018 (index.ts) ───────────→ after app.ts (imports it)
T019 (.gitignore) ─────────→ parallel with anything
T020 (verify) ─────────────→ after T017 + T018
```

### Parallel Opportunities

**Phase 1** — T002, T003, T004 can run in parallel (different files)

**Phase 3 (US1)** — Maximum parallelism: T007 through T016 (10 tasks) can ALL run in parallel since each touches a different file

**Phase 4 (US2)** — T022, T023 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch ALL controller conversions in parallel (10 independent files):
Task: "Convert homeController.js → .ts"
Task: "Convert artistasController.js → .ts"
Task: "Convert tonalidadesController.js → .ts"
Task: "Convert funcoesController.js → .ts"
Task: "Convert tagsController.js → .ts"
Task: "Convert tiposEventosController.js → .ts"
Task: "Convert integrantesController.js → .ts"
Task: "Convert musicasController.js → .ts"
Task: "Convert eventosController.js → .ts"
Task: "Convert all 8 router files → .ts"

# Then sequentially (dependency chain):
Task: "Convert app.js → .ts"       # imports routers
Task: "Convert index.js → .ts"      # imports app
Task: "Verify app starts"           # needs everything
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install deps, create tsconfig, update scripts)
2. Complete Phase 2: Foundational (convert Prisma client)
3. Complete Phase 3: User Story 1 (convert all files, verify behavior)
4. **STOP and VALIDATE**: Run `npm run dev`, test all endpoints
5. The backend is now fully TypeScript with working endpoints

### Incremental Delivery

1. Setup + Foundational → Tooling ready
2. US1 → All files converted, app runs identically → **MVP deployed**
3. US2 → Type checker passes, no `any` usage → Quality validated
4. US3 → Readability confirmed → Feature complete
5. Polish → Final cleanup → Ready for merge

### Single Developer Strategy (Recommended)

Since this is a refactoring (not new features), sequential execution is natural:

1. Setup (T001-T005) — ~10 min
2. Prisma client (T006) — ~15 min
3. Controllers + Routers in parallel (T007-T016) — bulk of work, ~1-2 hrs
4. App + Index + Verify (T017-T020) — ~20 min
5. Type audit (T021-T023) — ~30 min
6. Readability check + Polish (T024-T026) — ~15 min

---

## Notes

- **Import extensions**: ALL import paths MUST keep `.js` extensions (e.g., `import prisma from '../../prisma/cliente.js'`). This is required by `module: "NodeNext"` and is already the convention in the current codebase.
- **No behavior changes**: If a type annotation would require changing runtime behavior, the type must be adjusted to match the existing behavior — never the other way around.
- **No `any`**: SC-005 prohibits `any` in business logic. Use `Record<string, unknown>`, Prisma generated types, or explicit interfaces.
- **Class pattern preserved**: All controllers remain class-based, exported as `export default new ClassName()`.
- **Prisma types**: Model types come from `@prisma/client` via `prisma generate`. Never define manual entity interfaces that duplicate the schema.
- Commit after each phase completion for clean rollback points.
