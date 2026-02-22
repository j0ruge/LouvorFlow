# Quickstart: Histórico com Dados Reais

**Feature**: 010-live-historico | **Date**: 2026-02-22

## Prerequisites

- Node.js >= 18
- Docker Compose (para PostgreSQL)
- Branch `010-live-historico` checked out

## Setup

```bash
# 1. Subir banco de dados
docker compose -f infra/postgres/docker-compose.yml up -d

# 2. Instalar dependências (backend + frontend)
cd packages/backend && npm install
cd ../frontend && npm install

# 3. Gerar Prisma client e aplicar migrações
cd ../backend && npx prisma generate && npx prisma db push

# 4. Iniciar backend (porta 3000)
npm run dev &

# 5. Iniciar frontend (porta 8080)
cd ../frontend && npm run dev
```

## Verification

1. **Criar dados de teste**: Acesse `/escalas`, crie um evento com data passada, associe músicas e integrantes.
2. **Verificar histórico**: Acesse `/historico` e confirme que o evento aparece com dados reais.
3. **Verificar empty state**: Se não houver eventos passados, a página deve exibir mensagem de "sem histórico".
4. **Verificar "Ver Detalhes"**: Clique no botão e confirme que navega para a página de detalhe do evento.

## Key Files

| File | Purpose |
|------|---------|
| `packages/frontend/src/pages/History.tsx` | Página principal — único arquivo a ser modificado |
| `packages/frontend/src/hooks/use-eventos.ts` | Hooks React Query (reutilizado, sem alteração) |
| `packages/frontend/src/services/eventos.ts` | Serviço API (reutilizado, sem alteração) |
| `packages/frontend/src/schemas/evento.ts` | Schemas Zod (reutilizado, sem alteração) |
| `packages/frontend/src/components/EmptyState.tsx` | Componente de estado vazio (reutilizado) |
| `packages/frontend/src/components/ErrorState.tsx` | Componente de estado de erro (reutilizado) |

## Testing

```bash
cd packages/frontend && npx vitest run
```
