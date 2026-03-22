# API Contract: Igrejas (Tenants)

**Feature**: 020-multi-tenant | **Date**: 2026-03-21

Todos os endpoints abaixo são protegidos por `ensureAuthenticated + ensureSuperAdmin`.

## Endpoints

### GET /api/igrejas — Listar tenants

**Auth**: Super-admin only

#### Response (HTTP 200)

**Formato**: Array direto (sem wrapper). Campo `_count.tenant_users` contém contagem de membros.

```json
[
  {
    "id": "uuid",
    "name": "Igreja Central",
    "status": "active",
    "_count": { "tenant_users": 15 },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

---

### GET /api/igrejas/:id — Detalhar tenant

**Auth**: Super-admin only

#### Response (HTTP 200)

```json
{
  "id": "uuid",
  "name": "Igreja Central",
  "status": "active",
  "user_count": 15,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 404 | Tenant não encontrado |

---

### POST /api/igrejas — Criar tenant

**Auth**: Super-admin only

#### Request

```json
{
  "name": "Igreja Norte"
}
```

#### Response (HTTP 201)

**Formato**: Entidade wrapped em `{ msg, igreja }`.

```json
{
  "msg": "Igreja criada com sucesso",
  "igreja": {
    "id": "uuid",
    "name": "Igreja Norte",
    "status": "active",
    "_count": { "tenant_users": 0 },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 400 | `name` ausente ou vazio |
| 409 | Tenant com mesmo nome já existe |

---

### PUT /api/igrejas/:id — Atualizar tenant

**Auth**: Super-admin only

#### Request

```json
{
  "name": "Igreja Central Renovada",
  "status": "active"
}
```

#### Response (HTTP 200)

```json
{
  "id": "uuid",
  "name": "Igreja Central Renovada",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 400 | Campos inválidos |
| 404 | Tenant não encontrado |
| 409 | Nome duplicado |

---

### DELETE /api/igrejas/:id — Desativar tenant (soft-delete)

**Auth**: Super-admin only

Não exclui dados — muda `status` para `inactive`.

#### Response (HTTP 204)

Sem body.

#### Erros

| Código | Condição |
| ------ | -------- |
| 404 | Tenant não encontrado |

---

### POST /api/igrejas/:id/users — Vincular usuário ao tenant

**Auth**: Super-admin only

#### Request

```json
{
  "user_id": "uuid-do-usuario"
}
```

#### Response (HTTP 201)

```json
{
  "id": "uuid-do-vinculo",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "created_at": "..."
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 400 | `user_id` ausente |
| 404 | Tenant ou usuário não encontrado |
| 409 | Usuário já vinculado ao tenant |

---

### DELETE /api/igrejas/:id/users/:userId — Desvincular usuário do tenant

**Auth**: Super-admin only

Remove o vínculo `TenantUsers` e todas as atribuições RBAC (`UsersRoles`, `UsersPermissions`) do usuário naquele tenant.

#### Response (HTTP 204)

Sem body.

#### Erros

| Código | Condição |
| ------ | -------- |
| 404 | Tenant, usuário ou vínculo não encontrado |

---

### GET /api/igrejas/:id/users — Listar usuários de um tenant

**Auth**: Super-admin only

#### Response (HTTP 200)

**Formato**: Array de objetos com user nested (junction table format).

```json
[
  {
    "id": "uuid-do-vinculo",
    "created_at": "2026-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid-do-usuario",
      "name": "João Silva",
      "email": "joao@example.com",
      "telefone": "11999999999"
    }
  }
]
```

**Nota**: O frontend DEVE achatar o wrapper `user` para uso em componentes (ex: via `z.transform()`).

---

## Zod Validators

```text
createTenantSchema:
  body: { name: z.string().min(1).max(255) }

updateTenantSchema:
  params: { id: z.string().uuid() }
  body: { name: z.string().min(1).max(255).optional(), status: z.enum(['active', 'inactive']).optional() }

tenantIdParamSchema:
  params: { id: z.string().uuid() }

addUserToTenantSchema:
  params: { id: z.string().uuid() }
  body: { user_id: z.string().uuid() }

removeUserFromTenantSchema:
  params: { id: z.string().uuid(), userId: z.string().uuid() }
```
