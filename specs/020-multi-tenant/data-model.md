# Data Model: Migração para Multi-Tenant

**Feature**: 020-multi-tenant | **Date**: 2026-03-21

## New Entities

### Tenant

Representa uma igreja/comunidade no sistema.

| Campo | Tipo | Constraints | Notas |
| ----- | ---- | ----------- | ----- |
| `id` | UUID | PK, default uuid_generate_v4() | |
| `name` | String(255) | NOT NULL | Nome da igreja |
| `status` | Enum(active, inactive, system) | NOT NULL, default active | Soft-delete via inactive; `system` reservado para tenant sentinela |
| `created_at` | Timestamp | NOT NULL, default now() | |
| `updated_at` | Timestamp | NOT NULL, auto-update | |

**Mapped table**: `tenants`

**Constantes**:
- `SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000'` — tenant sentinela para atribuições de nível plataforma (ex: `super-admin`). Criado no seed. Nunca aparece em listagens de igrejas (`status: 'system'`) nem é selecionável no login.
- `DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'` — tenant padrão para migração de dados existentes.

---

### TenantUsers

Associação N:N entre Users e Tenants.

| Campo | Tipo | Constraints | Notas |
| ----- | ---- | ----------- | ----- |
| `id` | UUID | PK, default uuid_generate_v4() | |
| `tenant_id` | UUID | FK → tenants.id, CASCADE | |
| `user_id` | UUID | FK → users.id, CASCADE | |
| `created_at` | Timestamp | NOT NULL, default now() | |
| `updated_at` | Timestamp | NOT NULL, auto-update | |

**Unique**: `@@unique([tenant_id, user_id])`
**Mapped table**: `tenant_users`

---

## Modified Entities

### Domain Entities — Adição de `tenant_id`

Todas as tabelas abaixo recebem:

| Campo | Tipo | Constraints |
| ----- | ---- | ----------- |
| `tenant_id` | UUID | FK → tenants.id, CASCADE, NOT NULL (após backfill) |

**Index**: `@@index([tenant_id])` em cada tabela.

#### Primary domain entities

| Tabela | Unique constraint atualizado |
| ------ | ---------------------------- |
| `artistas` | `@@unique([tenant_id, nome])` (antes: `nome` alone) |
| `musicas` | Sem unique (nome não era unique) — adicionar `@@index([tenant_id])` |
| `tonalidades` | `@@unique([tenant_id, tom])` (antes: `tom` alone) |
| `funcoes` | `@@unique([tenant_id, nome])` (antes: `nome` alone) |
| `categorias` | `@@unique([tenant_id, nome])` (antes: `nome` alone) |
| `tipos_eventos` | `@@unique([tenant_id, nome])` (antes: `nome` alone) |
| `eventos` | Sem unique — adicionar `@@index([tenant_id])` |

#### Junction tables

| Tabela | Unique constraint atualizado |
| ------ | ---------------------------- |
| `artistas_musicas` | `@@unique([tenant_id, artista_id, musica_id])` |
| `musicas_funcoes` | `@@unique([tenant_id, musica_id, funcao_id])` |
| `musicas_categorias` | `@@unique([tenant_id, musica_id, categoria_id])` |
| `eventos_musicas` | `@@unique([tenant_id, evento_id, musicas_id])` |
| `eventos_users` | `@@unique([tenant_id, evento_id, fk_user_id])` |
| `eventos_users_funcoes` | `@@unique([tenant_id, evento_user_id, funcao_id])` |
| `users_funcoes` | `@@unique([tenant_id, fk_user_id, funcao_id])` |

#### RBAC assignment tables

| Tabela | Mudança |
| ------ | ------- |
| `users_roles` | Adicionar `tenant_id` UUID FK → tenants.id. PK muda para `@@id([user_id, role_id, tenant_id])` |
| `users_permissions` | Adicionar `tenant_id` UUID FK → tenants.id. PK muda para `@@id([user_id, permission_id, tenant_id])` |

---

### Global Entities (SEM alteração)

Estas tabelas **NÃO** recebem `tenant_id`:

- `users` — Identidade global
- `roles` — Definições globais de papéis
- `permissions` — Definições globais de permissões
- `permissions_roles` — Atribuição papel→permissão (global)
- `users_refresh_tokens` — Tokens de sessão
- `users_recovery_tokens` — Tokens de recuperação de senha

---

## Entity Relationship Changes

```text
Tenant (1) ──────< TenantUsers >────── (N) Users
  │
  │ (1:N via tenant_id)
  ├── Artistas
  ├── Musicas
  ├── Tonalidades
  ├── Funcoes
  ├── Categorias
  ├── Tipos_Eventos
  ├── Eventos
  ├── [todas as junction tables]
  ├── UsersRoles (assignment)
  └── UsersPermissions (assignment)

Users (global) ──< UsersRoles (per-tenant) >── Roles (global)
Users (global) ──< UsersPermissions (per-tenant) >── Permissions (global)
```

---

## Migration Strategy

### Step 1: Add columns (nullable)

```sql
-- Create tenants table
-- Create tenant_users table
-- Add tenant_id UUID NULL to all 15 tables
-- Add FK constraints (ON DELETE CASCADE)
```

### Step 2: Backfill

```sql
-- Create system tenant (platform-level assignments)
INSERT INTO tenants (id, name, status) VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema', 'system');

-- Create default tenant with fixed UUID
INSERT INTO tenants (id, name, status) VALUES ('00000000-0000-0000-0000-000000000001', 'Igreja Padrão', 'active');

-- Backfill all domain tables
UPDATE artistas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
-- ... repeat for all 15 tables

-- Create TenantUsers for all existing users
INSERT INTO tenant_users (id, tenant_id, user_id)
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', id FROM users;

-- Backfill RBAC assignments
UPDATE users_roles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE users_permissions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
```

### Step 3: Finalize

```sql
-- Make tenant_id NOT NULL
ALTER TABLE artistas ALTER COLUMN tenant_id SET NOT NULL;
-- ... repeat for all 15 tables

-- Drop old unique constraints
-- Create new compound unique constraints
-- Create indexes on tenant_id columns
```

---

## Validation Rules

| Regra | Aplicação |
| ----- | --------- |
| `tenant_id` obrigatório em toda escrita de domínio | Prisma $extends interceptor |
| Tenant must exist and be active | Validar no middleware ou service |
| User must belong to tenant | Verificar `TenantUsers` no login e no select-tenant |
| Unique por tenant | Compound unique constraints no banco |
| Rotas super-admin usam `basePrisma` | JWT pode conter tenantId, mas rotas de gestão ignoram-no e operam cross-tenant |
