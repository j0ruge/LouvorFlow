---
status: completed
title: Frontend — Vitest bootstrap, Zod schema, service, and React Query hook for version selection
type: frontend
complexity: medium
dependencies:
  - task_03
---

# Task 04: Frontend — Vitest bootstrap, Zod schema, service, and React Query hook for version selection

## Overview
Bootstraps the first Vitest configuration in `packages/frontend/`, extends the Zod schema to mirror the new `MusicaEvento` contract from task_03, and adds the API service function plus React Query mutation hook needed by tasks 05 and 06. This is the plumbing layer; no UI changes happen here.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `packages/frontend/package.json` MUST add `vitest` as a devDependency and expose `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- A new `packages/frontend/vitest.config.ts` MUST be created with `globals: true` and `environment: 'node'` (the formatter target is pure; jsdom is not required for this task).
- `MusicaEventoSchema` in `packages/frontend/src/schemas/evento.ts` MUST gain `versao_selecionada: VersaoMusicaSchema.nullable()` and `versoes_disponiveis: z.array(VersaoMusicaSchema)`.
- A new `VersaoMusicaSchema` MUST be exported from the same file with shape `{ id, artista_nome, link_versao }`.
- A new function `setMusicaVersao(eventoId, musicaId, artistas_musicas_id)` MUST be added to `packages/frontend/src/services/eventos.ts`, calling the new PATCH endpoint.
- A new hook `useSetMusicaVersao(eventoId)` MUST be added to `packages/frontend/src/hooks/use-eventos.ts`, following the existing mutation pattern (invalidate `["eventos", eventoId]` and `["eventos"]`, success/error toasts via Sonner).
- A new test file `packages/frontend/src/schemas/evento.test.ts` MUST verify the schema parses both populated and empty version data.
</requirements>

## Subtasks
- [ ] 4.1 Add Vitest as a devDependency, write `vitest.config.ts`, and add the npm scripts.
- [ ] 4.2 Add `VersaoMusicaSchema` and extend `MusicaEventoSchema` in `schemas/evento.ts`.
- [ ] 4.3 Add `setMusicaVersao` to `services/eventos.ts`.
- [ ] 4.4 Add `useSetMusicaVersao` mutation hook to `hooks/use-eventos.ts`.
- [ ] 4.5 Write the schema parse tests in `schemas/evento.test.ts`.
- [ ] 4.6 Verify `npm run test` in `packages/frontend/` exits 0.

## Implementation Details
See TechSpec section "Implementation Design → Core Interfaces" for the exact Zod and function signatures. The service function should follow the existing `apiFetch` pattern in `lib/api.ts`. The hook follows the same `onSuccess` invalidation + toast pattern as `useAddMusicaToEvento` in `use-eventos.ts`.

### Relevant Files
- `packages/frontend/package.json` — devDependencies and scripts
- `packages/frontend/src/schemas/evento.ts` — `MusicaEventoSchema` (lines 12-17 area), `EventoShowSchema`
- `packages/frontend/src/services/eventos.ts` — existing `addMusicaToEvento` and similar service functions
- `packages/frontend/src/hooks/use-eventos.ts` — `useAddMusicaToEvento` (lines 128-142 area) as the closest pattern
- `packages/frontend/src/lib/api.ts` — `apiFetch` and token handling

### Dependent Files
- `packages/frontend/src/components/MusicaVersaoPicker.tsx` — created in task_05, will consume the hook
- `packages/frontend/src/lib/whatsapp-share.ts` — created in task_06, will consume the new schema fields
- `packages/frontend/src/components/EventoDetail.tsx` — touched in tasks 05 and 07

### Related ADRs
- [ADR-002: Inline versions in EventoShow](adrs/adr-002.md) — Justifies the schema additions matching the inline projection.

## Deliverables
- Working Vitest configuration and scripts in `packages/frontend/`.
- Extended Zod schemas with `VersaoMusicaSchema` and the two new `MusicaEvento` fields.
- New `setMusicaVersao` service function and `useSetMusicaVersao` mutation hook.
- Schema parse tests with 80%+ coverage on the new schema branches **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `MusicaEventoSchema.parse(...)` accepts an item with both fields populated (one selected version, two available versions).
  - [ ] `MusicaEventoSchema.parse(...)` accepts `versao_selecionada: null` with `versoes_disponiveis: []`.
  - [ ] `MusicaEventoSchema.parse(...)` rejects an item missing `versoes_disponiveis` (proves the field is required).
  - [ ] `VersaoMusicaSchema.parse(...)` accepts `{ artista_nome: null, link_versao: null }` (generic version with no link).
  - [ ] `VersaoMusicaSchema.parse(...)` rejects a non-UUID `id`.
- Integration tests:
  - [ ] N/A — the hook integration is exercised end-to-end by the smoke test in task_08.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npm run test` in `packages/frontend/` exits 0
- TypeScript compiles cleanly with the new schema and hook
