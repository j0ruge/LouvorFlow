# Task Memory: task_04.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Frontend plumbing for version selection: Vitest config, Zod schemas, service function, React Query hook, and tests.

## Important Decisions
- Placed tests in `tests/unit/schemas/evento.test.ts` following the existing convention (existing tests at `tests/unit/schemas/musica.test.ts`), not `src/schemas/evento.test.ts` as originally suggested in the task spec.
- Extended vitest.config.ts include to also cover `src/**/*.test.ts` for future flexibility (task_06 will create `src/lib/whatsapp-share.test.ts`).
- `setMusicaVersao` service returns `AssociationResponse` (msg-only schema) — the backend returns `{ msg, musica }` but the service only validates the `msg` field for now. Task_05 can extend the response schema if it needs the returned musica.
- `useSetMusicaVersao` mutation accepts `{ musicaId, artistasMusicasId }` object — follows same pattern as `useAddIntegranteToEvento` for multi-param mutations.

## Learnings
- Vitest was already a devDependency and test scripts already existed. Only the include pattern and schema/service/hook code were new.
- Existing test pattern uses `tests/unit/` directory with `@/` path aliases resolved via vitest.config.ts.

## Files / Surfaces
- `packages/frontend/vitest.config.ts` — added `src/**/*.test.ts` to include
- `packages/frontend/src/schemas/evento.ts` — added `VersaoMusicaSchema`, extended `MusicaEventoSchema` with `versao_selecionada` + `versoes_disponiveis`
- `packages/frontend/src/services/eventos.ts` — added `setMusicaVersao()`
- `packages/frontend/src/hooks/use-eventos.ts` — added `useSetMusicaVersao()`
- `packages/frontend/tests/unit/schemas/evento.test.ts` — new test file (9 tests)

## Errors / Corrections
None.

## Ready for Next Run
- task_05 can import `useSetMusicaVersao` and `VersaoMusica` type directly.
- task_06 can import `VersaoMusicaSchema` / `MusicaEventoSchema` / `EventoShow` type for the formatter.
