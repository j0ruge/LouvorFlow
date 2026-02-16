# Feature Specification: Backend Layered Architecture Refactor

**Feature Branch**: `003-backend-layered-refactor`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Refatoracao de arquitetura backend de Fat Controller MVC para Layered Architecture com Routes, Controllers, Services e Repositories"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simple CRUD modules preserve identical behavior after refactoring (Priority: P1)

A developer refactors the simple CRUD modules (Tags, Tonalidades, Funcoes, Tipos Eventos) from fat controllers into a layered architecture (Route -> Controller -> Service -> Repository). After refactoring, every API endpoint for these modules returns the exact same HTTP status codes, JSON response bodies, and error messages as before. No consumer of the API notices any change.

**Why this priority**: These four modules are the simplest (no relations, no junctions) and serve as the foundation/template for all subsequent refactoring. Getting the pattern right here validates the approach before tackling complex modules.

**Independent Test**: Can be fully tested by sending the same HTTP requests to each endpoint (GET, GET/:id, POST, PUT/:id, DELETE/:id) and comparing status codes + JSON bodies before and after the refactor.

**Acceptance Scenarios**:

1. **Given** a refactored Tags module with Route/Controller/Service/Repository layers, **When** a client sends GET /api/tags, **Then** the response is 200 with an array of `{ id, nome }` objects identical to the original.
2. **Given** a refactored Tags module, **When** a client sends POST /api/tags with an empty or missing nome, **Then** the response is 400 with `{ errors: ["Nome da tag e obrigatorio"] }` identical to the original.
3. **Given** a refactored Tags module, **When** a client sends POST /api/tags with a duplicate name, **Then** the response is 409 with the same conflict error message as the original.
4. **Given** a refactored Tonalidades module, **When** a client performs the full CRUD cycle (create, read, update, delete), **Then** all responses match the original format using `{ id, tom }`.
5. **Given** a refactored Funcoes module, **When** a client performs the full CRUD cycle, **Then** all responses match the original format using `{ id, nome }`.
6. **Given** a refactored Tipos Eventos module, **When** a client performs the full CRUD cycle, **Then** all responses match the original format using `{ id, nome }`.

---

### User Story 2 - Medium complexity module (Artistas) preserves behavior with nested relations (Priority: P2)

A developer refactors the Artistas module. The show endpoint returns artist data with nested music versions (including artista, bpm, cifras, lyrics, link_versao). After refactoring, the nested relation data is formatted identically to the original.

**Why this priority**: Artistas introduces nested `include` queries with relations, which adds a layer of complexity beyond simple CRUD. It validates that the Repository layer handles relational includes correctly and the Service layer passes data through without altering the shape.

**Independent Test**: Can be tested by creating an artist, associating music versions via the Musicas endpoints, then verifying GET /api/artistas/:id returns the same nested structure as the original.

**Acceptance Scenarios**:

1. **Given** a refactored Artistas module, **When** a client sends GET /api/artistas, **Then** the response is 200 with an array of `{ id, nome }` objects.
2. **Given** a refactored Artistas module with an artist that has music versions, **When** a client sends GET /api/artistas/:id, **Then** the response includes nested versoes with `{ id, musica, bpm, cifras, lyrics, link_versao }` formatted identically.
3. **Given** a refactored Artistas module, **When** a client sends POST /api/artistas with a duplicate name, **Then** the response is 409 with the same error message.

---

### User Story 3 - Complex modules (Integrantes, Musicas, Eventos) preserve behavior with junction tables and special logic (Priority: P3)

A developer refactors the three most complex modules. Integrantes includes password hashing (bcrypt) and function assignment via junction tables. Musicas includes pagination, three junction tables (artistas_musicas, musicas_tags, musicas_funcoes), versao CRUD, and a data formatting function. Eventos includes two junction tables (eventos_musicas, eventos_integrantes), date validation (ISO 8601), and two formatting functions. After refactoring, all endpoints preserve identical behavior.

**Why this priority**: These are the most complex modules with the highest risk of regression. They involve junction table operations, data transformation helpers, password hashing, pagination, and date parsing. They should only be tackled after the simpler patterns are validated.

**Independent Test**: Can be tested by exercising every endpoint (CRUD + junction operations) for each module and comparing full response payloads against the original behavior.

**Acceptance Scenarios**:

