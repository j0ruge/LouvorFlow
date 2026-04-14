# TechSpec: Share Schedule to WhatsApp

## Executive Summary

This TechSpec implements the feature defined in `_prd.md`: a `Compartilhar`
action group on the escala detail page that copies a WhatsApp-formatted
message of the schedule to the clipboard or opens `wa.me/?text=…` directly,
gated on `escalas.write`. To make the link in each song line meaningful, the
backend gains a per-escala "selected version" field on `eventos_musicas`
referencing `artistas_musicas`, and a new `PATCH
/api/eventos/:id/musicas/:musicaId` endpoint to update that selection. The
escala detail response (`GET /api/eventos/:id`) is extended to inline both
the selected version and the full list of available versions per song so the
picker UI is fed in a single round-trip.

The primary trade-off: we accept a small payload increase on `EventoShow`
(<10 KB worst case) in exchange for zero extra round-trips on page load and
on share click — the formatter is a pure frontend function, and both copy
and wa.me actions run synchronously on click.

## System Architecture

### Component Overview

| Component | Layer | Responsibility |
|---|---|---|
| `eventos_musicas.fk_artistas_musicas` | DB schema | Nullable FK pointing to the chosen `Artistas_Musicas` row for that escala-song pair |
| `EVENTO_SHOW_SELECT` (extended) | Backend types | Adds `eventos_musicas_artistas_musicas_fkey` (selected) and nested `musicas.Artistas_Musicas[]` (available) |
| `formatEventoShow` (modified) | Backend service | Flattens new fields into `MusicaEvento.versao_selecionada` and `MusicaEvento.versoes_disponiveis` |
| `setMusicaVersao` | Backend service+repo | Validates that the version belongs to the music and persists the new FK |
| `PATCH /api/eventos/:id/musicas/:musicaId` | Backend route | Single-purpose endpoint for the picker mutation |
| `MusicaEventoSchema` (extended) | Frontend Zod | Adds `versao_selecionada` and `versoes_disponiveis` |
| `useSetMusicaVersao(eventoId)` | Frontend hook | React Query mutation; invalidates `["eventos", eventoId]` |
| `MusicaVersaoPicker` | Frontend UI | Badge + Popover with radio list of available versions |
| `formatEscalaWhatsApp` | Frontend util | Pure function: `(EventoShow) => string`, fully unit-tested |
| `EscalaShareActions` | Frontend UI | Two buttons in the EventoDetail header: "Copiar" + "WhatsApp" |

Data flow on page open:

`EventoDetail.tsx` → `useEvento(id)` → `GET /api/eventos/:id` → backend
joins `eventos_musicas` ↔ `musicas` ↔ `artistas_musicas` (selected + all)
→ `formatEventoShow` flattens → frontend renders cards. The picker reads
versions directly from the in-memory cache; no extra fetch.

Data flow on version change:

User clicks the version badge → Popover renders the radio list → user
selects → `useSetMusicaVersao` fires `PATCH …/musicas/:musicaId` →
React Query invalidates `["eventos", eventoId]` → cache refetches → cards
re-render with the new selection.

Data flow on share click:

User clicks "Copiar" or "WhatsApp" → handler reads the cached `EventoShow`
→ `formatEscalaWhatsApp(evento)` returns the string → either
`navigator.clipboard.writeText(text)` (with toast) or
`window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank')`.

## Implementation Design

### Core Interfaces

```ts
// packages/frontend/src/lib/whatsapp-share.ts
import type { EventoShow } from "@/schemas/evento";

export function formatEscalaWhatsApp(evento: EventoShow): string;

export function buildWhatsAppShareUrl(message: string): string;

export async function copyEscalaToClipboard(
  evento: EventoShow,
): Promise<void>;
```

