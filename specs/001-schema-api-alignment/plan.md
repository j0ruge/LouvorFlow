# Implementation Plan: Schema & API Alignment with ER Model

**Branch**: `001-schema-api-alignment` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-schema-api-alignment/spec.md`

## Summary

Align the entire project (Prisma schema, backend API, frontend mock data) with the authoritative ER model. This involves: adding 2 missing Prisma models (Tags, Musicas_Tags) + 1 new column (telefone) + unique constraints on lookup tables; refactoring the backend entry point and app structure (fix imports, middleware, CORS, /api prefix, error format, senha exclusion); creating CRUD controllers and routes for all 8 base entities and 6 junction tables; and correcting frontend mock data shapes + branding.

## Technical Context

**Language/Version**: JavaScript (ES Modules via Sucrase), Node.js LTS
**Primary Dependencies**: Express 5.1, Prisma 6.19, bcryptjs 3.x, cors, dotenv
**Storage**: PostgreSQL 17+, containerized via Docker Compose (port 35432)
**Testing**: Manual HTTP testing (no test framework configured yet — out of scope per YAGNI)
**Target Platform**: Web (current); React Native with Expo Router (future)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Small-scale church ministry (~30 members, ~100 songs) — no specific targets
**Constraints**: Mobile-first responsive, portable to React Native, Portuguese entity naming
**Scale/Scope**: ~30 integrantes, ~100 musicas, ~50 eventos/year

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Mobile-First | Frontend changes must be responsive and RN-portable | PASS — mock data changes only; no new UI components |
| II. Relational Data Integrity | UUID v4 PKs, CASCADE deletes, explicit junction tables, Prisma migrations only | PASS — Tags/Musicas_Tags use UUID, all FKs CASCADE, managed via `prisma migrate dev` |
| III. RESTful API | `/api/<resource>` pattern, consistent JSON, proper status codes | PASS — adding `/api/` prefix, standardizing error format `{ errors: [] }` |
| IV. Version-Centric | Music vs Version distinction preserved | PASS — `musicas` (composition + tonalidade) and `artistas_musicas` (arrangement metadata) remain distinct |
| V. Simplicity (YAGNI) | Simplest solution, no premature abstractions | PASS — follows existing class-based controller pattern, no new layers |
| Technical Constraints | Node.js/Express 5, Prisma/PostgreSQL, ES Modules, Portuguese naming, UUID v4 | PASS — all aligned |
| Development Workflow | Prisma migrations, atomic commits, feature branch naming | PASS — `001-schema-api-alignment` branch, incremental migration |

**Gate result: ALL PASS** — no violations, no complexity justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-schema-api-alignment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── base-entities.md
│   └── junction-endpoints.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── backend/
│   ├── index.js                          # REFACTOR: fix imports, remove duplicate middleware
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma                 # MODIFY: add Tags, Musicas_Tags, telefone, unique constraints
│   │   ├── cliente.js
│   │   └── migrations/
│   │       ├── 20251108022432_init/      # Existing
│   │       └── <new>_add_tags_telefone/  # NEW: migration for Tags, Musicas_Tags, telefone, uniques
│   └── src/
│       ├── app.js                        # REFACTOR: fix imports, add /api prefix, register all routes
│       ├── controllers/
│       │   ├── homeController.js         # KEEP (refactor imports only)
│       │   ├── artistasController.js     # REFACTOR: fix error format
│       │   ├── integrantesController.js  # REFACTOR: exclude senha, fix error format, add telefone
│       │   ├── musicasController.js      # NEW
│       │   ├── tonalidadesController.js  # NEW
│       │   ├── funcoesController.js      # NEW
│       │   ├── tagsController.js         # NEW
│       │   ├── tiposEventosController.js # NEW
│       │   └── eventosController.js      # NEW
│       └── routes/
│           ├── homeRoutes.js             # KEEP
│           ├── artistasRoutes.js         # KEEP
│           ├── integrantesRoutes.js      # MODIFY: add /funcoes sub-routes
│           ├── musicasRoutes.js          # NEW: includes /tags, /funcoes, /versoes sub-routes
│           ├── tonalidadesRoutes.js      # NEW
│           ├── funcoesRoutes.js          # NEW
│           ├── tagsRoutes.js             # NEW
│           ├── tiposEventosRoutes.js     # NEW
│           └── eventosRoutes.js          # NEW: includes /musicas, /integrantes sub-routes
└── frontend/
    └── src/
        ├── components/
        │   └── AppSidebar.tsx            # MODIFY: rename "EscalaCanto" → "LouvorFlow"
        └── pages/
            ├── Dashboard.tsx             # MODIFY: align mock data shapes
            ├── Songs.tsx                 # MODIFY: align mock data to musica + versao shape
            ├── Members.tsx               # MODIFY: replace phone/instruments with telefone/funcoes
            └── Scales.tsx                # MODIFY: align mock data to evento shape
```

**Structure Decision**: Existing web application layout (src/backend + src/frontend) is preserved. New controllers and routes follow the established pattern. Junction table operations are nested as sub-routes under parent entity routers (no separate junction route files needed).

## Complexity Tracking

No constitution violations — table not applicable.
