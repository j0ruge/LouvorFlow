# Quickstart: Remover Campo Documento de Integrantes

**Branch**: `012-remove-documento-integrante` | **Date**: 2026-02-25

## Pré-requisitos

- Docker rodando (para PostgreSQL)
- Node.js >= 18

## Sequência de Implementação

### 1. Schema & Migration

```bash
cd packages/backend

# Editar prisma/schema.prisma: remover linha "doc_id String @unique"

# Gerar e aplicar migration
npx prisma migrate dev --name remove-doc-id

# Verificar que o Prisma Client foi regenerado
npx prisma generate
```

### 2. Backend — Types

Editar `src/types/index.ts`:
- Remover `doc_id: string` de `IntegranteWithFuncoes`
- Remover `doc_id: true` de `INTEGRANTE_PUBLIC_SELECT`

### 3. Backend — Repository

Editar `src/repositories/integrantes.repository.ts`:
- Remover `findByDocId()` e `findByDocIdExcludingId()`
- Adicionar `findByEmail(email)` e `findByEmailExcludingId(email, excludeId)`

### 4. Backend — Service

Editar `src/services/integrantes.service.ts`:
- **create()**: Remover normalização/validação de doc_id; adicionar validação de unicidade de email
- **update()**: Remover normalização/validação de doc_id; adicionar validação de unicidade de email (quando alterado)

### 5. Backend — Testes

- `tests/fakes/mock-data.ts`: Remover `doc_id` dos mocks
- `tests/fakes/fake-integrantes.repository.ts`: Trocar métodos doc_id por email
- `tests/services/integrantes.service.test.ts`: Trocar testes de doc_id por email

### 6. Frontend — Schemas

Editar `src/schemas/integrante.ts`:
- Remover `doc_id` dos 4 schemas Zod

### 7. Frontend — Form

Editar `src/components/IntegranteForm.tsx`:
- Remover campo "Documento" do formulário
- Remover `doc_id` dos default values e reset

### 8. Validação

```bash
# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test

# Smoke test via API
curl -X POST http://localhost:3000/api/integrantes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@igreja.com","senha":"123456"}'

# Verificar que doc_id não aparece na resposta
curl http://localhost:3000/api/integrantes

# Verificar email duplicado retorna 409
curl -X POST http://localhost:3000/api/integrantes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste2","email":"teste@igreja.com","senha":"123456"}'
```

## Arquivos Afetados (checklist)

- [ ] `packages/backend/prisma/schema.prisma`
- [ ] `packages/backend/src/types/index.ts`
- [ ] `packages/backend/src/repositories/integrantes.repository.ts`
- [ ] `packages/backend/src/services/integrantes.service.ts`
- [ ] `packages/backend/tests/fakes/mock-data.ts`
- [ ] `packages/backend/tests/fakes/fake-integrantes.repository.ts`
- [ ] `packages/backend/tests/services/integrantes.service.test.ts`
- [ ] `packages/frontend/src/schemas/integrante.ts`
- [ ] `packages/frontend/src/components/IntegranteForm.tsx`
