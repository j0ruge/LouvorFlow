# Quickstart: Enhanced Music Registration Form

**Feature**: `008-enhanced-musica-form`
**Date**: 2026-02-21

## Prerequisites

1. PostgreSQL running via Docker Compose:

```bash
docker compose -f infra/postgres/docker-compose.yml up -d
```

2. Backend running:

```bash
cd packages/backend
npm run dev
```

3. Frontend running:

```bash
cd packages/frontend
npm run dev
```

## Manual Testing Checklist

### 1. Composite Creation — Music Only (no version)

```bash
curl -X POST http://localhost:3000/api/musicas/complete \
  -H "Content-Type: application/json" \
  -d '{"nome": "Teste Música Simples"}'
```

**Expected**: 201 with `musica` object containing `nome`, empty `versoes` array, null `tonalidade`.

### 2. Composite Creation — Full (music + version)

First, get a tonalidade ID and artista ID:

```bash
curl http://localhost:3000/api/tonalidades
curl http://localhost:3000/api/artistas
```

Then create:

```bash
curl -X POST http://localhost:3000/api/musicas/complete \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Música Completa",
    "fk_tonalidade": "<tonalidade-uuid>",
    "artista_id": "<artista-uuid>",
    "bpm": 120,
    "cifras": "C G Am F",
    "lyrics": "Letra da música...",
    "link_versao": "https://example.com/video"
  }'
```

**Expected**: 201 with `musica` object containing `versoes` array with one entry.

### 3. Validation — Version Fields Without Artista

```bash
curl -X POST http://localhost:3000/api/musicas/complete \
  -H "Content-Type: application/json" \
  -d '{"nome": "Teste Validação", "bpm": 120}'
```

**Expected**: 400 with `"Artista é obrigatório para criar uma versão"`.

### 4. Validation — Missing Nome

```bash
curl -X POST http://localhost:3000/api/musicas/complete \
  -H "Content-Type: application/json" \
  -d '{"bpm": 120}'
```

**Expected**: 400 with `"Nome é obrigatório"`.

### 5. Composite Update

```bash
curl -X PUT http://localhost:3000/api/musicas/<musica-uuid>/complete \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Nome Atualizado",
    "fk_tonalidade": "<new-tonalidade-uuid>",
    "versao_id": "<versao-uuid>",
    "bpm": 130
  }'
```

**Expected**: 200 with updated `musica` and version data.

### 6. Inline Tonalidade Creation (existing endpoint, used by combobox)

```bash
curl -X POST http://localhost:3000/api/tonalidades \
  -H "Content-Type: application/json" \
  -d '{"tom": "F#m"}'
```

**Expected**: 201 with new tonalidade. Verify it appears in `GET /api/tonalidades`.

### 7. Inline Artista Creation (existing endpoint, used by combobox)

```bash
curl -X POST http://localhost:3000/api/artistas \
  -H "Content-Type: application/json" \
  -d '{"nome": "Fernandinho"}'
```

**Expected**: 201 with new artista. Verify it appears in `GET /api/artistas`.

## Frontend Testing

### Smoke Test — Creation Flow

1. Open `http://localhost:5173/musicas`
2. Click "Nova Música"
3. Verify the form shows all fields: nome, tonalidade (combobox), artista (combobox), BPM, cifra, letra, link
4. Fill only `nome` → Submit → Verify music created, redirected to detail page
5. Click "Nova Música" again
6. Fill all fields including tonalidade and artista from existing lists → Submit → Verify music + version created

### Smoke Test — Inline Creation

1. Open music creation form
2. In tonalidade combobox, type a value that doesn't exist (e.g., "Bbm")
3. Verify "Criar Bbm" option appears → Click it
4. Verify "Bbm" is now selected and a toast confirms creation
5. Repeat for artista combobox with a new artist name

### Smoke Test — Edit Flow

1. Navigate to a music detail page that has a version
2. Open the edit form
3. Verify all fields are pre-populated (nome, tonalidade, artista, BPM, etc.)
4. Change the BPM → Save → Verify the change persisted

### Smoke Test — Validation

1. Open music creation form
2. Fill BPM but leave artista empty → Submit
3. Verify blocking validation message appears about artista requirement
4. Leave nome empty → Submit → Verify "nome obrigatório" validation
