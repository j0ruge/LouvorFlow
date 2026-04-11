---
status: completed
title: Backend — Add `fk_artistas_musicas` schema migration and inline versions in EventoShow
type: backend
complexity: medium
dependencies: []
---

# Task 01: Backend — Add `fk_artistas_musicas` schema migration and inline versions in EventoShow

## Overview
Adds the per-escala "selected version" foreign key on `eventos_musicas` and extends the `EVENTO_SHOW_SELECT` projection so the escala detail response includes the chosen version plus the full list of available versions per song. This is the data foundation for the version picker and the shared message link.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- The `eventos_musicas` Prisma model MUST gain a nullable `fk_artistas_musicas String? @db.Uuid` column with `onDelete: SetNull` and an `@@index` on the FK.
- A new Prisma migration MUST be created via `npx prisma migrate dev --name add_eventos_musicas_versao_fk` and committed.
- `npx prisma generate` MUST be re-run so downstream TypeScript code sees the new field.
- `EVENTO_SHOW_SELECT` MUST include both the selected `Artistas_Musicas` (via the new FK relation) and the parent music's full `Artistas_Musicas` list, projecting only `{ id, artista.nome, link_versao }` to keep payloads bounded.
- `formatEventoShow` MUST flatten the new shape into `MusicaEvento.versao_selecionada` (object or null) and `MusicaEvento.versoes_disponiveis` (array).
- The `MusicaEvento` TypeScript type MUST be updated in `src/types/index.ts` to include both new fields.
- Existing `eventos_musicas` rows MUST NOT require a backfill — the column is nullable by design.
</requirements>

## Subtasks
- [x] 1.1 Edit `prisma/schema.prisma` to add the FK column, relation, and index on `Eventos_Musicas`.
- [x] 1.2 Run the migration and regenerate the Prisma Client.
- [x] 1.3 Extend `EVENTO_SHOW_SELECT` in `src/types/index.ts` with the two new selects.
- [x] 1.4 Update `formatEventoShow` in `src/services/eventos.service.ts` to flatten the new fields.
- [x] 1.5 Update the `MusicaEvento` type definition in `src/types/index.ts`.
- [x] 1.6 Extend the `eventos.service.test.ts` fakes and tests to cover the new shape.

## Implementation Details
See TechSpec sections "Data Models" and "Build Order steps 1-3". The schema change is a single nullable column plus a `SET NULL` relation; the projection extension is two added `select` blocks. The mapper uses the existing flattening pattern.

### Relevant Files
- `packages/backend/prisma/schema.prisma` — model `Eventos_Musicas` (lines 121-137)
- `packages/backend/src/types/index.ts` — `EVENTO_SHOW_SELECT` (lines 352-373) and `MusicaEvento` type
- `packages/backend/src/services/eventos.service.ts` — `formatEventoShow` (lines 35-59)
- `packages/backend/prisma/migrations/` — directory for the new migration
- `packages/backend/tests/services/eventos.service.test.ts` — existing service test suite
- `packages/backend/tests/fakes/mock-data.ts` — `MOCK_EVENTOS_MUSICAS` and related mock fixtures

### Dependent Files
- `packages/backend/src/repositories/eventos.repository.ts` — will read the new field via the projection in the next task
- `packages/backend/src/controllers/eventos.controller.ts` — returns `formatEventoShow` output unchanged

### Related ADRs
- [ADR-001: Per-escala song version selection](adrs/adr-001.md) — Establishes that the version lives on the escala-song relationship.
- [ADR-002: Inline versions in EventoShow](adrs/adr-002.md) — Mandates inline projection over a separate endpoint.

## Deliverables
- New Prisma migration directory with the column addition and FK constraint.
- Updated `EVENTO_SHOW_SELECT` projection and `formatEventoShow` mapper.
- Updated `MusicaEvento` type with `versao_selecionada` and `versoes_disponiveis`.
- Unit tests with 80%+ coverage on the modified `formatEventoShow` paths **(REQUIRED)**.
- Updated mock fixtures in `tests/fakes/mock-data.ts` to include version data.

## Tests
- Unit tests:
  - [x] `formatEventoShow` returns `versao_selecionada` as a flat object when the FK is set on `eventos_musicas`.
  - [x] `formatEventoShow` returns `versao_selecionada: null` when the FK is null.
  - [x] `formatEventoShow` returns `versoes_disponiveis` containing every `Artistas_Musicas` row of the parent music, projected to `{ id, artista_nome, link_versao }`.
  - [x] `formatEventoShow` returns `versoes_disponiveis: []` when the music has no `Artistas_Musicas` rows.
  - [x] `versao_selecionada.artista_nome` is `null` when the version's `artista_id` is null (generic version).
- Integration tests:
  - [ ] N/A — covered by the next task's controller integration through the same projection.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npx prisma migrate dev` runs cleanly on the dev container `louvorflow_db`
- `npx prisma generate` produces a Prisma Client that exposes `fk_artistas_musicas` on `Eventos_Musicas`
- `GET /api/eventos/:id` (manually verified via curl) returns the two new fields on every `musicas[]` entry