```ts
// packages/frontend/src/schemas/evento.ts (additions)
export const VersaoMusicaSchema = z.object({
  id: z.string().uuid(),
  artista_nome: z.string().nullable(),
  link_versao: z.string().nullable(),
});

export const MusicaEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
  ordem: z.number().int(),
  versao_selecionada: VersaoMusicaSchema.nullable(),
  versoes_disponiveis: z.array(VersaoMusicaSchema),
});
```

```ts
// packages/backend/src/validators/eventos.validators.ts (addition)
export const setMusicaVersaoBodySchema = z.object({
  artistas_musicas_id: z.string().uuid().nullable(),
});
```

### Data Models

**Schema change** (`packages/backend/prisma/schema.prisma`):

```prisma
model Eventos_Musicas {
  // existing fields...
  fk_artistas_musicas String? @db.Uuid

  eventos_musicas_artistas_musicas_fkey Artistas_Musicas? @relation(
    fields: [fk_artistas_musicas],
    references: [id],
    onDelete: SetNull,
    onUpdate: NoAction
  )

  @@index([fk_artistas_musicas])
}
```

`onDelete: SetNull` keeps the escala-song row intact if the version is
deleted from the catalog. The field is nullable so existing rows do not
need backfill.

**Migration**: `prisma/migrations/<timestamp>_add_eventos_musicas_versao_fk/`
created via `npx prisma migrate dev --name add_eventos_musicas_versao_fk`.

**Updated `MusicaEvento` API shape**:

```jsonc
{
  "id": "uuid",
  "nome": "Lugar Secreto",
  "tonalidade": { "id": "uuid", "tom": "G" },
  "ordem": 1,
  "versao_selecionada": {
    "id": "uuid",
    "artista_nome": "Gabriela Rocha",
    "link_versao": "https://youtu.be/..."
  },
  "versoes_disponiveis": [
    { "id": "uuid", "artista_nome": "Gabriela Rocha", "link_versao": "https://youtu.be/..." },
    { "id": "uuid", "artista_nome": null, "link_versao": null }
  ]
}
```

### API Endpoints

**Modified — `GET /api/eventos/:id`**

- No URL change. Response gains `versao_selecionada` and
  `versoes_disponiveis` on each item of `musicas[]`.
- OpenAPI spec at `packages/backend/docs/openapi.json` updated.

**New — `PATCH /api/eventos/:eventoId/musicas/:musicaId`**

- Auth: `ensureAuthenticated → ensureTenantContext → can(['escalas.write']) → validateRequest`.
- Body: `{ artistas_musicas_id: string | null }` (UUID of the chosen
  version, or `null` to clear).
- Service validation:
  1. The escala exists in the active tenant.
  2. The `eventos_musicas` row exists for `(eventoId, musicaId)`.
  3. If `artistas_musicas_id` is non-null: the `Artistas_Musicas` row
     exists, belongs to the active tenant, and its `musica_id` equals
     `musicaId`.
- Repo: single `update()` on `eventos_musicas`.
- Response: `200 { msg: 'Versão atualizada', musica: <updated MusicaEvento> }`
  (consistent with the existing `addMusica` response style).
- Errors: `404` if escala/song row missing, `400` if version belongs to
  another song, standard `AppError` envelope.

**Modified — `POST /api/eventos/:eventoId/musicas`**

- Body grows by one optional field: `artistas_musicas_id?: string | null`.
- If supplied, the new row is created with the FK already set; otherwise it
  defaults to NULL and the leader can set it later via PATCH.
- Same validation rules as the PATCH for the version field.
- Response shape unchanged (still returns the created entry).

## Integration Points

**WhatsApp (wa.me deep link)** — outbound only, no API key, no callback.
The frontend opens `https://wa.me/?text=<encoded>` in a new browser tab.
WhatsApp Web/Desktop/Mobile receives the text and lets the user pick the
destination. There is no auth, no rate limit, and no error channel from
WhatsApp back to LouvorFlow — the integration is fire-and-forget. The
TechSpec assumes the production site stays HTTPS so `navigator.clipboard`
remains available.

