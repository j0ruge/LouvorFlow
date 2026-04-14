---
status: completed
title: Backend — `setMusicaVersao` PATCH endpoint and optional version on `addMusica` POST
type: backend
complexity: medium
dependencies:
  - task_01
---

# Task 02: Backend — `setMusicaVersao` PATCH endpoint and optional version on `addMusica` POST

## Overview
Adds the write path for the per-escala version selection: a dedicated `PATCH /api/eventos/:eventoId/musicas/:musicaId` endpoint to update or clear the chosen version, plus an optional `artistas_musicas_id` field on the existing `POST .../musicas` body so a leader can pick the version when first adding a song. Both paths validate that the version actually belongs to the song being modified.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- A new Zod schema `setMusicaVersaoBodySchema` MUST validate `{ artistas_musicas_id: string().uuid().nullable() }`.
- The `addMusicaBodySchema` MUST be extended with an optional, nullable `artistas_musicas_id` UUID field.
- A new repository method MUST issue a single Prisma `update()` on `eventos_musicas` to set the FK to a UUID or `NULL`.
- The service layer MUST validate: (1) the escala exists in the active tenant, (2) the `eventos_musicas` row exists for `(eventoId, musicaId)`, (3) when `artistas_musicas_id` is non-null, the referenced `Artistas_Musicas` row exists, belongs to the active tenant, and its `musica_id` equals `musicaId`.
- A new controller action MUST handle the PATCH request following the existing async-no-try-catch pattern; errors propagate via `AppError`.
- A new route `PATCH /api/eventos/:eventoId/musicas/:musicaId` MUST be wired with the chain `ensureAuthenticated → ensureTenantContext → can(['escalas.write']) → validateRequest`.
- The success response for both PATCH and the augmented POST MUST return `{ msg, musica }` where `musica` is the updated `MusicaEvento` shape from `formatEventoShow`.
- The fake repository in `tests/fakes/eventos.fake.ts` MUST gain `setMusicaVersao` to support the new service tests.
</requirements>

## Subtasks
- [x] 2.1 Add `setMusicaVersaoBodySchema` and extend `addMusicaBodySchema` in `src/validators/eventos.validators.ts`.
- [x] 2.2 Add `setMusicaVersao` to `src/repositories/eventos.repository.ts` and extend `createMusica` to accept the optional FK.
- [x] 2.3 Add the validation logic in `src/services/eventos.service.ts` (`setMusicaVersao` method) and extend `addMusica` to forward the optional version.
- [x] 2.4 Add the controller action in `src/controllers/eventos.controller.ts` and wire the new PATCH route in `src/routes/eventos.routes.ts`.
- [x] 2.5 Extend the fake repository to support the new operations.
- [x] 2.6 Add unit tests in `tests/services/eventos.service.test.ts` covering all happy and error paths listed below.

## Implementation Details
See TechSpec sections "API Endpoints" and "Build Order step 4". Follow the existing controller-service-repository layering and the `AppError` envelope `{ erro, codigo }`. Reuse `formatEventoShow`'s mapper for the response payload.

### Relevant Files
- `packages/backend/src/validators/eventos.validators.ts` — existing `addMusicaBodySchema` and `reorderMusicasBodySchema` patterns
- `packages/backend/src/services/eventos.service.ts` — `addMusica` (lines 199-211), `removeMusica` (lines 218-228) for reference patterns
- `packages/backend/src/repositories/eventos.repository.ts` — existing `createMusica` (lines 109-121), `reorderMusicas` (lines 136-145)
- `packages/backend/src/controllers/eventos.controller.ts` — existing `addMusica` action (lines 49-52)
- `packages/backend/src/routes/eventos.routes.ts` — existing route registrations (around line 27)
- `packages/backend/tests/fakes/eventos.fake.ts` — existing fake repo
- `packages/backend/tests/services/eventos.service.test.ts` — existing service test suite

### Dependent Files
- `packages/backend/docs/openapi.json` — must be updated in task_03
- `packages/frontend/src/services/eventos.ts` — must be updated in task_04 to call the new endpoint

### Related ADRs
- [ADR-001: Per-escala song version selection](adrs/adr-001.md) — Establishes that the version selection is escala-scoped, per song.

## Deliverables
- New `PATCH /api/eventos/:eventoId/musicas/:musicaId` endpoint with full middleware chain.
- Extended `POST /api/eventos/:eventoId/musicas` accepting an optional `artistas_musicas_id`.
- New `setMusicaVersao` service + repository methods.
- Extended fake repository.
- Unit tests with 80%+ coverage on the new code paths **(REQUIRED)**.
- Integration tests via the existing controller/service/fake-repo chain **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `setMusicaVersao` happy path: returns 200 and the updated `MusicaEvento` with `versao_selecionada` set.
  - [ ] `setMusicaVersao` accepts `artistas_musicas_id: null` and clears the FK.
  - [ ] `setMusicaVersao` returns 404 when the escala does not exist in the active tenant.
  - [ ] `setMusicaVersao` returns 404 when the `eventos_musicas` row does not exist for the given pair.
  - [ ] `setMusicaVersao` returns 400 when `artistas_musicas_id` references a version whose `musica_id` differs from the URL `musicaId`.
  - [ ] `setMusicaVersao` returns 400 when `artistas_musicas_id` references a version in another tenant.
  - [ ] `addMusica` with a valid `artistas_musicas_id` persists it on the new `eventos_musicas` row.
  - [ ] `addMusica` without `artistas_musicas_id` continues to default the FK to `null` (regression check on existing behavior).
  - [ ] `addMusica` rejects an `artistas_musicas_id` that belongs to a different `musicas_id` with 400.
- Integration tests:
  - [ ] Full controller-service-fake chain for `setMusicaVersao` returns the correct response envelope `{ msg, musica }`.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npm run test` in `packages/backend/` exits 0
- Manual `curl` of `PATCH /api/eventos/:id/musicas/:musicaId` with a valid body returns 200 and the updated structure
