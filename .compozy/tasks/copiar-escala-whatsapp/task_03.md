---
status: completed
title: Backend — Update OpenAPI spec for new endpoint and `MusicaEvento` shape
type: docs
complexity: low
dependencies:
    - task_02
---

# Task 03: Backend — Update OpenAPI spec for new endpoint and `MusicaEvento` shape

## Overview
Brings `packages/backend/docs/openapi.json` in sync with the new backend surface from task_01 and task_02 so the contract is the source of truth for the frontend implementation in task_04. Without this update, the frontend cannot rely on a documented contract and the project rule that requires the spec to mirror every API change is violated.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- The `MusicaEvento` schema in `openapi.json` MUST gain `versao_selecionada` (nullable object) and `versoes_disponiveis` (array of objects). Both items use the new `VersaoMusica` schema with `{ id: uuid, artista_nome: string|null, link_versao: string|null }`.
- A new component schema `VersaoMusica` MUST be defined under `components.schemas`.
- A new operation `PATCH /api/eventos/{eventoId}/musicas/{musicaId}` MUST be added under tag `Eventos - Músicas` with: path params, request body referencing the new body schema, success response `{ msg, musica }`, and error responses `400`, `401`, `403`, `404`.
- The existing `POST /api/eventos/{eventoId}/musicas` body schema MUST gain an optional `artistas_musicas_id` field (UUID, nullable).
- The spec MUST remain valid JSON and parse cleanly (`jq . openapi.json` succeeds).
- The new operation MUST follow the existing security scheme used by other write endpoints (bearer JWT).
</requirements>

## Subtasks
- [ ] 3.1 Add the `VersaoMusica` schema under `components.schemas`.
- [ ] 3.2 Extend the `MusicaEvento` schema with the two new fields.
- [ ] 3.3 Extend the `POST /api/eventos/{eventoId}/musicas` request body schema with optional `artistas_musicas_id`.
- [ ] 3.4 Add the new `PATCH /api/eventos/{eventoId}/musicas/{musicaId}` operation.
- [ ] 3.5 Validate the full JSON document parses with `jq`.

## Implementation Details
The OpenAPI spec is hand-maintained JSON. Locate the existing `Eventos - Músicas` operations and the `MusicaEvento` schema, then add the new pieces in the same style. No code generation tooling is involved.

### Relevant Files
- `packages/backend/docs/openapi.json` — the spec to update
- `packages/backend/src/routes/eventos.routes.ts` — source of truth for the route (added in task_02)
- `packages/backend/src/validators/eventos.validators.ts` — source of truth for the body schema (added in task_02)

### Dependent Files
- `packages/frontend/src/schemas/evento.ts` — task_04 will mirror the new `MusicaEvento` shape from this contract

### Related ADRs
- [ADR-002: Inline versions in EventoShow](adrs/adr-002.md) — Justifies the new fields on `MusicaEvento`.

## Deliverables
- Updated `openapi.json` with new schema `VersaoMusica`, extended `MusicaEvento`, extended POST body, and new PATCH operation.
- JSON validity check passes **(REQUIRED)**.
- Contract-consistency check confirming the documented operation matches the route registered in task_02 **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `jq . packages/backend/docs/openapi.json` exits 0 (JSON is well-formed).
  - [ ] `jq '.paths."/api/eventos/{eventoId}/musicas/{musicaId}".patch' packages/backend/docs/openapi.json` returns a non-null object.
  - [ ] `jq '.components.schemas.VersaoMusica' packages/backend/docs/openapi.json` returns a non-null object.
  - [ ] `jq '.components.schemas.MusicaEvento.properties.versao_selecionada' packages/backend/docs/openapi.json` returns a non-null object.
- Integration tests:
  - [ ] N/A — the spec is documentation; runtime behavior is exercised by task_02 tests.
- Test coverage target: >=80% (interpreted here as: every new path/schema is referenced by at least one validation check above)
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `openapi.json` parses with `jq`
- The PATCH operation, the augmented POST body, and the new schemas are all present and resolvable via `$ref`
