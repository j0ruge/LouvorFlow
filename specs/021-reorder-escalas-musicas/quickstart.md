# Quickstart: Reordenacao de Musicas na Escala

**Branch**: `021-reorder-escalas-musicas` | **Date**: 2026-03-24

## Pre-requisites

- Node.js >= 18
- Docker (para PostgreSQL)
- Yarn

## Setup

```bash
# 1. Checkout da branch
git checkout 021-reorder-escalas-musicas

# 2. Instalar dependencias (inclui @dnd-kit/core e @dnd-kit/sortable)
yarn install

# 3. Subir ambiente de desenvolvimento
./dev.sh

# 4. Aplicar migracao (se nao feito pelo dev.sh)
cd packages/backend && yarn prisma migrate dev
```

## Verificacao Rapida

### Backend

```bash
# 1. Criar uma escala com musicas (use a UI ou API)

# 2. Verificar que musicas retornam com campo 'ordem'
curl -s http://localhost:3000/api/eventos/<eventoId> \
  -H "Authorization: Bearer <token>" | jq '.musicas'

# 3. Reordenar musicas
curl -X PATCH http://localhost:3000/api/eventos/<eventoId>/musicas/reorder \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"musicas_ids": ["<uuid3>", "<uuid1>", "<uuid2>"]}'

# 4. Verificar nova ordem
curl -s http://localhost:3000/api/eventos/<eventoId> \
  -H "Authorization: Bearer <token>" | jq '.musicas[] | {nome, ordem}'
```

### Frontend

1. Acessar `http://localhost:8080`
2. Fazer login com `admin@louvorflow.com` / senha configurada
3. Navegar para uma escala com 3+ musicas
4. Verificar que cada card exibe badge de posicao (1, 2, 3)
5. Arrastar uma musica para nova posicao (mobile: long press + drag)
6. Recarregar pagina e confirmar que a ordem persistiu

## Arquivos Chave

| Camada | Arquivo | Mudanca |
|--------|---------|---------|
| Schema | `packages/backend/prisma/schema.prisma` | Campo `ordem` em `Eventos_Musicas` |
| Repository | `packages/backend/src/repositories/eventos.repository.ts` | `reorderMusicas()`, orderBy em queries |
| Service | `packages/backend/src/services/eventos.service.ts` | `reorderMusicas()` com validacao |
| Controller | `packages/backend/src/controllers/eventos.controller.ts` | Handler `reorderMusicas()` |
| Routes | `packages/backend/src/routes/eventos.routes.ts` | `PATCH /:eventoId/musicas/reorder` |
| Validators | `packages/backend/src/validators/eventos.validators.ts` | `reorderMusicasBodySchema` |
| Types | `packages/backend/src/types/index.ts` | `EVENTO_SHOW_SELECT` com `ordem` |
| Frontend Comp | `packages/frontend/src/components/EventoDetail.tsx` | DnD sortable list |
| Frontend Hook | `packages/frontend/src/hooks/use-eventos.ts` | `useReorderMusicas()` |
| Frontend Svc | `packages/frontend/src/services/eventos.ts` | `reorderMusicas()` |
| OpenAPI | `packages/backend/docs/openapi.json` | Novo endpoint + campo `ordem` |
