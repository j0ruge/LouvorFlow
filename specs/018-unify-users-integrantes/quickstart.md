# Quickstart: Unificação Users/Integrantes

**Branch**: `018-unify-users-integrantes`

## Prerequisites

- Docker running (PostgreSQL container `louvorflow_db`)
- Node.js >= 18
- `npm install` in both `packages/backend` and `packages/frontend`

## Development Workflow

### 1. Start database

```bash
cd infra/postgres && docker compose up -d
```

### 2. Apply migrations (includes data migration)

```bash
cd packages/backend
npx prisma generate
npx prisma migrate deploy
```

A migration `20260315120000_unify_users_integrantes` cuida automaticamente de:
- Adicionar `telefone` a `users`
- Criar `eventos_users` e `users_funcoes`
- Migrar dados de `integrantes` → `users` (merge por email)
- Copiar junction records (`eventos_integrantes` → `eventos_users`, `integrantes_funcoes` → `users_funcoes`)
- Dropar tabelas antigas (`integrantes`, `eventos_integrantes`, `integrantes_funcoes`)

Integrantes migrados sem conta em `users` recebem senha placeholder e precisam usar "Esqueci minha senha".

### 3. Start backend

```bash
cd packages/backend
npm run dev
```

### 4. Smoke test

```bash
# List integrantes (now backed by users table)
curl http://localhost:3333/api/integrantes

# Create integrante (creates a real user)
curl -X POST http://localhost:3333/api/integrantes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","email":"test@igreja.com","senha":"123456","telefone":"11999999999"}'

# Login with newly created integrante
curl -X POST http://localhost:3333/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"test@igreja.com","password":"123456"}'
```

### 5. Start frontend

```bash
cd packages/frontend
npm run dev
```

### 6. Run tests

```bash
cd packages/backend && npm test
cd packages/frontend && npm test
```

## Key Files to Modify

| Priority | File | Change |
|----------|------|--------|
| P1 | `prisma/schema.prisma` | Add `telefone` to Users, rename junctions, remove Integrantes |
| P1 | `prisma/cliente.ts` | Remove `integrantes` $extends filter |
| P1 | `prisma/migrations/20260315120000_unify_users_integrantes/migration.sql` | Data migration SQL (inline) |
| P1 | `src/repositories/integrantes.repository.ts` | Query Users table, field mapping |
| P1 | `src/services/integrantes.service.ts` | Use Users model, map nome↔name |
| P1 | `src/controllers/integrantes.controller.ts` | Minimal changes (service handles mapping) |
| P1 | `src/types/index.ts` | Update types and PUBLIC_SELECT |
| P2 | `src/repositories/eventos.repository.ts` | Update junction references |
| P2 | `src/services/eventos.service.ts` | Update junction field names |
| P2 | Frontend schemas/services/hooks | Align with unified response |
| P2 | `pages/Dashboard.tsx` | Count by Users_Funcoes |
| P3 | `docs/openapi.json` | Update schemas |
| P3 | Tests | Adapt all integrantes tests |
