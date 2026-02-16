# Implementation Plan: Backend Layered Architecture Refactor

**Branch**: `003-backend-layered-refactor` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-backend-layered-refactor/spec.md`

## Summary

Refactor the LouvorFlow backend from a "fat controller" MVC pattern to a 4-layer architecture (Route -> Controller -> Service -> Repository). The goal is to separate concerns so that business logic can be unit tested independently, while preserving 100% API contract compatibility — identical endpoints, status codes, response shapes, and error messages. The refactoring covers 9 modules in order of complexity: setup (AppError + types), 4 simple CRUDs, 1 medium, 3 complex, and 1 trivial (Home).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode, ES2022 target, NodeNext modules)
**Primary Dependencies**: Express 5.1, Prisma 6.19, bcryptjs 3.0, cors 2.8
**Storage**: PostgreSQL via Prisma ORM (schema unchanged)
**Testing**: No test framework configured (testability is a goal, not a deliverable)
**Target Platform**: Node.js >= 18.0.0 server
**Project Type**: Web application (backend API)
**Performance Goals**: N/A — preserve existing performance characteristics
**Constraints**: Zero breaking changes to the public API contract; all imports use `.js` extensions (NodeNext); tsx for dev server
**Scale/Scope**: 9 modules, ~18 new files to create, ~17 existing files to modify/rename, ~8 old files to delete

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First & Cross-Platform Ready | N/A | Backend only, no UI changes |
| II. Relational Data Integrity | PASS | No schema changes; junction tables preserved |
| III. RESTful API as Single Source of Truth | PASS | All endpoints, paths, and response formats preserved exactly |
| IV. Version-Centric Repertoire Model | PASS | Music/Version distinction preserved; no domain model changes |
| V. Simplicity & Pragmatism (YAGNI) | **VIOLATION — JUSTIFIED** | Introducing Repository + Service layers. See Complexity Tracking below. |

**Gate result**: PASS (violation justified)

### Post-Phase 1 Re-check

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Mobile-First | N/A | Still backend only |
| II. Relational Data Integrity | PASS | Prisma queries moved to Repository unchanged |
| III. RESTful API | PASS | API contract document confirms zero changes |
| IV. Version-Centric Repertoire | PASS | formatMusica preserves versao structure |
| V. YAGNI | **JUSTIFIED** | Complexity Tracking rationale stands; no additional layers introduced |

**Post-design gate result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/003-backend-layered-refactor/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: architectural decisions
├── data-model.md        # Phase 1: layer responsibilities per module
├── quickstart.md        # Phase 1: dev setup and validation steps
├── contracts/
│   └── api-contract.md  # Phase 1: full API contract to preserve
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/backend/
├── prisma/
│   ├── cliente.ts                  # PrismaClient with senha extension (UNCHANGED)
│   └── schema.prisma               # Database schema (UNCHANGED)
├── src/
│   ├── app.ts                      # Express App (import paths updated)
│   ├── errors/
│   │   └── AppError.ts             # NEW: Custom error class
│   ├── types/
│   │   └── index.ts                # NEW: Shared interfaces/DTOs
│   ├── repositories/               # NEW: Data access layer (8 files)
│   │   ├── artistas.repository.ts
│   │   ├── eventos.repository.ts
│   │   ├── funcoes.repository.ts
│   │   ├── integrantes.repository.ts
│   │   ├── musicas.repository.ts
│   │   ├── tags.repository.ts
│   │   ├── tipos-eventos.repository.ts
│   │   └── tonalidades.repository.ts
│   ├── services/                   # NEW: Business logic layer (8 files)
│   │   ├── artistas.service.ts
│   │   ├── eventos.service.ts
│   │   ├── funcoes.service.ts
│   │   ├── integrantes.service.ts
│   │   ├── musicas.service.ts
│   │   ├── tags.service.ts
│   │   ├── tipos-eventos.service.ts
│   │   └── tonalidades.service.ts
│   ├── controllers/                # REFACTORED: HTTP adapter only (9 files)
│   │   ├── artistas.controller.ts
│   │   ├── eventos.controller.ts
│   │   ├── funcoes.controller.ts
│   │   ├── home.controller.ts
│   │   ├── integrantes.controller.ts
│   │   ├── musicas.controller.ts
│   │   ├── tags.controller.ts
│   │   ├── tipos-eventos.controller.ts
│   │   └── tonalidades.controller.ts
│   └── routes/                     # RENAMED from router/ (9 files)
│       ├── artistas.routes.ts
│       ├── eventos.routes.ts
│       ├── funcoes.routes.ts
│       ├── home.routes.ts
│       ├── integrantes.routes.ts
│       ├── musicas.routes.ts
│       ├── tags.routes.ts
│       ├── tipos-eventos.routes.ts
│       └── tonalidades.routes.ts
└── index.ts                        # Entry point (UNCHANGED)
```

