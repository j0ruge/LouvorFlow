---
status: resolved
file: packages/backend/src/services/eventos.service.ts
line: 283
severity: medium
author: claude-code
provider_ref:
---

# Issue 003: Partial TOCTOU fix — addMusica pre-transaction checks still race

## Review Comment

Review-001 fix #11 moved version validation inside the `createMusica`
transaction to eliminate the window between "version exists" and "FK
written". That part is correct. However, the remaining existence checks in
`addMusica` are still performed outside the transaction:

```ts
// services/eventos.service.ts — addMusica
const evento = await eventosRepository.findByIdSimple(eventoId);
if (!evento) throw new AppError("Evento não encontrado", 404);

const musica = await eventosRepository.findMusicaById(musicas_id);
if (!musica) throw new AppError("Música não encontrada", 404);

const existente = await eventosRepository.findMusicaDuplicate(eventoId, musicas_id);
if (existente) throw new AppError("Registro duplicado", 409);

try {
  await eventosRepository.createMusica(eventoId, musicas_id, tenantId, artistas_musicas_id);
} catch (error) {
  this.handleVersaoSentinel(error, 'add');
}
```

Races that are still reachable:

1. **Evento deleted between `findByIdSimple` and `createMusica`**: Prisma
   raises `P2003` on the evento FK. `handleVersaoSentinel` only translates
   `P2003` as "Versão não encontrada" (404) — wrong message for this path.
   Worse, the current mapping makes any `P2003` inside the transaction look
   like a missing version, masking the real cause.
2. **Duplicate inserted by concurrent request between `findMusicaDuplicate`
   and `createMusica`**: The unique constraint
   `@@unique([tenant_id, evento_id, musicas_id])` raises `P2002`. The
   service does not catch `P2002`; it propagates as an unhandled 500 via
   the centralised error handler instead of the documented 409.
3. **Música deleted between `findMusicaById` and `createMusica`**: Same
   `P2003` path as (1), masked by the version-not-found translation.

The same pattern applies to `setMusicaVersao` (the outer `findByIdSimple`
and `findMusicaDuplicate` checks), though the blast radius is smaller
because no row is created — the atomic update either succeeds or fails.

### Sugestão de correção

Two options:

**Option A — tighten the handler (minimal change).** Distinguish P2003 on
the version FK from P2003 on the evento/música FK by inspecting
`error.meta.field_name` (Prisma provides this on FK errors). Keep the
pre-transaction checks, but translate:

- `P2003` on `fk_artistas_musicas` → 404 "Versão não encontrada"
- `P2003` on `evento_id` → 404 "Evento não encontrado"
- `P2003` on `musicas_id` → 404 "Música não encontrada"
- `P2002` → 409 "Registro duplicado"
- anything else → rethrow (generic 500)

**Option B — move all checks into the transaction (stronger guarantee).**
Add a single `createMusicaAtomic(eventoId, musicasId, tenantId, versao?)`
repo method that re-reads evento + música inside the transaction,
serializes the duplicate check via `INSERT ... ON CONFLICT DO NOTHING`
+ `rowCount`, and returns a structured result. The service drops its
pre-transaction reads entirely.

Option A is the smaller diff; Option B is the more defensible fix. Pick
one based on how load-bearing you expect addMusica/setMusicaVersao to be
under concurrent writes (a leader editing on desktop while the same
escala is edited on phone is the realistic scenario).

## Triage

- Decision: `valid`
- Notes: The `handleVersaoSentinel` method treats ALL `P2003` FK violations as "Versão não encontrada" (404), which masks the real cause when the race is on `evento_id` or `musicas_id` FKs. Additionally, `P2002` (unique constraint violation for concurrent duplicate insert) is not caught at all — it propagates as 500 instead of the documented 409. The pre-transaction existence checks in `addMusica` are still outside the transaction, so these races are reachable under concurrent writes (leader editing on desktop + phone).
- Fix approach: Option A (minimal change). Inspect `error.meta.field_name` on `P2003` to distinguish which FK failed. Handle `P2002` as 409 "Registro duplicado". Keep pre-transaction checks for the happy path (clear error messages). The handler becomes a safety net for concurrent races.
