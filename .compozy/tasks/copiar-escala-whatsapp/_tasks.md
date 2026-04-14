# Share Schedule to WhatsApp — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Backend — Add `fk_artistas_musicas` schema migration and inline versions in EventoShow | completed | medium | — |
| 02 | Backend — `setMusicaVersao` PATCH endpoint and optional version on `addMusica` POST | completed | medium | task_01 |
| 03 | Backend — Update OpenAPI spec for new endpoint and `MusicaEvento` shape | completed | low | task_02 |
| 04 | Frontend — Vitest bootstrap, Zod schema, service, and React Query hook for version selection | completed | medium | task_03 |
| 05 | Frontend — `MusicaVersaoPicker` component wired into `SortableMusicaCard` | completed | medium | task_04 |
| 06 | Frontend — `lib/whatsapp-share.ts` pure formatter + Vitest unit tests | completed | medium | task_04 |
| 07 | Frontend — `EscalaShareActions` component + integration into `EventoDetail` header | completed | medium | task_05, task_06 |
| 08 | Smoke test on real DB + documentation refresh (`MEMORY.md`, `README.md`) | completed | low | task_07 |
