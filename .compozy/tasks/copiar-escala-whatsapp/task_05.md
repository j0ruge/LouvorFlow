---
status: completed
title: Frontend — `MusicaVersaoPicker` component wired into `SortableMusicaCard`
type: frontend
complexity: medium
dependencies:
    - task_04
---

# Task 05: Frontend — `MusicaVersaoPicker` component wired into `SortableMusicaCard`

## Overview
Adds the version picker UI: a clickable badge next to the tonalidade badge inside `SortableMusicaCard` that opens a Popover with a radio list of available versions. Selecting a version fires the `useSetMusicaVersao` mutation. The picker auto-selects when only one version exists and renders nothing when zero versions exist.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- A new component `packages/frontend/src/components/MusicaVersaoPicker.tsx` MUST render a `Badge` with the selected version's `artista_nome` (or "Sem artista" when null), opening a shadcn `Popover` on click.
- The Popover MUST list every entry from `versoes_disponiveis` as a radio option, with an additional "Sem versão" option that maps to `null`.
- The component MUST auto-trigger the mutation with the single available version's id when `versoes_disponiveis.length === 1` and `versao_selecionada == null` (auto-select).
- The component MUST render `null` (no badge, no popover) when `versoes_disponiveis.length === 0`.
- The component MUST be wired into `SortableMusicaCard` inside `EventoDetail.tsx`, placed immediately after the tonalidade badge in the same flex group, and only rendered when `canWrite` is true.
- The mutation call MUST go through the `useSetMusicaVersao(eventoId)` hook from task_04; on success it relies on the hook's React Query invalidation to refresh the cache.
- A pure helper `selectDefaultVersaoId(versoes, current)` MUST be extracted (in `MusicaVersaoPicker.tsx` or a sibling file) and unit-tested with Vitest, since the auto-select rule is the part most prone to regressions.
</requirements>

## Subtasks
- [x] 5.1 Create `components/MusicaVersaoPicker.tsx` with the badge + Popover + radio list UI.
- [x] 5.2 Extract `selectDefaultVersaoId` as a pure helper used by the auto-select effect.
- [x] 5.3 Wire `MusicaVersaoPicker` into `SortableMusicaCard` next to the tonalidade badge.
- [x] 5.4 Verify the existing `Editar`/`Excluir` and drag-and-drop behavior is unchanged.
- [x] 5.5 Add Vitest tests for `selectDefaultVersaoId` covering the auto-select branches.
- [x] 5.6 Manual verification that toggling versions updates the badge label after the mutation settles.

## Implementation Details
Use shadcn primitives that are already in the project: `Badge`, `Popover`, `PopoverTrigger`, `PopoverContent`, and a simple radio group (or labeled buttons). The picker is a child of `SortableMusicaCard` (lines 78-147 of `EventoDetail.tsx`) and reuses the existing flex layout. Do not modify the drag handle or remove button placement.

### Relevant Files
- `packages/frontend/src/components/EventoDetail.tsx` — `SortableMusicaCard` (lines 78-147) and the music section (lines 386-457)
- `packages/frontend/src/components/ui/badge.tsx` — existing Badge component
- `packages/frontend/src/components/ui/popover.tsx` — existing Popover component (verify it exists; if not, install via shadcn CLI)
- `packages/frontend/src/hooks/use-eventos.ts` — `useSetMusicaVersao` (added in task_04)
- `packages/frontend/src/schemas/evento.ts` — `MusicaEventoSchema`, `VersaoMusicaSchema`

### Dependent Files
- `packages/frontend/src/components/EventoDetail.tsx` — modified by this task and again by task_07

### Related ADRs
- [ADR-001: Per-escala song version selection](adrs/adr-001.md) — Establishes that the selection is per-escala and the auto-select shortcut.

## Deliverables
- New `MusicaVersaoPicker.tsx` component.
- Wired into `SortableMusicaCard` in `EventoDetail.tsx`.
- Pure helper `selectDefaultVersaoId` extracted and exported.
- Vitest unit tests with 80%+ coverage on `selectDefaultVersaoId` **(REQUIRED)**.
- Manual smoke verification (recorded in PR description) that the picker updates correctly **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `selectDefaultVersaoId` returns `versoes[0].id` when there is exactly one version and `current === null`.
  - [ ] `selectDefaultVersaoId` returns `null` when there are zero versions.
  - [ ] `selectDefaultVersaoId` returns `null` when there are multiple versions and `current === null` (no guess).
  - [ ] `selectDefaultVersaoId` returns `current.id` unchanged when a valid current selection exists.
  - [ ] `selectDefaultVersaoId` returns `null` when `current.id` does not appear in `versoes` (stale selection after a deletion).
- Integration tests:
  - [ ] Manually verified during the smoke test in task_08; the picker fires the mutation and the badge updates after refetch.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npm run test` in `packages/frontend/` exits 0
- The picker visibly appears for songs with ≥2 versions and is hidden for songs with 0 versions
- Auto-select fires exactly once when a single-version song is added without an explicit version
