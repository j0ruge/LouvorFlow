# Research: Backend Layered Architecture Refactor

**Branch**: `003-backend-layered-refactor` | **Date**: 2026-02-15

## R-001: Layered Architecture Pattern for Express + Prisma

**Decision**: Adopt 4-layer architecture: Route -> Controller -> Service -> Repository

**Rationale**: The existing fat controllers combine HTTP parsing, validation, business logic, and data access in single files. This makes unit testing impossible without spinning up Express and a real database. The layered approach separates concerns along clear boundaries:
- Routes: endpoint definitions only
- Controllers: HTTP request/response adapter
- Services: business validation and orchestration
- Repositories: Prisma query encapsulation

**Alternatives considered**:
- Keep fat controllers (status quo): Rejected because unit testing business logic is impossible.
- 3-layer (no Repository, Service calls Prisma directly): Rejected because it still couples business logic to the ORM, making it harder to mock in tests.
- Hexagonal / Ports & Adapters: Rejected as overengineered for this project's scale. The 4-layer model achieves testability without excessive abstraction.

## R-002: Module Instantiation Pattern

**Decision**: Use class instances exported as singletons (`export default new XxxRepository()`)

**Rationale**: Matches the existing controller pattern in the codebase (`export default new TagsController()`). Singleton instances are simple and sufficient for a stateless API. Dependency injection frameworks (tsyringe, inversify) would add complexity without proportional benefit for this project.

**Alternatives considered**:
- Dependency injection container: Rejected as overengineered (YAGNI / Constitution Principle V).
- Static class methods: Would work but doesn't match existing code conventions.
- Function-based modules: Would require rewriting the existing class-based patterns.

## R-003: Error Propagation Strategy

**Decision**: Custom AppError class thrown by Services, caught by Controllers via try/catch

**Rationale**: AppError carries both a message and HTTP status code, allowing Services to signal the appropriate error response without importing Express types. Controllers catch AppError and translate to HTTP responses, with a fallback to 500 for unexpected errors.

**Alternatives considered**:
- Centralized error-handling Express middleware: Would reduce controller boilerplate but changes app.ts behavior (spec explicitly preserves app.ts middleware unchanged). Also makes per-endpoint error messages harder to customize.
- Result/Either pattern: Functional but alien to the existing codebase style. Would require learning curve for contributors.

## R-004: File Naming Convention

**Decision**: Use dot-separated names: `tags.repository.ts`, `tags.service.ts`, `tags.controller.ts`, `tags.routes.ts`

**Rationale**: Aligns with the user's target architecture plan. The dot separator clearly identifies the layer role of each file. This replaces the current PascalCase convention (`tagsController.ts`, `tagsRoutes.ts`).

**Alternatives considered**:
- Keep PascalCase (tagsRepository.ts): Would work but misses the opportunity to standardize naming across layers.
- Kebab-case (tags-repository.ts): Valid but the dot convention is more explicit about architecture role.

## R-005: Formatting Function Placement

**Decision**: Place formatting functions (formatMusica, formatEventoIndex, formatEventoShow) inside each module's Service file.

**Rationale**: Clarified during spec session. Keeps data transformation close to the business logic that produces it, avoids creating shared dependencies, and follows the principle that each layer owns its own transformation logic.

**Alternatives considered**:
- Shared utils/formatters.ts: Would centralize but creates cross-module coupling.
- Keep in controllers: Would pollute the HTTP adapter layer with data transformation logic.

## R-006: TypeScript Module System

**Decision**: Continue using NodeNext module resolution with `.js` extensions in imports.

**Rationale**: The project already uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in tsconfig.json. All existing imports use `.js` extensions (e.g., `import prisma from '../../prisma/cliente.js'`). New files must follow the same convention.

**Alternatives considered**: None — this is an existing constraint, not a design choice.
