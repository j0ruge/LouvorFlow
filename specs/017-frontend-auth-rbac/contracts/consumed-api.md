# Consumed API Contract: Frontend Auth & RBAC

**Feature**: 017-frontend-auth-rbac
**Date**: 2026-03-14

> O frontend **consome** a API REST do backend. Este documento lista os endpoints utilizados, seus contratos de request/response, e o status de implementação no backend.

## ⚠️ Nota sobre Transformações de Resposta

> **Lição aprendida**: O Prisma retorna relações M:N em formato junction table (ex: `{ role: {...} }`), mas o frontend espera formato plano (flat). Todo controller que retorna User, Role ou Permission com relações **DEVE** usar as funções `flattenUserRelations()` ou `flattenRolePermissions()` de `src/types/auth.types.ts` antes de enviar a resposta.
>
> Campos computados como `avatar_url` não existem no banco — devem ser calculados em **todo** endpoint que retorna User.
>
> Veja a seção [Contrato de Resposta — Exemplo JSON](#contrato-de-resposta--exemplo-json) para payloads reais.

## Endpoints Consumidos

### Autenticação (Públicos)

#### POST /api/sessions — Login

```text
Request:  { email: string, password: string }
Response: { user: AuthUser, token: string, refresh_token: string }
Errors:   401 { erro: "E-mail ou senha incorretos", codigo: 401 }
Status:   ✅ Implementado
```

#### POST /api/sessions/refresh-token — Renovar Token

```text
Request:  { token: string }  (refresh token)
Response: { token: string, refresh_token: string }
Errors:   401 { erro: "Token inválido/expirado", codigo: 401 }
Status:   ✅ Implementado
```

#### POST /api/sessions/logout — Encerrar Sessão

```text
Request:  (vazio, requer Authorization header)
Response: 204 No Content
Status:   ✅ Implementado
```

### Recuperação de Senha (Públicos)

#### POST /api/password/forgot — Solicitar Recuperação

```text
Request:  { email: string }
Response: 204 No Content (sempre, para evitar enumeração de e-mails)
Status:   ✅ Implementado
```

#### POST /api/password/reset — Redefinir Senha

```text
Request:  { token: string (UUID), password: string, password_confirmation: string }
Response: 204 No Content
Errors:   400 { erro: "Token inválido/expirado", codigo: 400 }
Status:   ✅ Implementado
```

### Perfil (Autenticados)

#### GET /api/profile — Obter Perfil

```text
Request:  (requer Authorization header)
Response: AuthUser object
Status:   ✅ Implementado
```

#### PUT /api/profile — Atualizar Perfil

```text
Request:  { name?: string, email?: string, old_password?: string, password?: string }
Response: AuthUser object (atualizado)
Errors:   400 (validação), 401 (senha antiga incorreta)
Status:   ✅ Implementado
```

### Admin - Usuários (Requer role "admin")

#### POST /api/users — Criar Usuário

```text
Request:  { name: string, email: string, password: string }
Response: 201 AuthUser object (sem senha)
Errors:   409 { erro: "Já existe um usuário com este e-mail", codigo: 409 }
Status:   ✅ Implementado
```

#### GET /api/users — Listar Usuários

```text
Request:  (requer Authorization header + role admin)
Query:    ?page=1&limit=10 (opcional)
Response: { data: AuthUser[], total: number, page: number, limit: number }
Status:   ✅ Implementado (T022)
```

#### POST /api/users/acl/:userId — Atribuir ACL

```text
Request:  { roles: UUID[], permissions: UUID[] }
Response: AuthUser object (atualizado)
Errors:   404 (userId não encontrado)
Status:   ✅ Implementado
```

#### GET /api/users/acl/:userId — Obter ACL

```text
Request:  (requer Authorization header + role admin)
Response: { userId, name, roles: Role[], permissions: Permission[] }
Status:   ✅ Implementado
```

### Admin - Roles (Requer role "admin")

#### POST /api/roles — Criar Role

```text
Request:  { name: string, description: string }
Response: 201 Role object
Errors:   409 (nome duplicado)
Status:   ✅ Implementado
```

#### GET /api/roles — Listar Roles

```text
Request:  (requer Authorization header + role admin)
Query:    ?page=1&limit=10 (opcional)
Response: { data: Role[], total: number, page: number, limit: number }
Status:   ✅ Implementado (T023)
```

#### POST /api/roles/:roleId/permissions — Atribuir Permissões a Role

```text
Request:  { permissions: UUID[] }
Response: Role object (com permissões atualizadas)
Status:   ✅ Implementado
```

### Admin - Permissões (Requer role "admin")

#### POST /api/permissions — Criar Permissão

```text
Request:  { name: string, description: string }
Response: 201 Permission object
Status:   ✅ Implementado
```

#### GET /api/permissions — Listar Permissões

```text
Request:  (requer Authorization header + role admin)
Query:    ?page=1&limit=10 (opcional)
Response: { data: Permission[], total: number, page: number, limit: number }
Status:   ✅ Implementado (T024)
```

## Error Format (Backend)

Todos os erros seguem o formato:

```json
{ "erro": "Mensagem descritiva em português", "codigo": 400 }
```

Erros de validação Zod concatenam mensagens com `;`:

```json
{ "erro": "E-mail inválido; Senha deve ter no mínimo 6 caracteres", "codigo": 400 }
```

## Authentication Header

Todos os endpoints protegidos requerem:

```text
Authorization: Bearer <access_token>
```

O `apiFetch` deve injetar este header automaticamente quando o usuário está autenticado.

---

## Contrato de Resposta — Exemplo JSON

> **IMPORTANTE**: Se o backend usa Prisma com junction tables (M:N), o controller DEVE transformar o formato antes de retornar ao frontend. Os exemplos abaixo mostram o formato **final** que o frontend recebe (após achatamento).

### POST /api/sessions — Login Response

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin",
    "email": "admin@louvorflow.com",
    "avatar": null,
    "avatar_url": null,
    "roles": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "admin",
        "description": "Administrador do sistema",
        "created_at": "2026-03-14T00:00:00.000Z",
        "updated_at": "2026-03-14T00:00:00.000Z",
        "permissions": [
          {
            "id": "770e8400-e29b-41d4-a716-446655440002",
            "name": "users.create",
            "description": "Criar usuários",
            "created_at": "2026-03-14T00:00:00.000Z",
            "updated_at": "2026-03-14T00:00:00.000Z"
          }
        ]
      }
    ],
    "permissions": [],
    "created_at": "2026-03-14T00:00:00.000Z",
    "updated_at": "2026-03-14T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/users — List Users Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin",
      "email": "admin@louvorflow.com",
      "avatar": null,
      "avatar_url": null,
      "roles": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440001",
          "name": "admin",
          "description": "Administrador do sistema",
          "created_at": "2026-03-14T00:00:00.000Z",
          "updated_at": "2026-03-14T00:00:00.000Z",
          "permissions": []
        }
      ],
      "permissions": [],
      "created_at": "2026-03-14T00:00:00.000Z",
      "updated_at": "2026-03-14T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 1
}
```

### GET /api/roles — List Roles Response

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "admin",
      "description": "Administrador do sistema",
      "permissions": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "name": "users.create",
          "description": "Criar usuários",
          "created_at": "2026-03-14T00:00:00.000Z",
          "updated_at": "2026-03-14T00:00:00.000Z"
        }
      ],
      "created_at": "2026-03-14T00:00:00.000Z",
      "updated_at": "2026-03-14T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 1
}
```

### GET /api/permissions — List Permissions Response

```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "users.create",
      "description": "Criar usuários",
      "created_at": "2026-03-14T00:00:00.000Z",
      "updated_at": "2026-03-14T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 1
}
```

### GET /api/profile — Profile Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Admin",
  "email": "admin@louvorflow.com",
  "avatar": "avatar-abc123.jpg",
  "avatar_url": "http://localhost:3000/files/avatar-abc123.jpg",
  "roles": [],
  "permissions": [],
  "created_at": "2026-03-14T00:00:00.000Z",
  "updated_at": "2026-03-14T00:00:00.000Z"
}
```
