# Data Model: Enhanced Music Registration Form

**Feature**: `008-enhanced-musica-form`
**Date**: 2026-02-21

## Entities Involved

This feature does **not** introduce new entities or schema changes. It composes existing entities in a new way through a composite API endpoint and expanded frontend form.

### Musicas (Music — the composition)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID v4 | PK, auto-generated | |
| nome | string | required | Only required field in the unified form |
| fk_tonalidade | UUID | FK → tonalidades.id, required at DB level | Optional in unified form (set via combobox) |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relationships**:
- `musicas.fk_tonalidade → tonalidades.id` (many-to-one, CASCADE)
- `musicas → artistas_musicas` (one-to-many, CASCADE)

### Artistas_Musicas (Version — an artist's arrangement)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID v4 | PK, auto-generated | |
| artista_id | UUID | FK → artistas.id, required | Set via creatable combobox |
| musica_id | UUID | FK → musicas.id, required | Set by the composite endpoint |
| bpm | int | optional | Beats per minute |
| cifras | string | optional | Chord chart (free text) |
| lyrics | string | optional | Song lyrics (free text) |
| link_versao | string | optional | URL to reference audio/video |
| created_at | timestamp | auto | Used to determine "default version" (oldest) |
| updated_at | timestamp | auto | |

**Constraints**:
- `UNIQUE(artista_id, musica_id)` — one version per artist per music

**Relationships**:
- `artistas_musicas.artista_id → artistas.id` (many-to-one, CASCADE)
- `artistas_musicas.musica_id → musicas.id` (many-to-one, CASCADE)

### Tonalidades (Musical key — lookup entity)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID v4 | PK, auto-generated | |
| tom | string | required, UNIQUE | Created inline via combobox |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Inline creation behavior**: If the user types a value not in the list, the combobox calls `POST /api/tonalidades` to create it. If the value already exists (unique violation), the existing record is selected instead.

### Artistas (Artist — lookup entity)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID v4 | PK, auto-generated | |
| nome | string | required, UNIQUE | Created inline via combobox |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Inline creation behavior**: Same pattern as tonalidades — if the user types a name not in the list, `POST /api/artistas` creates it. Duplicate names resolve to the existing record.

## Entity Relationships Diagram

```text
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│ Tonalidades  │       │     Musicas      │       │  Artistas    │
│              │       │                  │       │              │
│  id (PK)     │◄──────│  fk_tonalidade   │       │  id (PK)     │
│  tom (UQ)    │  M:1  │  id (PK)         │       │  nome (UQ)   │
└──────────────┘       │  nome            │       └──────┬───────┘
                       └────────┬─────────┘              │
                                │ 1:N                    │
                                ▼                        │
                       ┌──────────────────┐              │
                       │ Artistas_Musicas │              │
                       │   (Versão)       │              │
                       │                  │   M:1        │
                       │  id (PK)         │──────────────┘
                       │  musica_id (FK)  │
                       │  artista_id (FK) │
                       │  bpm             │
                       │  cifras          │
                       │  lyrics          │
                       │  link_versao     │
                       │  UQ(artista,     │
                       │     musica)      │
                       └──────────────────┘
```

## Composite Creation Flow

```text
1. Frontend submits unified form payload to POST /api/musicas/complete
2. Backend (inside transaction):
   a. Validate payload (nome required; if version fields present, artista_id required)
   b. Create musica record (nome, fk_tonalidade)
   c. If artista_id provided → create artistas_musicas record (artista_id, musica_id, bpm, cifras, lyrics, link_versao)
   d. Return complete musica with relations
3. Frontend redirects to /musicas/:id (detail page)
```

## Default Version Concept

The "versão padrão" (default version) is not a database field but a convention:
- It is the **oldest** `artistas_musicas` record for a given music, determined by `created_at ASC`.
- When the unified form creates a music with version data, that version becomes the default by virtue of being the first (and initially only) version.
- The edit form pre-populates with this default version's data.
- No `is_default` column is needed — the ordering is derived from existing timestamps.
