# API Contract: Sessions (Multi-Tenant)

**Feature**: 020-multi-tenant | **Date**: 2026-03-21

## Alterações no endpoint existente

### POST /api/sessions — Login

**Mudança**: O response agora pode indicar necessidade de seleção de tenant.

#### Request (sem alteração)

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

#### Response — Single tenant (HTTP 200)

Fluxo idêntico ao atual, com `tenantId` adicionado ao JWT.

```json
{
  "user": {
    "id": "uuid",
    "name": "João",
    "email": "user@example.com",
    "avatar": null,
    "avatar_url": null,
    "telefone": null,
    "roles": [{ "id": "uuid", "name": "admin", "description": "...", "permissions": [...] }],
    "permissions": [],
    "tenant": { "id": "uuid", "name": "Igreja Central" },
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  },
  "token": "jwt-access-token",
  "refresh_token": "jwt-refresh-token"
}
```

#### Response — Multiple tenants (HTTP 200)

```json
{
  "requires_tenant_selection": true,
  "tenants": [
    { "id": "uuid-1", "name": "Igreja Central" },
    { "id": "uuid-2", "name": "Igreja Norte" }
  ],
  "selection_token": "jwt-temp-token-5min"
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 401 | Credenciais inválidas |
| 401 | Usuário não vinculado a nenhum tenant ativo |

---

## Novos endpoints

### POST /api/sessions/select-tenant — Selecionar igreja

**Auth**: `selection_token` (JWT temporário do login multi-tenant)

#### Request

```json
{
  "selection_token": "jwt-temp-token",
  "tenant_id": "uuid-do-tenant"
}
```

#### Response (HTTP 200)

```json
{
  "user": { "...same as single-tenant login..." },
  "token": "jwt-access-token-with-tenantId",
  "refresh_token": "jwt-refresh-token"
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 400 | `selection_token` ou `tenant_id` ausente |
| 401 | `selection_token` inválido ou expirado |
| 403 | Usuário não pertence ao tenant selecionado |
| 404 | Tenant não encontrado ou inativo |

---

### POST /api/sessions/switch-tenant — Trocar de igreja (P3)

**Auth**: `Bearer <access_token>` (usuário já autenticado)

#### Request

```json
{
  "tenant_id": "uuid-do-novo-tenant"
}
```

#### Response (HTTP 200)

```json
{
  "user": { "...user with new tenant context..." },
  "token": "jwt-new-access-token",
  "refresh_token": "jwt-new-refresh-token"
}
```

#### Erros

| Código | Condição |
| ------ | -------- |
| 400 | `tenant_id` ausente |
| 403 | Usuário não pertence ao tenant |
| 404 | Tenant não encontrado ou inativo |

---

### POST /api/sessions/refresh-token — Refresh (alteração)

**Mudança**: O refresh token agora inclui `tenantId` no JWT payload. O novo access token mantém o mesmo `tenantId`.

#### Request (sem alteração)

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

#### Response (sem alteração na estrutura)

```json
{
  "token": "jwt-new-access-token-with-tenantId",
  "refresh_token": "jwt-new-refresh-token"
}
```

---

## JWT Payload Changes

### Access Token (antes)

```json
{ "sub": "userId", "iat": ..., "exp": ... }
```

### Access Token (depois)

```json
{ "sub": "userId", "tenantId": "tenantId", "iat": ..., "exp": ... }
```

### Selection Token (novo, temporário)

```json
{ "sub": "userId", "purpose": "tenant_selection", "iat": ..., "exp": ... }
```

Expiração: 5 minutos. Sem `tenantId` (ainda não selecionado).
