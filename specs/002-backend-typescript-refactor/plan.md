# Implementation Plan: Backend TypeScript Refactor

**Branch**: `002-backend-typescript-refactor` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-backend-typescript-refactor/spec.md`

## Summary

Convert all 20 backend JavaScript source files to TypeScript while preserving 100% API behavior. Replace Sucrase + nodemon with tsx for development and tsc for production builds. Add proper type annotations to all controllers, routers, and the Prisma client extension. No schema, frontend, or behavioral changes.

## Technical Context

**Language/Version**: TypeScript 5.7+ on Node.js 24 (LTS)
**Primary Dependencies**: Express 5.1, Prisma 6.19, bcryptjs, cors, dotenv
**New Dev Dependencies**: typescript, tsx, @types/express (v5), @types/cors, @types/node
**Removed Dependencies**: sucrase (runtime), nodemon (dev)
**Storage**: PostgreSQL 17 via Prisma (unchanged)
**Testing**: Manual HTTP request comparison (before/after) — no test framework currently in project
**Target Platform**: Node.js server (Linux/Windows)
**Project Type**: Web application (backend only — frontend unaffected)
**Performance Goals**: Identical to current — no performance changes expected
**Constraints**: Zero API behavior changes; all 59 endpoints must return identical responses
**Scale/Scope**: 20 files, ~1,500 lines of application code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First & Cross-Platform Ready | N/A | Backend-only change, no UI impact |
| II. Relational Data Integrity | PASS | Prisma schema unchanged, no migration needed |
| III. RESTful API as Single Source of Truth | PASS | All 59 endpoints preserved with identical contracts |
| IV. Version-Centric Repertoire Model | PASS | Music/Version entity separation maintained |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Minimal tooling change (tsx replaces sucrase+nodemon); no new abstractions; TypeScript adoption explicitly permitted by constitution |

**Technical Constraints Check:**
- Runtime: Node.js (LTS) — PASS (Node 24)
- ORM: Prisma with PostgreSQL — PASS (unchanged)
- Language: "TypeScript adoption is permitted when the team is ready" — PASS (this feature is the adoption)
- Entity naming: Portuguese names preserved — PASS
- IDs: UUID v4 for all primary keys — PASS (unchanged)

**Gate result: PASS — no violations.**

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-typescript-refactor/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Entity type definitions
├── quickstart.md        # Phase 1: Migration quick-reference
├── contracts/           # Phase 1: API contracts (unchanged — documented for reference)
│   └── api-contracts.md # All 59 endpoints with types
└── tasks.md             # Phase 2: (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/backend/
├── index.ts                          # Entry point (was .js)
├── tsconfig.json                     # NEW — TypeScript configuration
├── package.json                      # Updated scripts & dependencies
├── prisma/
│   ├── schema.prisma                 # UNCHANGED
│   └── cliente.ts                    # Prisma client with $extends (was .js)
└── src/
    ├── app.ts                        # Express app setup (was .js)
    ├── controllers/
    │   ├── homeController.ts         # (was .js)
    │   ├── artistasController.ts     # (was .js)
    │   ├── integrantesController.ts  # (was .js)
    │   ├── musicasController.ts      # (was .js)
    │   ├── tonalidadesController.ts  # (was .js)
    │   ├── funcoesController.ts      # (was .js)
    │   ├── tagsController.ts         # (was .js)
    │   ├── tiposEventosController.ts # (was .js)
    │   └── eventosController.ts      # (was .js)
    └── router/
        ├── homeRoutes.ts             # (was .js)
        ├── artistasRoutes.ts         # (was .js)
        ├── integrantesRoutes.ts      # (was .js)
        ├── musicasRoutes.ts          # (was .js)
        ├── tonalidadesRoutes.ts      # (was .js)
        ├── funcoesRoutes.ts          # (was .js)
        ├── tagsRoutes.ts             # (was .js)
        ├── tiposEventosRoutes.ts     # (was .js)
        └── eventosRoutes.ts          # (was .js)
```

**Files removed:**
- `nodemon.json` — replaced by `tsx watch`

**Structure Decision**: Same directory layout preserved. Only file extensions change (`.js` → `.ts`), plus `tsconfig.json` added and `nodemon.json` removed. No new directories, no new abstraction layers.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.
