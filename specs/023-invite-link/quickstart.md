# Quickstart: Link de Convite para Integrantes

**Feature**: 023-invite-link | **Date**: 2026-03-28

## Prerequisites

- Node.js >= 18
- PostgreSQL 17 rodando via Docker Compose
- Variáveis de ambiente configuradas (`.env`)

## Setup

```bash
# 1. Instalar dependências (se necessário)
cd packages/backend && npm install
cd packages/frontend && npm install

# 2. Aplicar migration do Prisma (após criar model InviteTokens)
cd packages/backend && npx prisma migrate dev --name add-invite-tokens

# 3. Regenerar Prisma Client
cd packages/backend && npx prisma generate

# 4. Iniciar backend
cd packages/backend && npm run dev

# 5. Iniciar frontend
cd packages/frontend && npm run dev
```

## Smoke Test Manual

### 1. Gerar convite (como líder)

```bash
# Login como admin
curl -s -X POST http://localhost:3333/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq '.token'

# Gerar convite (substituir TOKEN pelo JWT acima)
curl -s -X POST http://localhost:3333/api/convites \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" | jq '.'
```

### 2. Validar token (como participante)

```bash
# Substituir {INVITE_TOKEN} pelo token retornado acima
curl -s http://localhost:3333/api/convites/{INVITE_TOKEN}/validate | jq '.'
```

### 3. Aceitar convite (como participante)

```bash
curl -s -X POST http://localhost:3333/api/convites/{INVITE_TOKEN}/accept \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@test.com","senha":"123456","senha_confirmacao":"123456"}' | jq '.'
```

### 4. Verificar vínculo

```bash
# Login com nova conta
curl -s -X POST http://localhost:3333/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@test.com","password":"123456"}' | jq '.'
```

### 5. Listar convites (como líder)

```bash
curl -s http://localhost:3333/api/convites \
  -H "Authorization: Bearer {TOKEN}" | jq '.'
```

## Frontend Test

1. Abrir `http://localhost:5173/` e logar como admin
2. Navegar para Integrantes
3. Clicar "Gerar convite" → verificar que link foi copiado
4. Abrir `http://localhost:5173/convite/{TOKEN}` em aba anônima
5. Preencher formulário e criar conta
6. Verificar que novo integrante aparece na lista

## Run Tests

```bash
# Backend
cd packages/backend && npm test

# Frontend
cd packages/frontend && npm test
```
