# Quickstart: Integração Frontend-Backend (Fase 1)

**Branch**: `005-frontend-backend-integration`
**Date**: 2026-02-16

## Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose (para o PostgreSQL)
- Backend do LouvorFlow rodando em `http://localhost:3000`

## Setup do Ambiente

### 1. Subir o banco de dados

```bash
cd src/backend
docker compose up -d
```

### 2. Rodar as migrations e seed (se necessário)

```bash
cd src/backend
npx prisma migrate dev
```

### 3. Iniciar o backend

```bash
cd src/backend
npm run dev
```

Verifique que o servidor responde em `http://localhost:3000/api/integrantes`.

### 4. Configurar variável de ambiente do frontend

Crie o arquivo `src/frontend/.env` (se não existir):

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

### 5. Iniciar o frontend

```bash
cd src/frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (porta padrão do Vite).

## Verificação Rápida

Após ambos os servidores estarem rodando:

1. Acesse `http://localhost:5173/integrantes` — deve carregar dados do banco (ou estado vazio se não houver registros)
2. Acesse `http://localhost:5173/musicas` — deve carregar catálogo do banco
3. Acesse `http://localhost:5173/escalas` — deve carregar eventos do banco

## Estrutura de Arquivos Novos

```text
src/frontend/src/
├── lib/api.ts              # Fetch wrapper
├── schemas/                # Zod schemas
│   ├── shared.ts
│   ├── integrante.ts
│   ├── musica.ts
│   └── evento.ts
├── services/               # Funções de chamada API
│   ├── integrantes.ts
│   ├── musicas.ts
│   ├── eventos.ts
│   └── support.ts
├── hooks/                  # React Query hooks
│   ├── use-integrantes.ts
│   ├── use-musicas.ts
│   ├── use-eventos.ts
│   └── use-support.ts
└── components/             # Componentes novos
    ├── IntegranteForm.tsx
    ├── MusicaForm.tsx
    ├── EventoForm.tsx
    ├── EventoDetail.tsx
    ├── EmptyState.tsx
    └── ErrorState.tsx
```

## Fluxo de Dados

```text
Página → Hook (React Query) → Service (Fetch) → API Backend
                                                      ↓
Página ← Hook (dados/loading/error) ← Zod (parse) ← Response JSON
```

## Comandos Úteis

```bash
# Rodar testes do frontend
cd src/frontend && npx vitest

# Verificar tipos TypeScript
cd src/frontend && npx tsc --noEmit

# Lint
cd src/frontend && npm run lint
```

## Troubleshooting

| Problema | Solução |
| -------- | ------- |
| CORS error no console | Verificar se o backend está rodando e se `cors()` está habilitado em `src/backend/src/app.ts` |
| "Network Error" ao carregar dados | Verificar se o backend está acessível em `http://localhost:3000` |
| Lista vazia mas sem erro | Verificar se existem dados no banco (usar Prisma Studio: `npx prisma studio`) |
| Erro de validação Zod no console | O contrato da API pode ter mudado — verificar `openapi.json` vs schemas Zod |
