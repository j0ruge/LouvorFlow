<!--
Sync Impact Report
==================
- Version change: 1.0.0 → 1.0.1 (PATCH: corrections & clarifications)
- Changes:
  - Principle II: Corrected junction table examples — replaced
    `musicos_funcoes` with `integrantes_funcoes`; added
    `eventos_integrantes`, `musicas_funcoes`, `musicas_tags`.
  - Principle IV: Moved `tonalidade` from Version entity to Music entity
    to match ER model (`musicas.fk_tonalidade → tonalidades`).
  - Technical Constraints: Corrected entity naming examples — replaced
    `musicos` with actual table names (`integrantes`, `artistas`,
    `musicas`); added `tags`.
  - Version bumped to 1.0.1.
- Templates requiring updates: none
- Follow-up TODOs: none
-->

# LouvorFlow Constitution

## Core Principles

### I. Mobile-First & Cross-Platform Ready

- All UI components MUST be designed for mobile screens first, then
  progressively enhanced for larger viewports.
- Component architecture MUST remain portable to React Native. Avoid
  web-only APIs (e.g., direct DOM manipulation) in shared logic.
- Navigation patterns MUST be compatible with Expo Router's file-based
  routing so the future migration path stays clear.
- **Rationale**: The project will transition from web app to React Native
  with Expo Router. Designing mobile-first from the start avoids costly
  rewrites and ensures usability on the devices members actually carry.

### II. Relational Data Integrity

- All entities MUST use UUID v4 primary keys (`uuid_generate_v4()`).
- Foreign key constraints with `ON DELETE CASCADE` MUST be enforced for
  all relationships.
- Many-to-many relationships MUST use explicit junction tables (e.g.,
  `integrantes_funcoes`, `artistas_musicas`, `eventos_musicas`,
  `eventos_integrantes`, `musicas_funcoes`, `musicas_tags`).
- Database schema changes MUST be managed exclusively through Prisma
  migrations — no manual DDL in production.
- **Rationale**: The domain has rich relationships (members-roles,
  songs-versions-artists, events-songs-members). Strict referential
  integrity prevents orphaned records and ensures consistent joins.

### III. RESTful API as Single Source of Truth

- The backend MUST expose a RESTful API that mirrors the relational
  model using resource-oriented endpoints.
- All frontend data access MUST go through the API layer — no direct
  database queries from client code.
- API responses MUST use consistent JSON structures with proper HTTP
  status codes and error payloads.
- Endpoint naming MUST follow the pattern: `/api/<resource>` using
  Portuguese entity names matching the database (e.g., `/api/integrantes`,
  `/api/musicas`, `/api/eventos`).
- **Rationale**: A well-defined API layer decouples frontend from
  backend, enabling the future React Native client to reuse the same
  backend without modification.

### IV. Version-Centric Repertoire Model

- "Music" (the composition) and "Version" (a specific artist's
  arrangement) MUST remain distinct entities.
- Version-specific metadata (BPM, cifra, lyrics, reference link) MUST
  belong to the Version entity (`artistas_musicas`).
- Tonalidade (musical key) MUST belong to the Music entity (`musicas`)
  as a composition-level attribute via `fk_tonalidade → tonalidades`.
- When building repertoire for an event, the user MUST select both
  the Music and the specific Version to be performed.
- Frequency/usage reports MUST aggregate by Music (composition),
  independent of which Version was performed.
- **Rationale**: This is the core domain model that distinguishes
  LouvorFlow from a simple song list. Musicians need to know exactly
  which arrangement, key, and BPM to prepare for each event.

### V. Simplicity & Pragmatism (YAGNI)

- Every feature MUST start with the simplest solution that meets
  current requirements.
- No premature abstractions, design patterns, or architectural layers
  MUST be introduced without a concrete, present-day need.
- Any added complexity MUST be justified with a documented rationale
  explaining why a simpler alternative is insufficient.
- **Rationale**: LouvorFlow serves a church ministry team, not a
  Fortune 500 company. Over-engineering wastes volunteer developer
  time and obscures the domain logic that matters.

## Technical Constraints

- **Runtime**: Node.js (LTS) with Express 5
- **ORM**: Prisma with PostgreSQL provider
- **Database**: PostgreSQL 17+, containerized via Docker Compose
- **Frontend** (current): Web App, mobile-first responsive design
- **Frontend** (future): React Native with Expo Router
- **Language**: JavaScript (ES Modules via Sucrase); TypeScript
  adoption is permitted when the team is ready
- **Authentication**: bcryptjs for password hashing; auth strategy
  to be defined per-feature
- **Entity naming**: Portuguese names in database tables and API
  endpoints to match domain language (e.g., `integrantes`, `artistas`,
  `musicas`, `funcoes`, `tonalidades`, `tags`)
- **IDs**: UUID v4 for all primary keys; no auto-increment integers
- **Performance**: Optimize queries for the common join pattern
  `musicas + artistas_musicas + artistas` using Prisma `include`
  or raw queries when necessary

## Development Workflow

- Features MUST follow the SpecKit workflow: specify → plan → tasks
  → implement.
- Database changes MUST use `npx prisma migrate dev` — never edit
  the production database directly.
- Feature branches MUST use the naming convention
  `<issue-number>-<short-description>` (e.g., `042-song-versions`).
- Code reviews MUST verify compliance with this constitution before
  merging.
- Commits MUST be atomic and descriptive, grouped by logical unit
  of work.

## Governance

- This constitution supersedes all ad-hoc decisions and informal
  agreements about architecture, patterns, and tooling.
- Amendments require: (1) a documented rationale, (2) review by
  active contributors, and (3) a version bump following SemVer:
  - **MAJOR**: Principle removed, redefined, or made incompatible.
  - **MINOR**: New principle or section added, or existing guidance
    materially expanded.
  - **PATCH**: Clarifications, typo fixes, non-semantic refinements.
- All PRs and code reviews MUST verify compliance with active
  principles.
- Use `.specify/memory/constitution.md` as the canonical reference
  for runtime development guidance.

**Version**: 1.0.1 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
