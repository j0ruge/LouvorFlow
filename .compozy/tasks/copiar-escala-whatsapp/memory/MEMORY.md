# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State
- task_01..task_08: all completed (implementation phase)
- review_001: completed (19 findings fixed — 9 filed + 10 new — + migration-split recovery script). Backend 336 tests, frontend 101 tests green.

## Shared Decisions
- Route ordering: specific literal paths (e.g., `/reorder`) BEFORE parameterized paths (e.g., `/:musicaId`) in eventos routes to prevent capture.
- `addMusica` returns `MusicaEvento` (breaking change from void); controller returns `{ msg, musica }` envelope. `setMusicaVersao` follows same shape.
- **Zod schemas wired at route layer (not service):** `addMusicaBodySchema`, `setMusicaVersaoBodySchema`, `eventoIdParamSchema`, `eventoMusicaParamsSchema` all applied via `validateRequest` so malformed UUIDs hit the standardized `{ erro, codigo }` contract before reaching Prisma.
- **Version validation is atomic:** `createMusica` and `setMusicaVersaoAtomic` validate `Artistas_Musicas` inside the same `$transaction` as the write. Sentinel errors `VERSAO_NOT_FOUND`/`VERSAO_WRONG_MUSICA` + Prisma `P2003` are translated to `AppError` 404/400 by the service.
- **Missing version is 404 (not 400):** follows REST convention across the backend. "Belongs to another song" stays 400 because the request is logically valid but semantically wrong.
- **Lean projection for single-música response:** `findEventoMusicaDetail` in the repo returns one `Eventos_Musicas` with nested versions — `addMusica`/`setMusicaVersao` use it to avoid reloading the entire event graph per mutation.
- **Auto-select is silent:** `useSetMusicaVersao` mutation accepts `silent?: boolean`. `MusicaVersaoPicker`'s auto-select effect + stale-clear both pass `silent: true` — no toast noise on escala open.
- **Picker read-only mode:** `MusicaVersaoPicker` renders a static badge (no Popover) when `readOnly` is true; `EventoDetail` always renders it, passing `readOnly={!canWrite}` so non-writers still see the selected artist.
- **Frontend Vitest uses `jsdom`:** any test touching `navigator`/DOM needs jsdom. Use `vi.stubGlobal` + `vi.unstubAllGlobals` (not `Object.assign(navigator, ...)`) to avoid state leaks.

## Shared Learnings
- Fake repo records must match full shape of `MOCK_*` arrays (including nullable FK fields like `fk_artistas_musicas`).
- `findMusicaDuplicate` returns the junction row with `id` — reusable for targeted updates.
- **`$extends({ query })` tenant interceptor does NOT rewrite nested selects** — only top-level operations. Tenant safety in `EVENTO_SHOW_SELECT` (and `findEventoMusicaDetail`) relies on the FK-integrity invariant `Eventos → Eventos_Musicas → Musicas → Artistas_Musicas` sharing `tenant_id`. Block comment on `EVENTO_SHOW_SELECT` documents this. If the invariant is ever broken, add explicit `where: { tenant_id }` on nested selects.
- **Migration drift recovery without data loss:** when `prisma migrate dev` bundles unrelated drift into a feature migration, split on disk into separate migration folders AND run `scripts/reconcile-migration-split.ts` to reconcile `_prisma_migrations` (refresh checksum of split source + mark drift migrations as applied). Script is idempotent across fresh/reconciled/pre-split environments and only touches the metadata table.
- **`_prisma_migrations` checksum format:** SHA256 hex lowercase of the raw `migration.sql` content, computed via `createHash('sha256').update(content, 'utf8').digest('hex')`.
- **`prisma migrate resolve --applied` can't refresh checksums** — only inserts tracking rows for pending migrations. Checksum refresh needs direct SQL.

## Open Risks
- The split migrations `20260411032858` and `20260411032859` contain SQL for the pre-existing drift (invite_tokens FK, artistas_musicas index). Any environment that applied the original bundled `032857` needs the reconcile script run once before `prisma migrate dev`/`deploy` to avoid "object already exists" errors. Fresh environments get the three migrations normally.

## Handoffs
- task_05 imports `useSetMusicaVersao` from `hooks/use-eventos.ts` and `VersaoMusica` type from `schemas/evento.ts`.
- task_06 imports `EventoShow` type and `VersaoMusicaSchema` from `schemas/evento.ts` for the pure formatter.
- task_07 imports `copyEscalaToClipboard`, `formatEscalaWhatsApp`, `buildWhatsAppShareUrl` from `lib/whatsapp-share.ts`. Component is a Fragment with two buttons, rendered in `EventoDetail.tsx` header (gated on `escalas.write` for the actions themselves).
- review_001 introduces `packages/backend/scripts/reconcile-migration-split.ts` — run once per pre-split environment before next `prisma migrate dev`.