## Impact Analysis

| Component | Impact Type | Description and Risk | Required Action |
|---|---|---|---|
| `prisma/schema.prisma` | modified | Adds nullable FK column + index. Low risk. | Generate migration `add_eventos_musicas_versao_fk` |
| `EVENTO_SHOW_SELECT` (`src/types/index.ts`) | modified | Adds two nested selects. Low risk; bounded payload growth. | Update select projection |
| `eventos.service.ts` `formatEventoShow` | modified | Flattens new fields. Low risk. | Update mapper + add `setMusicaVersao` service method |
| `eventos.repository.ts` | modified | New `setMusicaVersao` repo method; `createMusica` accepts optional version. | Add methods |
| `eventos.controller.ts` | modified | New `setMusicaVersao` action; `addMusica` reads new optional body field. | Add action |
| `eventos.routes.ts` | modified | New `PATCH /:eventoId/musicas/:musicaId` route. | Wire route |
| `eventos.validators.ts` | modified | New `setMusicaVersaoBodySchema`; `addMusicaBodySchema` extended. | Add schema |
| `eventos.service.test.ts` | modified | New tests for `setMusicaVersao` and the optional version on `addMusica`. | Add tests |
| `docs/openapi.json` | modified | New PATCH operation; updated `EventoShow` and `MusicaEvento` schemas. | Update spec |
| `schemas/evento.ts` (frontend) | modified | New `VersaoMusicaSchema`, two new `MusicaEventoSchema` fields. | Update Zod |
| `services/eventos.ts` (frontend) | modified | New `setMusicaVersao(eventoId, musicaId, versaoId)` API call. | Add function |
| `hooks/use-eventos.ts` | modified | New `useSetMusicaVersao(eventoId)` mutation hook. | Add hook |
| `components/EventoDetail.tsx` | modified | `SortableMusicaCard` renders the new version badge; header gains `EscalaShareActions`. | Edit JSX |
| `components/MusicaVersaoPicker.tsx` | new | Badge + Popover with radio list. | Create component |
| `components/EscalaShareActions.tsx` | new | Two buttons in the header. | Create component |
| `lib/whatsapp-share.ts` | new | Pure formatter + share helpers. | Create module |
| `lib/whatsapp-share.test.ts` | new | Vitest unit tests for the formatter. | Create tests |
| `vitest.config.ts` (frontend) | new | First Vitest config in the frontend package. | Create config + script |
| `package.json` (frontend) | modified | Adds `vitest` devDep and `test`/`test:watch` scripts. | Edit |

## Testing Approach

### Unit Tests

**Backend (`packages/backend/tests/services/eventos.service.test.ts`)** —
extends the existing fakes-based suite:

- `setMusicaVersao` happy path: persists the FK and returns the updated
  `MusicaEvento`.
- `setMusicaVersao` rejects when the escala-song row does not exist (404).
- `setMusicaVersao` rejects when `artistas_musicas_id` belongs to a
  different music (400).
- `setMusicaVersao` accepts `null` to clear the selection.
- `addMusica` with optional `artistas_musicas_id` persists it on creation.
- `addMusica` ignores an absent version field (existing behavior preserved).
- `formatEventoShow` flattens both new fields when they are present and
  null when they are not.

The fake repo (`tests/fakes/eventos.fake.ts`) gains two methods:
`setMusicaVersao` and a richer `findById` that returns the new shape.

**Frontend (`packages/frontend/src/lib/whatsapp-share.test.ts`)** — new
Vitest suite covering the pure formatter:

- Full escala (header + songs with keys + links + members with multiple
  functions) renders the canonical layout byte-for-byte.
- Song without `tonalidade` omits the `(<Tom>)` segment.
- Song without `versao_selecionada` omits the link line.
- Song whose `versao_selecionada.link_versao` is null omits the link line.
- Member without functions renders as plain `<Nome>` (no trailing dash).
- Empty escala renders headers with `(0)` counts and no body lines.
- Date is formatted with `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })` and surrounded by `_` (italic markdown).

