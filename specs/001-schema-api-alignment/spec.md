# Feature Specification: Schema & API Alignment with ER Model

**Feature Branch**: `001-schema-api-alignment`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Utilizando a foto do modelo ER, verificar o projeto e fazer as correções/refatoramentos necessários para alinhar schema, backend e frontend ao modelo de dados atual."

## Clarifications

### Session 2026-02-14

- Q: Should lookup tables (`funcoes.nome`, `tags.nome`, `tonalidades.tom`) enforce uniqueness like `artistas.nome` and `tipos_eventos.nome`? → A: Yes, all lookup tables enforce unique constraints on their name/value column.
- Q: Should GET endpoints include related data by default or require explicit `?include=` query params? → A: Always include direct relations by default in GET responses (e.g., musica returns tonalidade, tags, versions).
- Q: Should error responses use a consistent format across all controllers? → A: Yes, standardize on array format: `{ errors: ["message1", "message2"] }`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Backend CRUD for All Entities (Priority: P1)

An administrator opens the system and can manage **all** entities from the ER model via REST API: musicas, tonalidades, funcoes, tags, tipos_eventos, eventos — along with their junction relationships (artistas_musicas, eventos_musicas, eventos_integrantes, integrantes_funcoes, musicas_funcoes, musicas_tags). Currently only `artistas` and `integrantes` have working API routes.

**Why this priority**: Without complete API coverage, the frontend has no data source. This is the foundation for every other feature.

**Independent Test**: Each entity endpoint can be tested independently with HTTP requests (POST to create, GET to list/show, PUT to update, DELETE to remove) and verified against the database.

**Acceptance Scenarios**:

1. **Given** the server is running, **When** a client sends `GET /api/musicas`, **Then** the system returns a JSON array of all songs with their tonalidade relationship.
2. **Given** a valid payload, **When** a client sends `POST /api/eventos`, **Then** a new event is created with the correct `fk_tipo_evento` reference and the response includes the event data.
3. **Given** an existing song and tag, **When** a client sends `POST /api/musicas/:id/tags`, **Then** a junction record is created in `musicas_tags`.
4. **Given** an existing event, **When** a client sends `GET /api/eventos/:id`, **Then** the response includes the related musicas and integrantes via junction tables.

---

### User Story 2 - Add Missing Schema Entities (Tags) (Priority: P1)

The Prisma schema must include the `Tags` model and the `Musicas_Tags` junction table, which are present in the ER diagram but missing from the current schema. A new Prisma migration brings the database in sync.

**Why this priority**: The schema must be correct before building APIs on top of it. `Tags` and `musicas_tags` are the only missing entities.

**Independent Test**: Run the migration tool successfully, then verify the `tags` and `musicas_tags` tables exist in the database with the correct columns and foreign keys.

**Acceptance Scenarios**:

1. **Given** the current schema, **When** a developer runs the migration, **Then** a `tags` table is created with columns: unique identifier, `nome`, creation timestamp, update timestamp.
2. **Given** the current schema, **When** a developer runs the migration, **Then** a `musicas_tags` table is created with a UUID `id` primary key (consistent with all other junction tables), linking `musica_id` and `tag_id` with cascade deletes.

---

### User Story 3 - Fix Backend Structural Issues (Priority: P1)

The existing backend code has several structural issues that must be corrected before adding new endpoints:

- **No `/api` prefix**: Constitution mandates `/api/<resource>` pattern, but current routes mount at `/<resource>` (e.g., `/artistas` instead of `/api/artistas`).
- **Mixed import styles**: `app.js` and `index.js` mix `require()` and `import` in the same files.
- **Duplicate middleware**: `express.json()` is registered both in `app.js` and `index.js`.
- **CORS placement**: CORS middleware is applied in `index.js` after routes are already mounted in `app.js`.
- **Password exposure**: `integrantesController` returns `senha` (hashed password) in every response (index, show, create, update, delete).
- **Branding**: Sidebar still shows "EscalaCanto" instead of "LouvorFlow".

**Why this priority**: These are foundational issues. Adding new endpoints on top of a broken structure will multiply the problems.

