# Task Memory: review_001.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Fix all review findings from `.compozy/tasks/copiar-escala-whatsapp/reviews-001/` (9 filed issues) plus additional findings surfaced by the second-pass review (10 new). Reconcile the split of migration `20260411032857` without losing data in the dev DB.

## Important Decisions
- Split `20260411032857_add_eventos_musicas_versao_fk` into three migration folders (feature + two drift fixes) rather than leaving the drift bundled.
- Version validation moved from standalone `validateVersao` pre-check into the write transaction via `setMusicaVersaoAtomic` and the updated `createMusica` — closes the TOCTOU window.
- `AssociationResponseSchema` in `services/eventos.ts` left as `{ msg }` — the new lean repo projection (`findEventoMusicaDetail`) already addresses bandwidth; widening the client schema for optimistic updates is deferred.
- Recovery of local dev DB via `scripts/reconcile-migration-split.ts` (metadata-only fixup) instead of `prisma migrate reset`, so no data is lost.
- `MusicaVersaoPicker` renders for everyone (read-only badge for non-writers) — previously hidden behind `canWrite`.

## Learnings
- `tsconfig.json` of `packages/backend` emits CommonJS — scripts must use `__dirname`, not `import.meta.url`. TS1470 caught this on first typecheck.
- `_prisma_migrations.id` is `VARCHAR(36)` — `gen_random_uuid()::text` fits.
- `vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } })` is the correct pattern under jsdom. Plain `Object.assign(navigator, ...)` leaks between tests.
- Pre-existing `MusicaVersaoPicker.test.ts` and `EscalaShareActions.test.ts` were already in `tests/unit/components/` and stayed green after the component refactors — the new tests path include pattern (`tests/unit/**/*.test.ts`) already covered them.
- Backend lint has pre-existing warnings/1 error in auth/convites test files — unrelated to this review round.

## Files / Surfaces
- **Migrations (new/edited):** `prisma/migrations/20260411032857_add_eventos_musicas_versao_fk/migration.sql` (reduced), `20260411032858_.../migration.sql` (new), `20260411032859_.../migration.sql` (new).
- **Backend code:** `src/validators/eventos.validators.ts` (+ param schemas), `src/routes/eventos.routes.ts` (wire validators), `src/services/eventos.service.ts` (sentinel handler + atomic writes + lean projection + 404), `src/repositories/eventos.repository.ts` (+`findEventoMusicaDetail`, `setMusicaVersaoAtomic`, validation inside `createMusica`), `src/types/index.ts` (+`EventoMusicaDetailRaw`, tenant invariant comment on `EVENTO_SHOW_SELECT`).
- **Backend tests/fakes:** `tests/services/eventos.service.test.ts` (400→404), `tests/fakes/fake-eventos.repository.ts` (+new methods, sentinel throws).
- **Backend script:** `scripts/reconcile-migration-split.ts` (new, idempotent).
- **Frontend code:** `src/components/MusicaVersaoPicker.tsx` (stale detection, readOnly mode, keyed autoSelect ref, distinct labels), `src/components/EscalaShareActions.tsx` (useRef timer cleanup, URL length guard, useMemo formatter), `src/components/EventoDetail.tsx` (always-render picker with `readOnly={!canWrite}`), `src/hooks/use-eventos.ts` (silent flag, drop list invalidation).
- **Frontend config/tests:** `vitest.config.ts` (node→jsdom, include .tsx), `package.json` (+`jsdom` devDep), `src/lib/whatsapp-share.test.ts` (stubGlobal/unstubAllGlobals).
- **Docs:** OpenAPI already covered the PATCH endpoint; no further edits needed.

## Errors / Corrections
- `TS1470: 'import.meta' not allowed in CommonJS` on first run of `reconcile-migration-split.ts` → switched to `__dirname`.
- No other failures; all typecheck + tests passed on the first full run after fixes.

## Ready for Next Run
- 19 findings fixed. Backend 336/336 tests + frontend 101/101 tests pass. Reconcile script validated locally: pre-reconcile row counts preserved (4 eventos_musicas, 0 invite_tokens, 3 artistas_musicas), `prisma migrate status` reports "Database schema is up to date!", idempotency confirmed.
- Backup of dev DB stored at `/tmp/louvorflow-pre-reconcile.sql` (73 KB) — safe to delete once confident.
- Reviews-001 issue files still have `status: pending` and `Decision: UNREVIEWED` — a future run should mark them resolved (separate tooling / `cy-fix-reviews` flow).
