# Quickstart: Migração para Multi-Tenant

**Feature**: 020-multi-tenant | **Date**: 2026-03-21

## Pré-requisitos

- Docker Compose rodando (PostgreSQL na porta 35432)
- Node.js >=18
- Variáveis de ambiente configuradas (`.env` no backend)

## Ordem de implementação

### Fase 1: Schema + Migration

1. Atualizar `packages/backend/prisma/schema.prisma`:
   - Criar model `Tenant` (id, name, status, timestamps)
   - Criar model `TenantUsers` (id, tenant_id, user_id, timestamps)
   - Adicionar `tenant_id` UUID FK em 15 modelos (domain + RBAC assignments)
   - Atualizar unique constraints para compound com `tenant_id`
   - Adicionar `@@index([tenant_id])` em todas as tabelas com tenant_id

2. Gerar migration:
   ```bash
   cd packages/backend
   npx prisma migrate dev --name add-multi-tenant
   ```

3. Editar a migration SQL gerada para incluir backfill:
   - Inserir tenant padrão com UUID fixo
   - `UPDATE` todos os registros existentes com o tenant padrão
   - Inserir `TenantUsers` para todos os users
   - Alterar `tenant_id` para NOT NULL

4. Executar migration e regenerar client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

### Fase 2: Prisma Client Extension (tenant filtering)

1. Refatorar `packages/backend/prisma/cliente.ts`:
   - Manter `basePrisma` (sem filtro) para operações globais e super-admin
   - Criar `forTenant(tenantId)` que retorna client com `$extends`
   - Lista de `TENANT_MODELS` para saber quais modelos filtrar

2. Testar isolamento com dois tenants e dados distintos

### Fase 3: Auth — Login multi-tenant

1. Atualizar `ensureAuthenticated` middleware:
   - Extrair `tenantId` do JWT payload
   - Injetar `req.user.tenantId`
   - Criar instância do prisma tenant-scoped: `req.prisma = forTenant(tenantId)`

2. Criar middleware `ensureSuperAdmin`:
   - Verificar role `super-admin` (global, sem tenant)
   - Para super-admin sem tenant: `req.prisma = basePrisma`

3. Adaptar `AuthenticateUserService`:
   - Após validar credenciais, buscar tenants do usuário via `TenantUsers`
   - Se 1 tenant → login completo com `tenantId` no JWT
   - Se N tenants → retornar `requires_tenant_selection` + `selection_token`

4. Criar `SelectTenantService`:
   - Validar `selection_token` + `tenant_id`
   - Gerar JWT final com `tenantId`

5. Criar `SwitchTenantService` (P3):
   - Validar que o user pertence ao novo tenant
   - Gerar novo par de tokens com novo `tenantId`

### Fase 4: Repositories + Services — Usar prisma tenant-scoped

1. Atualizar repositories de domínio:
   - Trocar `import prisma from '../../prisma/cliente'` por receber prisma via parâmetro ou `req.prisma`
   - Estratégia: controllers passam `req.prisma` para services → repositories

2. Atualizar repositories de auth (UsersRoles, UsersPermissions):
   - Queries de RBAC precisam incluir `tenant_id` no where

3. Atualizar seed `admin.ts`:
   - Criar default tenant
   - Criar role `super-admin`
   - Associar admin como `super-admin` + `admin` no tenant padrão

### Fase 5: Frontend

1. Atualizar `AuthContext`:
   - Adicionar `currentTenant` ao state
   - Adicionar `switchTenant()` function

2. Atualizar `schemas/auth.ts`:
   - Adicionar `TenantSchema`
   - Atualizar `LoginResponseSchema` com campos opcionais `requires_tenant_selection`, `tenants`, `selection_token`

3. Criar página `SelectTenant.tsx`:
   - Lista de igrejas com cards clicáveis
   - Chamada a `POST /api/sessions/select-tenant`

4. Adaptar fluxo de login em `AuthContext`:
   - Se resposta tem `requires_tenant_selection` → navegar para `/selecionar-igreja`
   - Se login direto → navegar normalmente

5. Criar `TenantSwitcher` component:
   - Dropdown no header/sidebar
   - Chama `POST /api/sessions/switch-tenant`

## Verificação rápida

```bash
# Após cada fase, rodar:
cd packages/backend && npm test
cd packages/frontend && npm test

# Smoke test isolamento:
# 1. Criar dois tenants e dados em cada
# 2. Login como user do Tenant A
# 3. GET /api/musicas → deve retornar apenas músicas do Tenant A
# 4. GET /api/musicas/:id-do-tenant-B → deve retornar 404
```