**Independent Test**: After refactoring, verify that all existing endpoints still work at their new `/api/` paths, no password hashes leak in responses, and imports use a consistent style.

**Acceptance Scenarios**:

1. **Given** the refactored backend, **When** a client calls `GET /api/artistas`, **Then** it returns the list of artists (old path `/artistas` no longer works).
2. **Given** an integrante exists, **When** a client calls `GET /api/integrantes/:id`, **Then** the response includes `id`, `nome`, `doc_id`, `email` but NOT `senha`.
3. **Given** the backend source code, **When** reviewed, **Then** all files use a consistent module system (ES Modules via `import`/`export`).
4. **Given** the frontend sidebar, **When** rendered, **Then** it displays "LouvorFlow" as the application name.

---

### User Story 4 - Frontend Data Model Alignment (Priority: P2)

The frontend pages (Songs, Members, Scales, Dashboard) use hardcoded mock data whose structure doesn't match the ER model. The data shapes must be corrected so they're ready for API integration in a future feature.

- **Members page** shows `phone` and `instruments` fields. The `instruments` field should map to `funcoes` (via `integrantes_funcoes` junction table), not an inline array. The `phone` field will be added to the `integrantes` schema as a new `telefone` column (useful for WhatsApp contact), requiring a schema migration.
- **Songs page** data shape needs to reflect the actual model: a `musica` has `nome` and `fk_tonalidade`; BPM, cifras, lyrics, and link_versao belong to `artistas_musicas` (the version entity).
- **Dashboard** stats and recent scales should use data shapes that match API response format.

**Why this priority**: Important for consistency, but no user-facing functionality is broken since everything is still hardcoded. This prepares for the real API integration.

**Independent Test**: Review each page's mock data and confirm every field maps to a real entity/attribute in the ER model or a computed aggregate.

**Acceptance Scenarios**:

1. **Given** the Songs page mock data, **When** rendered, **Then** each song shows `nome`, `tonalidade` (from relationship), and version info (artista, bpm, cifras) from `artistas_musicas`.
2. **Given** the Members page mock data, **When** rendered, **Then** each member shows `nome`, `email`, `doc_id`, and their `funcoes` (from the junction table), not a hardcoded instruments array.
3. **Given** the Scales page mock data, **When** rendered, **Then** each scale maps to an `evento` with `tipo_evento`, and its integrantes/musicas come from junction relationships.

---

### Edge Cases

- What happens when a music has no tonalidade set? (`fk_tonalidade` is required in schema — creation should fail with a validation error)
- What happens when deleting a tag linked to multiple musicas? (CASCADE should remove all `musicas_tags` entries automatically)
- What happens when deleting an integrante linked to multiple eventos? (CASCADE should remove all `eventos_integrantes` entries automatically)
- How should the API handle attempts to create duplicate junction records (e.g., same musica + same tag)? Should return 409 Conflict with `{ errors: ["Registro duplicado"] }`.
- What happens when an endpoint receives an invalid UUID format? Should return 400 Bad Request.

## Requirements *(mandatory)*

### Functional Requirements

**Schema**

- **FR-001**: System MUST include a `Tags` model with UUID primary key and `nome` field.
- **FR-002**: System MUST include a `Musicas_Tags` junction table with UUID `id` primary key (consistent with other junction tables), linking `musicas` and `tags` with cascade deletes.
- **FR-003**: All foreign key constraints MUST enforce `ON DELETE CASCADE` as per constitution.
- **FR-003a**: System MUST add an optional `telefone` column to the `Integrantes` model.
- **FR-003b**: Lookup tables MUST enforce unique constraints: `funcoes.nome`, `tags.nome`, `tonalidades.tom`.

**Backend API — Structure**

- **FR-004**: All resource endpoints MUST be prefixed with `/api/` (e.g., `/api/musicas`, `/api/integrantes`).
- **FR-005**: All source files MUST use ES Module syntax (`import`/`export`) consistently — no `require()`.
- **FR-006**: The `express.json()` middleware MUST be registered exactly once.
- **FR-007**: CORS middleware MUST be applied before route handlers.
- **FR-008**: API responses for `integrantes` MUST NOT include the `senha` field.
- **FR-008a**: All API error responses MUST use the standardized array format: `{ errors: ["message1", "message2"] }`.

