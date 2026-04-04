# Quickstart: Artista Opcional em Versão de Música

**Branch**: `024-optional-artist-versao`

## Pré-requisitos

- Docker rodando com container `louvorflow_db` ativo
- Node.js >= 18
- Dependências instaladas (`yarn install` na raiz)

## Ordem de Implementação

```text
1. Migration + Schema Prisma  →  prisma migrate dev + prisma generate
2. Backend Types              →  VersaoRaw, Musica nullable
3. Backend Validators         →  addVersaoBodySchema, updateVersaoBodySchema
4. Backend Repository         →  createVersao null, findVersaoWithoutArtist
5. Backend Service            →  addVersao, createComplete null-artist logic
6. Frontend Schemas           →  VersaoSchema, CreateVersaoFormSchema
7. Frontend Components        →  VersaoForm, MusicaDetail, MusicaForm
8. Tests                      →  Fakes, mocks, novos test cases
9. OpenAPI + Docstrings       →  openapi.json, JSDoc PT-BR
```

## Verificação

```bash
# 1. Migration
cd packages/backend && npx prisma migrate dev --name make_artista_id_optional

# 2. Typecheck
cd packages/backend && npx tsc --noEmit
cd packages/frontend && npx tsc --noEmit

# 3. Testes
cd packages/backend && npm test

# 4. Build frontend
cd packages/frontend && npm run build

# 5. Smoke tests (com servidor rodando)
# Criar versão sem artista
curl -X POST http://localhost:3333/api/musicas/<musicaId>/versoes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"bpm": 120, "cifras": "Am G"}'
# Esperado: 201, artista: null

# Tentar criar segunda versão sem artista (mesma música)
curl -X POST http://localhost:3333/api/musicas/<musicaId>/versoes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"bpm": 90, "cifras": "C G Am F"}'
# Esperado: 409, { "erro": "Registro duplicado", "codigo": 409 }

# Listar versões
curl http://localhost:3333/api/musicas/<musicaId>/versoes \
  -H "Authorization: Bearer <token>"
# Esperado: versão com artista: null na lista
```