**Structure Decision**: Web application backend. The existing `src/backend/src/` directory structure is extended with `errors/`, `types/`, `repositories/`, and `services/` subdirectories. The `router/` directory is renamed to `routes/`. All existing files in `controllers/` are rewritten in-place with new naming convention.

## Migration Order

| Phase | Module(s) | Files Created | Files Modified | Complexity |
| ----- | --------- | ------------- | -------------- | ---------- |
| 0     | AppError + types | 2 new | 0 | Setup |
| 1     | Tags | 2 new (repo + service) | 2 renamed (controller + route) | Low |
| 2     | Tonalidades | 2 new | 2 renamed | Low |
| 3     | Funcoes | 2 new | 2 renamed | Low |
| 4     | Tipos Eventos | 2 new | 2 renamed | Low |
| 5     | Artistas | 2 new | 2 renamed | Medium |
| 6     | Integrantes | 2 new | 2 renamed | High |
| 7     | Musicas | 2 new | 2 renamed | Very High |
| 8     | Eventos | 2 new | 2 renamed | Very High |
| 9     | Home | 0 new | 2 renamed (controller + route) | Trivial |
| 10    | app.ts + cleanup | 0 new | 1 modified (app.ts) + delete old router/ | Cleanup |

**Total**: ~18 new files, ~17 files modified/renamed, ~8 old files deleted

## Layer Contract

```
Route  →  Controller  →  Service  →  Repository  →  Prisma
  ✅ HTTP     ✅ HTTP      ❌ HTTP     ❌ HTTP
  ❌ Prisma   ❌ Prisma    ❌ Prisma   ✅ Prisma
```

Each layer has strict import boundaries:
- **Route** imports: Controller only
- **Controller** imports: Service + AppError only (+ Express types)
- **Service** imports: Repository + AppError only
- **Repository** imports: Prisma client only

## Per-Module Refactoring Pattern

For each module, the steps are:

1. **Create `<module>.repository.ts`**: Extract all Prisma queries from the fat controller into repository methods. Include junction table operations where applicable.
2. **Create `<module>.service.ts`**: Extract all business validation logic (required field checks, uniqueness checks, existence checks) from the fat controller. Call repository methods. Throw AppError on failure. Include formatting functions where applicable.
3. **Rewrite `<module>.controller.ts`**: Slim down to HTTP parsing + service calls + try/catch with AppError handling. Remove all Prisma imports and business logic.
4. **Rename route file to `<module>.routes.ts`**: Update import to new controller path.
5. **Verify**: `npm run typecheck` passes; manual API testing confirms identical responses.

## Complexity Tracking

> Constitution Principle V violation justification

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Repository layer (4th layer beyond Route/Controller/Service) | Unit testing business logic requires mocking data access. Without a Repository interface, Service classes would call Prisma directly, making them impossible to test without a live database. | Direct Prisma calls in Service: Rejected because it couples business logic to ORM, preventing unit tests. The concrete present-day need is testability, not speculative future flexibility. |
| Service layer (new architectural layer) | Controllers currently mix HTTP handling with validation, duplicate checks, and business rules. Extracting to a Service makes each concern independently testable and aligns with SRP. | Fat controllers (status quo): Rejected because they are the root problem. 8 controllers each doing 4 jobs means 32 interlocked concerns. Splitting into 2 focused layers (Service + Repository) is the minimum viable separation. |