**Backend API — New Endpoints**

- **FR-009**: System MUST provide CRUD endpoints for `musicas` (list, show, create, update, delete).
- **FR-010**: System MUST provide CRUD endpoints for `tonalidades`.
- **FR-011**: System MUST provide CRUD endpoints for `funcoes`.
- **FR-012**: System MUST provide CRUD endpoints for `tags`.
- **FR-013**: System MUST provide CRUD endpoints for `tipos_eventos`.
- **FR-014**: System MUST provide CRUD endpoints for `eventos`.
- **FR-015**: System MUST provide endpoints for managing junction relationships: `artistas_musicas`, `eventos_musicas`, `eventos_integrantes`, `integrantes_funcoes`, `musicas_funcoes`, `musicas_tags`.
- **FR-016**: GET endpoints for parent entities (e.g., `musicas`, `eventos`) MUST include direct relations by default (e.g., `musica` returns its `tonalidade`, `tags`, and `artistas_musicas` versions; `evento` returns its `tipo_evento`, `musicas`, and `integrantes`).

**Frontend**

- **FR-017**: Frontend mock data structures MUST align with the ER model's entity shapes and relationships.
- **FR-018**: The application name in the sidebar MUST read "LouvorFlow".

### Key Entities

- **Musicas** (songs): Core composition entity — `id`, `nome`, `fk_tonalidade`. Relates to artistas via `artistas_musicas`, to eventos via `eventos_musicas`, to funcoes via `musicas_funcoes`, to tags via `musicas_tags`.
- **Artistas_Musicas** (versions): A specific artist's arrangement — `artista_id`, `musica_id`, `bpm`, `cifras`, `lyrics`, `link_versao`.
- **Eventos** (events/services): A scheduled worship event — `id`, `data`, `fk_tipo_evento`, `descricao`. Relates to musicas and integrantes via junction tables.
- **Integrantes** (members): Ministry team member — `id`, `nome`, `doc_id`, `email`, `senha`, `telefone`. Relates to funcoes via `integrantes_funcoes` and to eventos via `eventos_integrantes`.
- **Tags**: Classification labels for songs — `id`, `nome`. Relates to musicas via `musicas_tags`.
- **Funcoes** (roles): Capabilities like "Vocal", "Guitarra", "Sonorização" — `id`, `nome`. Relates to both integrantes and musicas via respective junction tables.
- **Tonalidades** (musical keys): — `id`, `tom`.
- **Tipos_Eventos** (event types): Categories like "Culto de Celebração" — `id`, `nome`.

## Assumptions

- The existing migration (`20251108022432_init`) is the current state of the database. New models (Tags, Musicas_Tags) will be added via a new incremental migration.
- The backend controller pattern established in `artistasController.js` and `integrantesController.js` (class-based with index/show/create/update/delete) is the standard to follow for new controllers.
- Junction table endpoints will be nested under their parent resource where it makes semantic sense (e.g., `POST /api/musicas/:id/tags` to tag a song).
- Frontend changes in this feature are limited to correcting mock data shapes and branding; full API integration (replacing mocks with real API calls) is a separate future feature.
- The `homeController` and its route will be kept as-is (health check endpoint).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every entity in the ER model (8 base entities + 6 junction tables = 14 total) has a corresponding data model and at least one working API endpoint.
- **SC-002**: All API endpoints are accessible under the `/api/` prefix and return correct JSON responses with proper HTTP status codes.
- **SC-003**: Zero instances of password hashes appearing in any API response body.
- **SC-004**: All backend source files use a consistent module system with no mixed import styles.
- **SC-005**: Frontend mock data fields map 1:1 to ER model attributes — no phantom fields that don't exist in the data model.
- **SC-006**: Application branding consistently shows "LouvorFlow" across all UI surfaces.