1. **Given** a refactored Integrantes module, **When** a client creates a new integrante with senha, **Then** the password is hashed with bcrypt and the response excludes the senha field.
2. **Given** a refactored Integrantes module, **When** a client adds/removes a funcao to an integrante, **Then** the junction table is updated and the response matches the original format.
3. **Given** a refactored Musicas module, **When** a client sends GET /api/musicas?page=2&limit=10, **Then** the paginated response includes `{ items, meta: { total, page, per_page, total_pages } }` formatted identically.
4. **Given** a refactored Musicas module, **When** a client adds a versao/tag/funcao to a musica, **Then** duplicate checks return 409 and successful additions return the same response structure.
5. **Given** a refactored Eventos module, **When** a client creates an event with an invalid date format, **Then** the response is 400 with the ISO 8601 validation error message.
6. **Given** a refactored Eventos module, **When** a client sends GET /api/eventos/:id, **Then** the response includes nested musicas (with tonalidade) and integrantes (with funcoes) formatted identically to the original.

---

### User Story 4 - Codebase supports independent unit testing of business logic (Priority: P4)

After the refactoring is complete, a developer can write unit tests for any Service layer class by mocking the corresponding Repository. Business logic (validation, duplicate checks, error throwing) is testable in isolation without needing an HTTP server or database connection.

**Why this priority**: Testability is the primary motivation for this refactoring. While it has no direct user-facing impact, it enables the team to catch regressions earlier and develop with higher confidence.

**Independent Test**: Can be verified by writing a unit test for any Service class (e.g., TagsService.create) that mocks the repository and asserts error conditions without starting Express or connecting to the database.

**Acceptance Scenarios**:

1. **Given** the refactored TagsService, **When** a test calls `create(undefined)` with a mocked repository, **Then** it throws an AppError with the required-name message without any database call.
2. **Given** the refactored MusicasService, **When** a test mocks the repository pagination queries, **Then** the service returns the correct paginated response structure.
3. **Given** any refactored Service, **When** the corresponding Repository is mocked, **Then** all business validation logic can be tested in isolation.

---

### Edge Cases

- What happens when a route path hasn't been updated in app.ts after the refactor? All route registrations in app.ts must point to the new route files with the same base paths.
- What happens when a junction table delete is attempted for a record that doesn't exist? The same 404 error must be returned as the original.
- What happens when the Prisma client extension (password stripping) interacts with the new Repository layer? The extension operates at query level and must remain transparent to the Repository.
- What happens when pagination parameters are invalid (page=0, limit=-1, page=abc)? The Musicas controller must apply the same defaults and clamping as the original (page default 1 min 1, limit default 20 min 1 max 100).
- What happens when an Eventos update sends no fields? The same 400 error "Ao menos um campo deve ser enviado para atualizacao" must be returned.
- What happens when bcrypt salt generation changes between requests? The hashing behavior must remain identical (random salt between 10-16 rounds).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST introduce a shared AppError class that carries a message and HTTP status code, used by all Service layer classes to signal business errors.
- **FR-002**: System MUST introduce a shared types file containing interfaces (IdNome, IdTom, and other DTOs) currently duplicated across controllers.
- **FR-003**: System MUST create a Repository layer for each module that encapsulates all Prisma queries, including junction table operations.
- **FR-004**: System MUST create a Service layer for each module that contains all business validation logic (required fields, uniqueness checks, existence checks) and throws AppError on failure.
- **FR-005**: System MUST refactor each Controller to only handle HTTP request parsing (req.params, req.body, req.query) and HTTP response formatting (res.status().json()), delegating all logic to the Service layer.
- **FR-006**: System MUST preserve the existing route paths exactly as registered in app.ts (/api/artistas, /api/integrantes, /api/musicas, /api/tonalidades, /api/funcoes, /api/tags, /api/tipos-eventos, /api/eventos, /).
- **FR-007**: System MUST preserve all existing HTTP status codes (200, 201, 400, 404, 409, 500) for every endpoint.
- **FR-008**: System MUST preserve all existing success messages (msg field) and error messages (errors array) as identical strings.
- **FR-009**: System MUST preserve all existing JSON response shapes (field names, nesting, select clauses).
- **FR-010**: System MUST preserve the bcrypt password hashing logic for Integrantes in the Service layer.
- **FR-011**: System MUST preserve the Prisma client extension (password stripping) without modification.
- **FR-012**: System MUST preserve the pagination behavior for Musicas (page, limit query params with defaults and clamping).
- **FR-013**: System MUST preserve the data formatting functions (formatMusica, formatEventoIndex, formatEventoShow) and their output shapes.
- **FR-014**: System MUST preserve ISO 8601 date validation for Eventos.
- **FR-015**: System MUST rename the router/ directory to routes/ with updated file naming convention (e.g., tags.routes.ts).
- **FR-016**: System MUST rename controller files to follow the new naming convention (e.g., tags.controller.ts).
- **FR-017**: System MUST pass TypeScript type checking (tsc --noEmit) without errors after refactoring.
- **FR-018**: The Home module MAY remain as a simple controller without a Service or Repository layer due to its trivial nature.