### Integration Tests

No new integration tests. The backend already validates the request flow
through the existing controller-service-fake-repo chain. A manual smoke
test (per `dev-workflow.md`) is mandatory before merge:

1. `npx prisma migrate dev` → `npm run dev` (backend) → `npm run dev` (frontend).
2. Open an escala in `/escalas`, add a song that has 2+ versions, pick one,
   reload — confirm the choice persists.
3. Click "Copiar texto" → paste into a scratchpad → confirm the layout
   matches the PRD spec.
4. Click "Abrir no WhatsApp" → WhatsApp Web opens with the same text
   pre-filled.
5. Test on a 30-song synthetic escala to validate the wa.me URL length
   does not get truncated on Chrome desktop, Chrome Android, Safari iOS
   (per PRD risk).

## Development Sequencing

### Build Order

1. **Schema migration** — add `fk_artistas_musicas` column + index to
   `eventos_musicas`. _No dependencies._
2. **Run `npx prisma generate`** — refresh the Prisma Client so the new
   field exists in TypeScript types. _Depends on step 1._
3. **Backend types & projection** — extend `EVENTO_SHOW_SELECT` and the
   `MusicaEvento` mapping in `formatEventoShow`. _Depends on step 2._
4. **Backend write path** — `eventos.repository.ts` `setMusicaVersao` +
   optional version on `createMusica`; `eventos.service.ts` validation;
   `eventos.controller.ts` action; `eventos.validators.ts` schema;
   `eventos.routes.ts` PATCH route. _Depends on step 2._
5. **Backend tests** — extend `eventos.service.test.ts` and
   `tests/fakes/eventos.fake.ts`. _Depends on steps 3-4._
6. **OpenAPI spec update** — `packages/backend/docs/openapi.json` reflects
   the new PATCH operation, the `addMusica` body change, and the new
   fields on `MusicaEvento`. _Depends on steps 3-4._
7. **Frontend Zod & service & hook** — extend `MusicaEventoSchema`, add
   `setMusicaVersao` in `services/eventos.ts`, add
   `useSetMusicaVersao(eventoId)` in `hooks/use-eventos.ts`. _Depends on
   step 6 (contract) but can be implemented in parallel._
8. **`MusicaVersaoPicker` component** — badge + Popover with radio list,
   wired to `useSetMusicaVersao`. Auto-select when only one version
   exists; render nothing when zero. _Depends on step 7._
9. **Wire picker into `SortableMusicaCard`** in `EventoDetail.tsx` next to
   the tonalidade badge. _Depends on step 8._
10. **`lib/whatsapp-share.ts` + Vitest config + tests** — pure formatter
    and unit tests. Frontend Vitest bootstrap (config + npm script).
    _Depends only on step 7's schema changes._
11. **`EscalaShareActions` component** — two buttons (`Copiar` /
    `WhatsApp`) using the formatter from step 10 and the cached
    `EventoShow` from `useEvento`. Toast feedback via Sonner. _Depends on
    step 10._
12. **Wire `EscalaShareActions` into `EventoDetail.tsx` header**, gated
    on `canWrite`. _Depends on step 11._
13. **Smoke test** following the manual checklist in Testing Approach.
    _Depends on all prior steps._
14. **Documentation refresh** — update `MEMORY.md` if patterns change,
    `.claude/rules/backend-api.md` if new conventions appear,
    `README.md` if user-visible features warrant it. _Depends on step 13._

### Technical Dependencies

- PostgreSQL must be reachable for the migration (the dev container
  `louvorflow_db` is the standard target).
- `npx prisma generate` must complete before any TypeScript compile that
  references the new field.
- Frontend Vitest is being introduced for the first time — no blocking
  dependency, but the TechSpec assumes it will be added in step 10.

