# API Contract: Composite Music Creation & Update

**Feature**: `008-enhanced-musica-form`
**Date**: 2026-02-21

## POST /api/musicas/complete

Creates a music and optionally its default version in a single atomic transaction.

### Request Body

```json
{
  "nome": "Grande é o Senhor",
  "fk_tonalidade": "uuid-of-tonalidade",
  "artista_id": "uuid-of-artista",
  "bpm": 120,
  "cifras": "C G Am F ...",
  "lyrics": "Grande é o Senhor...",
  "link_versao": "https://youtube.com/watch?v=..."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| nome | string | **Yes** | Music name |
| fk_tonalidade | UUID | No | FK to tonalidades. If omitted, music is created without tonalidade reference. |
| artista_id | UUID | Conditional | Required if any version field (bpm, cifras, lyrics, link_versao) is provided |
| bpm | integer | No | Beats per minute |
| cifras | string | No | Chord chart |
| lyrics | string | No | Song lyrics |
| link_versao | string (URL) | No | Reference audio/video link |

### Validation Rules

1. `nome` is always required — return 400 if missing.
2. If `artista_id` is provided → create version record with all version fields.
3. If `artista_id` is omitted but version fields are present → return 400 with error: `"Artista é obrigatório para criar uma versão"`.
4. If `artista_id` is omitted and no version fields → create music only (no version).
5. `fk_tonalidade` must reference an existing tonalidade if provided → return 400 if not found.
6. `artista_id` must reference an existing artista if provided → return 400 if not found.

### Response — 201 Created

```json
{
  "msg": "Música criada com sucesso",
  "musica": {
    "id": "uuid",
    "nome": "Grande é o Senhor",
    "tonalidade": { "id": "uuid", "tom": "C" },
    "versoes": [
      {
        "id": "uuid",
        "artista": { "id": "uuid", "nome": "Adhemar de Campos" },
        "bpm": 120,
        "cifras": "C G Am F ...",
        "lyrics": "Grande é o Senhor...",
        "link_versao": "https://youtube.com/watch?v=..."
      }
    ],
    "categorias": [],
    "funcoes": []
  }
}
```

### Error Responses

**400 Bad Request** — validation failure:

```json
{
  "erro": "Nome é obrigatório",
  "codigo": 400
}
```

```json
{
  "erro": "Artista é obrigatório para criar uma versão",
  "codigo": 400
}
```

**400 Bad Request** — referenced entity not found:

```json
{
  "erro": "Tonalidade não encontrada",
  "codigo": 400
}
```

**409 Conflict** — duplicate version (same artista + musica):

```json
{
  "erro": "Versão duplicada para este artista",
  "codigo": 409
}
```

---

## PUT /api/musicas/:id/complete

Updates a music and its default version (oldest by `created_at`) in a single atomic transaction.

### Request Body

```json
{
  "nome": "Grande é o Senhor (updated)",
  "fk_tonalidade": "uuid-of-new-tonalidade",
  "versao_id": "uuid-of-default-versao",
  "artista_id": "uuid-of-artista",
  "bpm": 130,
  "cifras": "D A Bm G ...",
  "lyrics": "Grande é o Senhor (updated)...",
  "link_versao": "https://youtube.com/watch?v=new"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| nome | string | **Yes** | Updated music name |
| fk_tonalidade | UUID | No | Updated tonalidade FK |
| versao_id | UUID | No | ID of the version to update (the default version) |
| artista_id | UUID | No | Artista for the version (read-only context — not changed) |
| bpm | integer | No | Updated BPM |
| cifras | string | No | Updated chord chart |
| lyrics | string | No | Updated lyrics |
| link_versao | string (URL) | No | Updated reference link |

### Validation Rules

1. `nome` is always required.
2. Music with `:id` must exist → return 404 if not found.
3. If `versao_id` is provided, update that version's fields (bpm, cifras, lyrics, link_versao).
4. If `versao_id` is not provided, only update the music fields (nome, fk_tonalidade).
5. `fk_tonalidade` must reference an existing tonalidade if provided.

### Response — 200 OK

```json
{
  "msg": "Música editada com sucesso",
  "musica": {
    "id": "uuid",
    "nome": "Grande é o Senhor (updated)",
    "tonalidade": { "id": "uuid", "tom": "D" },
    "versoes": [
      {
        "id": "uuid",
        "artista": { "id": "uuid", "nome": "Adhemar de Campos" },
        "bpm": 130,
        "cifras": "D A Bm G ...",
        "lyrics": "Grande é o Senhor (updated)...",
        "link_versao": "https://youtube.com/watch?v=new"
      }
    ],
    "categorias": [],
    "funcoes": []
  }
}
```

### Error Responses

**404 Not Found**:

```json
{
  "erro": "Música não encontrada",
  "codigo": 404
}
```

**400 Bad Request**:

```json
{
  "erro": "Nome é obrigatório",
  "codigo": 400
}
```

---

## Existing Endpoints (unchanged)

The following existing endpoints remain unchanged and continue to work as before:

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/tonalidades | Create a new tonalidade (used by inline combobox creation) |
| POST | /api/artistas | Create a new artista (used by inline combobox creation) |
| GET | /api/tonalidades | List all tonalidades (used by combobox options) |
| GET | /api/artistas | List all artistas (used by combobox options) |
| GET | /api/musicas/:id | Get music detail with relations (used by edit form pre-fill) |
| POST | /api/musicas/:musicaId/versoes | Add version (existing flow, still available) |
