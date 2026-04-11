---
status: resolved
file: packages/backend/src/controllers/eventos.controller.ts
line: 49
severity: low
author: claude-code
provider_ref:
---

# Issue 007: addMusica response shape deviates from TechSpec "unchanged"

## Review Comment

The TechSpec under `Modified — POST /api/eventos/:eventoId/musicas` states:

> Body grows by one optional field: `artistas_musicas_id?: string | null`.
> …
> Response shape unchanged (still returns the created entry).

However, the current implementation returns an expanded envelope:

```ts
// eventos.controller.ts:49
async addMusica(req: Request<{ eventoId: string }>, res: Response): Promise<void> {
    const musica = await eventosService.addMusica(
        req.params.eventoId,
        req.body.musicas_id,
        req.user!.tenantId!,
        req.body.artistas_musicas_id
    );
    res.status(201).json({ msg: "Música adicionada ao evento com sucesso", musica });
}
```

The pre-feature shape was `{ msg: string }` (looking at sibling actions
like `addIntegrante` at line 60 which still returns only `{ msg }`). The
feature changed it to `{ msg, musica }` — a breaking change to the
response contract by the letter of the TechSpec, even if no consumer
currently reads the new `musica` field.

Compounding this:

1. The frontend `AssociationResponseSchema` in `services/eventos.ts:27`
   is still `z.object({ msg: z.string() })`. Zod's default strip mode
   silently drops the `musica` field on every `addMusica` / `setMusicaVersao`
   response. The bytes traverse the wire for nothing.
2. The OpenAPI spec (see `packages/backend/docs/openapi.json` around the
   POST /eventos/:eventoId/musicas block) does describe the request body
   growth but — worth verifying — may not reflect the response shape
   change either.
3. This was already the state after task_02 / before review-001; the
   review-001 remediation preserved it intentionally (see the review-001
   finding #15 which was left unfixed). Flagging here so it is on record
   for a deliberate decision in round 002 rather than drifting forever.

### Sugestão de correção

Three options, pick one and apply consistently:

1. **Align implementation with TechSpec.** Drop the `musica` field from
   the 201 response on `addMusica` and from the 200 response on
   `setMusicaVersao`. Update the controllers to return `{ msg }` only.
   The frontend already invalidates the detail query on success, so the
   UI picks up the new state on the next read. Update the OpenAPI spec
   accordingly.

2. **Align TechSpec with implementation.** Edit
   `.compozy/tasks/copiar-escala-whatsapp/_techspec.md` to say the
   response shape IS expanded with the created/updated `MusicaEvento`,
   note the rationale (optimistic updates), and update
   `AssociationResponseSchema` on the frontend to accept and surface
   `musica` so consumers that want optimistic updates can use it.

3. **Split the schemas.** Keep `AssociationResponseSchema` for the
   integrante endpoints (which still return `{ msg }`) and introduce a
   `MusicaMutationResponseSchema` for the music endpoints that includes
   `musica`. This matches the reality that "association" is not one
   uniform thing.

Option 1 is the fastest way to zero out the spec drift. Option 2 is
correct if you want to use the payload. Option 3 is the most honest
model but adds a file.

## Triage

- Decision: `valid`
- Notes: The response shape deviation is confirmed. The frontend never consumes the `musica` field — hooks use only `data.msg` for toasts and then invalidate queries for fresh data. Option 1 (align implementation with TechSpec) is the correct fix: drop the unused `musica` field from both `addMusica` (201) and `setMusicaVersao` (200) responses.

## Fix Applied

- **Option chosen**: Option 1 — Align implementation with TechSpec.
- **Controller** (`eventos.controller.ts`): Both `addMusica` and `setMusicaVersao` now return `{ msg }` only. The service return value is awaited but not included in the response.
- **OpenAPI spec** (`openapi.json`): Updated PATCH `/eventos/{eventoId}/musicas/{musicaId}` response schema to `{ msg }` only (POST was already correct).
- **Test** (`eventos.service.test.ts`): Removed the artificial envelope construction test; replaced with a direct assertion on the service's `MusicaEvento` return shape.
- **Frontend**: No changes needed — `AssociationResponseSchema` already expects `{ msg }` only.

## Verification

- All 336 backend tests pass.
- OpenAPI spec is consistent with implementation.