## Monitoring and Observability

No new metrics or alerts are introduced. The feature is fully
client-driven on the share path; the only new server surface is one PATCH
endpoint that uses the existing centralised error handler and request
logging in `app.ts`. If adoption analytics become desirable later (per PRD
success metrics), instrumentation belongs to a follow-up task.

For the manual smoke test, the existing backend log stream
(`npm run dev`) and browser devtools console are sufficient.

## Technical Considerations

### Key Decisions

- **Decision**: Single nullable FK `fk_artistas_musicas` on
  `eventos_musicas` over a separate `eventos_musicas_versoes` table.
  **Rationale**: 1:1 relationship between escala-song and chosen version;
  a join table would be over-engineering.
  **Trade-offs**: Cannot record a history of selection changes — accepted.
  **Rejected alternatives**: Separate table; JSON column.

- **Decision**: Inline versions in EventoShow (per ADR-002).
  **Rationale**: One round-trip on page open, zero on share. Payload growth
  is bounded.
  **Trade-offs**: Slightly larger response.
  **Rejected alternatives**: Lazy fetch; bulk endpoint.

- **Decision**: Frontend pure formatter (per ADR-003).
  **Rationale**: Snappy UX, easy to unit-test, decoupled from React.
  **Trade-offs**: A future server-side broadcast feature would need its
  own formatter.
  **Rejected alternatives**: Inline in component; backend endpoint.

- **Decision**: Dedicated `PATCH …/musicas/:musicaId` endpoint over
  upsert-on-POST.
  **Rationale**: Clean REST semantics; controller logic stays single-purpose.
  **Trade-offs**: One more route file entry.
  **Rejected alternatives**: POST-as-upsert; DELETE+POST cycle.

- **Decision**: Badge + Popover picker over inline `<Select>` or
  separate edit dialog.
  **Rationale**: Compact, mobile-friendly, matches the existing badge
  vocabulary in `SortableMusicaCard`, no card-height growth.
  **Trade-offs**: Slightly more JS than a native select.
  **Rejected alternatives**: Inline shadcn `<Select>`; modal dialog.

### Known Risks

- **Risk**: `wa.me/?text=` URL length truncation on very large escalas
  (high severity if it bites; low likelihood for typical 4-10 song
  escalas).
  **Mitigation**: Smoke test step 5 verifies a 30-song synthetic escala on
  the three target browsers. If truncation is observed, fall back to a
  toast that warns the leader to use "Copiar texto" instead.

- **Risk**: `navigator.clipboard.writeText` denied or unavailable
  (insecure context, older browser).
  **Mitigation**: Catch the rejection and toast
  `Não foi possível copiar. Use o botão "Abrir no WhatsApp".`. The wa.me
  path keeps working independently.

- **Risk**: Existing `eventos_musicas` rows have `fk_artistas_musicas =
  NULL` after migration; their share messages have no link.
  **Mitigation**: Acceptable per ADR-001. Auto-select when a song has
  exactly one version covers the most common case.

- **Risk**: Prisma `select` over `Artistas_Musicas` accidentally pulls
  `cifras` / `lyrics` / `bpm` (large blobs).
  **Mitigation**: The select projection is explicit — only `id`,
  `artista_id → artista.nome`, and `link_versao` are returned.

## Architecture Decision Records

- [ADR-001: Per-escala song version selection over global primary version](adrs/adr-001.md) — The link in the shared message comes from a version chosen on the escala-song relationship, not a global primary version on the song catalog.
- [ADR-002: Inline `Artistas_Musicas` versions in the EventoShow response](adrs/adr-002.md) — The escala detail endpoint returns selected version + full version list inline so the picker has zero round-trips.
- [ADR-003: Pure frontend formatter for the WhatsApp message](adrs/adr-003.md) — `formatEscalaWhatsApp(EventoShow): string` lives in `lib/whatsapp-share.ts`, fully unit-tested with Vitest.
