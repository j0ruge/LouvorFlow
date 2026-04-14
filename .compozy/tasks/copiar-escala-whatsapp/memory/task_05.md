# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Frontend `MusicaVersaoPicker` component with badge + Popover + radio list, wired into `SortableMusicaCard`, with auto-select for single-version songs.

## Important Decisions
- Used a `<button>` styled like a Badge instead of wrapping Badge in PopoverTrigger — avoids nesting interactive elements and gives proper button semantics.
- `SEM_VERSAO_VALUE = "__sem_versao__"` sentinel used for RadioGroup since Radix RadioGroup doesn't support empty string values.
- Auto-select uses `useRef(autoSelectFired)` to ensure the mutation fires exactly once per mount.
- `selectDefaultVersaoId` is a pure exported function in the same file — no separate utility file needed given it's tightly coupled.

## Learnings
- All shadcn primitives needed (Popover, RadioGroup, Label, Badge) were already installed.
- `SortableMusicaCard` is a local function component inside `EventoDetail.tsx`, not exported — needed to add `eventoId` prop and `useSetMusicaVersao` hook call inside it.

## Files / Surfaces
- **Created**: `packages/frontend/src/components/MusicaVersaoPicker.tsx`
- **Created**: `packages/frontend/tests/unit/components/MusicaVersaoPicker.test.ts` (8 tests)
- **Modified**: `packages/frontend/src/components/EventoDetail.tsx` — added import, `eventoId` prop to `SortableMusicaCard`, rendered picker after tonalidade badge

## Errors / Corrections
- None

## Ready for Next Run
- task_06 (WhatsApp formatter) and task_07 (EscalaShareActions) can proceed.
- task_07 modifies `EventoDetail.tsx` again (header area) — no conflict with task_05 changes (which are in the music card area).
