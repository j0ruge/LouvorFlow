# Feature Specification: Backend TypeScript Refactor

**Feature Branch**: `002-backend-typescript-refactor`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Refatorar backend de JavaScript para TypeScript mantendo todas as features atuais"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - API Behavior Preserved After Refactoring (Priority: P1)

All 59 existing API endpoints continue to work identically after the backend is refactored from JavaScript to TypeScript. Every request/response contract — including status codes, response shapes, error formats, pagination, and relationship includes — remains unchanged. End users and frontend consumers experience zero disruption.

**Why this priority**: If the refactoring breaks any existing endpoint, it provides negative value. Behavioral preservation is the non-negotiable foundation that makes the refactoring safe.

**Independent Test**: Send the same HTTP requests to every endpoint before and after the refactoring and compare responses. Identical results confirm success.

**Acceptance Scenarios**:

1. **Given** the refactored backend is running, **When** a client sends `GET /api/artistas`, **Then** the response body, status code, and headers are identical to the JavaScript version.
2. **Given** the refactored backend is running, **When** a client sends `POST /api/musicas` with a valid payload, **Then** the song is created and the response matches the previous behavior exactly.
3. **Given** the refactored backend is running, **When** a client sends `GET /api/integrantes/:id`, **Then** the response includes the integrante data with `senha` excluded, exactly as before.
4. **Given** the refactored backend is running, **When** a client sends `DELETE /api/musicas/:musicaId/tags/:tagId`, **Then** the junction record is removed and the response matches the previous behavior.
5. **Given** the refactored backend is running, **When** a client sends an invalid request (e.g., non-existent ID), **Then** the error response uses the `{ errors: ["message"] }` format with the correct HTTP status code.

---

### User Story 2 - Type-Safe Development Experience (Priority: P2)

Developers working on the backend codebase benefit from type checking that catches errors at development time rather than at runtime. Controller methods, route handlers, Prisma queries, and Express middleware all have proper type annotations that provide IDE autocompletion and compile-time error detection.

**Why this priority**: Type safety is the primary motivator for the refactoring. It directly improves developer productivity and reduces bugs, but it depends on Story 1 (behavior must be preserved first).

**Independent Test**: Introduce a deliberate type error (e.g., pass a number where a string is expected) and confirm the build process catches it before runtime.

**Acceptance Scenarios**:

1. **Given** a developer opens any controller file, **When** they inspect a method signature, **Then** the request and response types are explicitly annotated.
2. **Given** a developer writes a Prisma query with a misspelled field name, **When** they run the type checker, **Then** a compile-time error is reported before the code can run.
3. **Given** a developer adds a new route handler, **When** they omit a required parameter type, **Then** the type checker flags the omission.

---

### User Story 3 - Codebase Readability for New Contributors (Priority: P3)

New contributors joining the project can understand the backend codebase faster through explicit type definitions on entities, request/response shapes, and function signatures. Type annotations serve as living documentation that stays in sync with the actual code behavior.

**Why this priority**: While valuable, improved onboarding is a secondary benefit that naturally follows from Stories 1 and 2.

**Independent Test**: A new contributor can navigate from a route definition to its controller, understand the expected request body shape, and trace data flow to the database — all through type annotations without needing external documentation.

**Acceptance Scenarios**:

1. **Given** a new contributor opens a router file, **When** they follow a route handler to its controller, **Then** the controller method has typed parameters that document the expected request shape.
2. **Given** a new contributor wants to understand the data model, **When** they inspect the Prisma client types, **Then** they see all entity shapes and relationships without needing to read the schema file.

---

### Edge Cases

- What happens if a controller method receives a request body with extra unexpected fields? The behavior must remain identical to the JavaScript version (Prisma ignores unknown fields in `data`).
- What happens if the Prisma client extension for password exclusion interacts differently with TypeScript's type system? The `senha` field must still be excluded at runtime regardless of what types suggest.
- What happens if Express middleware types don't match the current middleware signatures? Type annotations must be adjusted to match actual runtime behavior, not the other way around.
- What happens if a junction endpoint receives path parameters in unexpected formats? Error handling must remain identical to the JavaScript version.

