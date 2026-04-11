# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
- Pure formatter `formatEscalaWhatsApp`, URL builder `buildWhatsAppShareUrl`, clipboard helper `copyEscalaToClipboard` — all implemented and tested.

## Important Decisions
- `tipoEvento` null fallback uses "Evento" as header label.
- Songs sorted by `ordem` (existing field), integrantes sorted alphabetically with `localeCompare('pt-BR', { sensitivity: 'base' })`.
- `formatDate` uses `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })` as required.
- The em-dash `—` separates integrante nome from funções (matching PRD layout).

## Learnings
- Vitest test assertions with `.not.toContain("(")` are too broad when the output contains count headers like `(0)` or `(1)`. Use regex matching instead.

## Files / Surfaces
- NEW: `packages/frontend/src/lib/whatsapp-share.ts` — 3 exports
- NEW: `packages/frontend/src/lib/whatsapp-share.test.ts` — 12 tests (all pass)

## Errors / Corrections
- Initial test for "no tonalidade" used `.not.toContain("(")` which caught `(1)` in `*Músicas* (1)`. Fixed to `.not.toMatch(/1\. Canto Livre \(/)`.

## Ready for Next Run
- task_07 (EscalaShareActions component) imports all 3 exports from `lib/whatsapp-share.ts`.
