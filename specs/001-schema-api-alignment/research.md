# Research: Schema & API Alignment

**Feature**: 001-schema-api-alignment
**Date**: 2026-02-14

## R-001: Express 5 Route Prefix Strategy

**Decision**: Use `app.use('/api/resource', router)` in app.js for all resource routes. The home route stays at `/` as a health check.

**Rationale**: Express 5 supports the same `app.use(path, router)` pattern as Express 4. Centralizing all route mounting in `app.js` with `/api/` prefix is the simplest approach — no middleware, no proxy, no versioned router groups needed.

**Alternatives considered**:

- Versioned router group (`/api/v1/`) — rejected per YAGNI; no versioning need yet.
- Separate API router file that mounts sub-routers — unnecessary indirection for current scale.

## R-002: ES Module Consistency with Sucrase

**Decision**: Convert all `require()` calls to `import` statements. Sucrase transpiles ES Modules to CommonJS at runtime, so all files can use `import`/`export` uniformly.

**Rationale**: The project already uses Sucrase (configured in `nodemon.json`) and most files already use `import`. The `require()` calls in `index.js` and `app.js` are inconsistencies, not intentional patterns. `dotenv` can be imported as `import 'dotenv/config'` instead of `require('dotenv').config()`.

**Alternatives considered**:

- Switch to native ESM (`"type": "module"` in package.json) — more work, may break Prisma client import; not worth the risk for this feature.
- Keep `require()` everywhere — contradicts constitution (ES Modules via Sucrase).

## R-003: Middleware Consolidation

**Decision**: All middleware (cors, express.json, express.urlencoded) goes in `app.js` middlewares() method. `index.js` only handles dotenv, database connection, and server listen.

**Rationale**: Currently `express.json()` is in both files, and cors is applied after routes in `index.js` (ineffective). Moving everything to `app.js` ensures correct middleware ordering: cors → urlencoded → json → routes.

**Alternatives considered**:

- Keep middleware in `index.js` only — would require restructuring app.js which also registers routes; less clean separation.

## R-004: Junction Table Endpoint Design

**Decision**: Nest junction operations under parent resources:

| Junction Table | Primary Access Pattern | Endpoint |
|---|---|---|
| `artistas_musicas` | Versions of a song | `POST/GET/DELETE /api/musicas/:id/versoes` |
| `eventos_musicas` | Songs in an event | `POST/GET/DELETE /api/eventos/:id/musicas` |
| `eventos_integrantes` | Members in an event | `POST/GET/DELETE /api/eventos/:id/integrantes` |
| `integrantes_funcoes` | Roles of a member | `POST/GET/DELETE /api/integrantes/:id/funcoes` |
| `musicas_funcoes` | Functions needed for a song | `POST/GET/DELETE /api/musicas/:id/funcoes` |
| `musicas_tags` | Tags on a song | `POST/GET/DELETE /api/musicas/:id/tags` |

**Rationale**: Nested routes express the domain relationship naturally. A user thinks "add a tag to this song", not "create a musicas_tags record". This aligns with RESTful resource-oriented design (Constitution Principle III).

**Alternatives considered**:

- Top-level routes for each junction table (`/api/artistas-musicas`) — less intuitive, exposes implementation detail.
- Mixed approach — inconsistent, harder to learn.

## R-005: Password Exclusion Strategy

**Decision**: Two-layer defense:

1. **Primary — Prisma middleware (`prisma.$use`)**: Register a global result middleware in `prisma/cliente.js` that strips `senha` from every query result automatically. This guarantees no endpoint can accidentally leak the password hash, even if a developer forgets the select constant.

   ```js
   // prisma/cliente.js
   prisma.$use(async (params, next) => {
     const result = await next(params);
     if (params.model === 'Integrantes') {
       const strip = (obj) => { if (obj && typeof obj === 'object') delete obj.senha; return obj; };
       return Array.isArray(result) ? result.map(strip) : strip(result);
     }
     return result;
   });
   ```

   **Applies to**: `findUnique`, `findFirst`, `findMany`, `create`, `update`, `delete`, `upsert` — every action that returns model data.

2. **Fallback — Reusable select constant in `integrantesController.js`**: Keep `INTEGRANTE_PUBLIC_SELECT = { id: true, nome: true, doc_id: true, email: true, telefone: true }` and use it in all Integrantes queries. This prevents `senha` from being fetched at the query level, so the hash never enters application memory beyond the auth flow.

**Rationale**: The Prisma middleware acts as a safety net at the ORM boundary — even if a new endpoint or service bypasses the select constant, `senha` is still stripped before reaching the controller. The select constant remains valuable as defense-in-depth: it avoids transferring the hash from the database at all, reducing memory exposure. Together, the two layers follow the principle of least privilege.

**Exceptions**: Auth-related queries (login, password change) that explicitly need `senha` should use a separate Prisma client instance or query via `prisma.$queryRaw` to bypass the middleware, or the middleware can check for a context flag (e.g., `params.args.includePassword`) to conditionally allow the field through.

**Alternatives considered**:

- Select constant only (previous decision) — fragile; a single missed query leaks the hash.
- Response middleware in Express — acts too late (hash already in app memory), risk of missing an endpoint.
- Prisma middleware only, no select constant — works but fetches the hash from DB unnecessarily on every query.

## R-006: Prisma Schema Changes — Migration Strategy

**Decision**: Single migration that adds: (1) `Tags` model, (2) `Musicas_Tags` model, (3) `telefone` optional column on `Integrantes`, (4) unique constraints on `funcoes.nome`, `tags.nome`, `tonalidades.tom`.

**Rationale**: All changes are additive (new tables, new nullable column, new constraints on currently-unique-in-practice data). A single migration keeps the changeset atomic. The unique constraints are safe to add if no duplicates exist yet (fresh/dev database).

**Alternatives considered**:

- Separate migrations per change — unnecessary granularity for development phase.
- Manual SQL — violates Constitution Principle II.

## R-007: Error Response Standardization

**Decision**: All controllers return errors as `{ errors: ["message1", "message2"] }`. Existing controllers will be refactored to replace `{ errors: 'string' }` and `{ errors: ['array'] }` with the consistent array format.

**Rationale**: Decided during `/speckit.clarify`. Array format supports multiple validation errors in a single response. Frontend can always expect `response.errors` to be iterable.

**Alternatives considered**:

- Object format (`{ errors: { field: "msg" } }`) — more structured but over-engineered for current validation needs.
- String format — can't express multiple errors.