## Requirements *(mandatory)*

### Functional Requirements

**File Conversion**

- **FR-001**: All 20 backend source files MUST be converted from `.js` to `.ts` extensions: 1 entry point (`index`), 1 app setup (`app`), 1 Prisma client (`cliente`), 9 controllers, and 8 routers.
- **FR-002**: All converted files MUST compile without type errors using the project's configured type checker.

**API Contract Preservation**

- **FR-003**: All 59 API endpoints MUST maintain identical request/response contracts (same URL paths, HTTP methods, status codes, and response body shapes).
- **FR-004**: All error responses MUST continue using the `{ errors: ["message"] }` array format.
- **FR-005**: The password exclusion mechanism for `integrantes` MUST continue to function — `senha` never appears in any API response.
- **FR-006**: Pagination behavior on list endpoints MUST remain unchanged.
- **FR-007**: Junction endpoint nesting pattern MUST be preserved (e.g., `/api/musicas/:musicaId/versoes`, `/api/eventos/:eventoId/musicas`).
- **FR-008**: GET endpoints for parent entities MUST continue including direct relations by default.

**Code Patterns**

- **FR-009**: The class-based controller pattern (classes exported as `new ClassName()`) MUST be preserved.
- **FR-010**: All database operations MUST continue using the same Prisma client queries with identical behavior.
- **FR-011**: The Prisma `$extends` middleware for password stripping MUST be preserved in the TypeScript version.
- **FR-012**: Generated Prisma types MUST be integrated so that model types come from the Prisma schema rather than being manually defined.

**Build & Dev Workflow**

- **FR-013**: The application MUST have a working build/compilation step that produces a runnable application.
- **FR-014**: The development workflow MUST support running the application locally for development purposes.

### Key Entities

No entity changes — the same 15 Prisma models remain:

- **Artistas**: Artist/band entities
- **Artistas_Musicas**: Junction — artist arrangements of songs (versions with bpm, cifras, lyrics, link_versao)
- **Musicas**: Song compositions with tonalidade reference
- **Musicas_Tags**: Junction — song-to-tag associations
- **Musicas_Funcoes**: Junction — song-to-role associations
- **Tags**: Classification labels for songs
- **Tonalidades**: Musical keys
- **Funcoes**: Roles/capabilities (Vocal, Guitarra, etc.)
- **Integrantes**: Ministry team members
- **Integrantes_Funcoes**: Junction — member-to-role associations
- **Eventos**: Scheduled worship events
- **Eventos_Musicas**: Junction — event-to-song associations
- **Eventos_Integrantes**: Junction — event-to-member associations
- **Tipos_Eventos**: Event type categories

## Assumptions

- The Prisma schema (`schema.prisma`) is NOT modified — only the application code files change from `.js` to `.ts`.
- The existing class-based controller pattern and module structure are sound and should be preserved, not redesigned.
- Sucrase (currently used for ES module support) will be replaced or augmented by a TypeScript-aware compilation strategy — the specific build tool choice is an implementation detail for the plan phase.
- The `node_modules` and `prisma/` generated files are not counted as files to convert.
- Frontend code is not affected by this refactoring.
- The existing API documentation (if any) does not need to be modified since behavior is unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing API endpoints (59 endpoints across 9 resources) return identical responses to their JavaScript counterparts.
- **SC-002**: Zero runtime behavior changes — every edge case, error path, and success path produces the same result.
- **SC-003**: All 20 backend source files use `.ts` extension with valid TypeScript syntax.
- **SC-004**: The type checker reports zero errors across the entire backend codebase.
- **SC-005**: No usage of `any` type as an escape hatch in business logic code (controllers, Prisma client extension). Type-safe alternatives or specific types must be used.
- **SC-006**: The application starts successfully and serves requests after the refactoring.