### Key Entities

- **AppError**: Custom error class with message and statusCode, used to propagate business errors from Service to Controller.
- **Repository**: Data access layer class per module. Encapsulates all Prisma queries. Only layer that imports and uses the Prisma client.
- **Service**: Business logic layer class per module. Validates inputs, checks business rules (uniqueness, existence), orchestrates Repository calls, throws AppError on failure. Has no knowledge of HTTP or Prisma.
- **Controller**: HTTP adapter layer class per module. Parses request data, calls Service methods, catches AppError to return appropriate HTTP responses. Has no knowledge of Prisma.
- **Route**: Endpoint definition layer per module. Maps HTTP verbs + paths to Controller methods. Has no business logic.

### Modules and their Complexity

| Module        | Complexity | Key Characteristics                                                   |
| ------------- | ---------- | --------------------------------------------------------------------- |
| Tags          | Low        | Simple CRUD with nome field                                           |
| Tonalidades   | Low        | Simple CRUD with tom field                                            |
| Funcoes       | Low        | Simple CRUD with nome field                                           |
| Tipos Eventos | Low        | Simple CRUD with nome field                                           |
| Artistas      | Medium     | CRUD + show with nested musicas/versoes include                       |
| Integrantes   | High       | CRUD + bcrypt + junction integrantes_funcoes + public select constant |
| Musicas       | Very High  | CRUD + pagination + 3 junctions + formatMusica + versao CRUD          |
| Eventos       | Very High  | CRUD + 2 junctions + 2 formatters + ISO 8601 date validation          |
| Home          | Trivial    | Single endpoint, no service/repository needed                         |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every existing API endpoint returns the same HTTP status code and JSON body as before the refactor, verified by request/response comparison.
- **SC-002**: All success messages (msg field) and error messages (errors array) are character-for-character identical to the original.
- **SC-003**: The project passes TypeScript type checking with zero errors.
- **SC-004**: Each Service class can be unit tested by mocking its corresponding Repository, with no dependency on HTTP or database. (Writing actual test files is out of scope for this refactoring; only the testable architecture is required.)
- **SC-005**: No controller imports or references the Prisma client directly.
- **SC-006**: No service imports or references HTTP request/response types directly.
- **SC-007**: The refactoring covers all 9 modules (Tags, Tonalidades, Funcoes, Tipos Eventos, Artistas, Integrantes, Musicas, Eventos, Home).
- **SC-008**: The old router/ directory is replaced by the new routes/ directory with no orphaned files.

## Assumptions

- The Prisma schema (schema.prisma) and Prisma client setup (cliente.ts with password stripping extension) remain unchanged.
- The app.ts middleware stack (CORS, URL-encoded parser, JSON parser, error handler) remains unchanged.
- The index.ts entry point remains unchanged.
- The refactoring is a pure internal restructuring with zero changes to the public API contract.
- The Tipos Eventos module (tiposEventosController.ts) follows the same refactoring pattern as other simple CRUD modules, even though it was not explicitly mentioned in the original plan.
- Data formatting functions (formatMusica, formatEventoIndex, formatEventoShow) will be placed in each module's Service file (e.g., formatMusica in musicas.service.ts), keeping data transformation close to the business logic that produces it.
- The recommended migration order is: AppError + types (setup) -> Tags -> Tonalidades -> Funcoes -> Tipos Eventos -> Artistas -> Integrantes -> Musicas -> Eventos -> Home.

## Clarifications

### Session 2026-02-15

- Q: Where should formatting functions (formatMusica, formatEventoIndex, formatEventoShow) be placed? → A: In each module's Service file (e.g., formatMusica in musicas.service.ts), keeping transformation logic close to the business layer.
- Q: Should writing unit test files be a deliverable of this refactoring, or only ensuring testable architecture? → A: Testability only. No test files delivered; the architecture must support unit testing but actual tests are a follow-up.
