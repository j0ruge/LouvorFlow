# Quickstart: Intensidade de Música

## Pré-requisitos

- Backend rodando (`npm run dev` em `packages/backend`)
- Frontend rodando (`npm run dev` em `packages/frontend`)
- PostgreSQL acessível via Docker Compose

## Implementação resumida

### 1. Backend — Prisma migration

```bash
cd packages/backend
# Adicionar campo intensidade ao schema.prisma (Artistas_Musicas model)
npx prisma migrate dev --name add_intensidade_to_artistas_musicas
npx prisma generate
```

### 2. Backend — Camadas a atualizar

1. **Prisma schema**: Adicionar `intensidade String?` ao model `Artistas_Musicas`
2. **Types** (`src/types/index.ts`): Adicionar `intensidade` a `VersaoRaw`, `CreateMusicaCompleteInput`, `UpdateMusicaCompleteInput`, `Musica`, `MUSICA_SELECT`
3. **Validators** (`src/validators/musicas.validators.ts`): Adicionar `intensidade: z.enum(["calma", "media", "agitada"]).optional()` aos 4 schemas
4. **Repository** (`src/repositories/musicas.repository.ts`): Adicionar `intensidade: true` nos selects e nos dados de criação/atualização
5. **Service** (`src/services/musicas.service.ts`): Propagar `intensidade` em formatMusica, addVersao, updateVersao, listVersoes

### 3. Frontend — Componentes

1. **Schema** (`src/schemas/musica.ts`): Adicionar `intensidade` ao VersaoSchema e CreateMusicaCompleteFormSchema
2. **IntensidadeSelector** (novo componente): Pill buttons com ícones de barras
3. **MusicaForm**: Adicionar IntensidadeSelector abaixo do campo Nome
4. **VersaoForm**: Adicionar IntensidadeSelector com valor pré-selecionado
5. **MusicaDetail**: Exibir badge de intensidade junto a cada versão

### 4. Verificação

```bash
# Backend
npm test

# Frontend
npx tsc --noEmit

# Smoke test
curl -X POST localhost:8080/api/musicas/complete \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","intensidade":"media"}'
```
