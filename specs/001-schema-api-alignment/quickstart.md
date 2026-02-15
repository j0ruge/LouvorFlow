# Quickstart: Schema & API Alignment

**Feature**: 001-schema-api-alignment
**Prerequisites**: Docker running, Node.js LTS installed

## 1. Start Database

```bash
cd infra/postgres
docker compose up -d
```

Verify: `docker ps` should show `louvorflow_db` on port 35432.

## 2. Install Dependencies

```bash
cd src/backend
npm install
```

## 3. Run Migration

After Prisma schema changes are applied:

```bash
cd src/backend
npx prisma migrate dev --name add_tags_telefone_uniques
```

This creates the `tags` and `musicas_tags` tables, adds `telefone` to `integrantes`, and adds unique constraints to lookup tables.

## 4. Generate Prisma Client

```bash
cd src/backend
npx prisma generate
```

## 5. Start Backend

```bash
cd src/backend
npm run dev
```

Server starts at `http://localhost:3000`.

## 6. Verify Endpoints

```bash
# Health check
curl http://localhost:3000/

# Base entities (all should return 200 with empty arrays)
curl http://localhost:3000/api/artistas
curl http://localhost:3000/api/musicas
curl http://localhost:3000/api/integrantes
curl http://localhost:3000/api/funcoes
curl http://localhost:3000/api/tags
curl http://localhost:3000/api/tonalidades
curl http://localhost:3000/api/tipos-eventos
curl http://localhost:3000/api/eventos

# Verify old paths no longer work (should return 404)
curl http://localhost:3000/artistas
```

## 7. Quick Smoke Test (create flow)

```bash
# Create a tonalidade
curl -X POST http://localhost:3000/api/tonalidades \
  -H "Content-Type: application/json" \
  -d '{"tom": "C"}'

# Create a tag
curl -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -d '{"nome": "Adoração"}'

# Create a musica (use the tonalidade id from step above)
# → Copy the `id` field from the tonalidade response and replace <TONALIDADE_ID>
curl -X POST http://localhost:3000/api/musicas \
  -H "Content-Type: application/json" \
  -d '{"nome": "Reckless Love", "fk_tonalidade": "<TONALIDADE_ID>"}'

# Tag the musica (use the tag id and musica id from above)
# → Copy the `id` from the musica response → <MUSICA_ID>, and from the tag response → <TAG_ID>
curl -X POST http://localhost:3000/api/musicas/<MUSICA_ID>/tags \
  -H "Content-Type: application/json" \
  -d '{"tag_id": "<TAG_ID>"}'

# Verify musica returns with relations
# → Reuse the same <MUSICA_ID> from above
curl http://localhost:3000/api/musicas/<MUSICA_ID>
# Should include tonalidade and tags in response
```

## 8. Start Frontend

```bash
cd src/frontend
npm run dev
```

Verify: Open browser, sidebar should show "LouvorFlow" (not "EscalaCanto").

## Key Files Modified

| File | Change |
|------|--------|
| `src/backend/prisma/schema.prisma` | Added Tags, Musicas_Tags, telefone, unique constraints |
| `src/backend/index.js` | Fixed imports, removed duplicate middleware |
| `src/backend/src/app.js` | Fixed imports, added CORS, /api prefix, all routes |
| `src/backend/src/controllers/*` | 6 new + 2 refactored controllers |
| `src/backend/src/routes/*` | 6 new + 1 modified route files |
| `src/frontend/src/components/AppSidebar.tsx` | "EscalaCanto" → "LouvorFlow" |
| `src/frontend/src/pages/*.tsx` | Mock data shapes aligned to ER model |
