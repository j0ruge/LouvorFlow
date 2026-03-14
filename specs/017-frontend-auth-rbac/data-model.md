# Data Model: Frontend Auth & RBAC

**Feature**: 017-frontend-auth-rbac
**Date**: 2026-03-14

> Este documento descreve as **interfaces TypeScript do frontend** — representações client-side das entidades retornadas pela API. O schema do banco (Prisma) já está definido na spec 013 e não é alterado.

## Entidades do Frontend

### AuthUser (Usuário Autenticado)

Dados do usuário retornados pelo login e armazenados no AuthContext.

```typescript
interface AuthUser {
  id: string;           // UUID
  name: string;
  email: string;
  avatar: string | null;
  avatar_url: string | null;  // URL completa computada pelo backend
  roles: Role[];              // Roles com permissões aninhadas
  permissions: Permission[];  // Permissões diretas do usuário
  created_at: string;         // ISO 8601
  updated_at: string;         // ISO 8601
}
```

### Role (Papel)

```typescript
interface Role {
  id: string;           // UUID
  name: string;         // ex: "admin", "líder", "músico"
  description: string;
  permissions: Permission[];  // Permissões da role
  created_at: string;
  updated_at: string;
}
```

### Permission (Permissão)

```typescript
interface Permission {
  id: string;           // UUID
  name: string;         // ex: "users.create", "roles.manage"
  description: string;
  created_at: string;
  updated_at: string;
}
```

### LoginResponse (Resposta do Login)

```typescript
interface LoginResponse {
  user: AuthUser;
  token: string;           // JWT access token
  refresh_token: string;   // JWT refresh token
}
```

### RefreshTokenResponse (Resposta do Refresh)

```typescript
interface RefreshTokenResponse {
  token: string;           // Novo access token
  refresh_token: string;   // Novo refresh token (rotation)
}
```

### UserAcl (ACL de um Usuário)

Retornado por `GET /api/users/acl/:userId`.

```typescript
interface UserAcl {
  userId: string;
  name: string;
  roles: Role[];
  permissions: Permission[];
}
```

## Relacionamentos

```text
AuthUser
├── roles: Role[] (M:N via users_roles)
│   └── permissions: Permission[] (M:N via permissions_role)
└── permissions: Permission[] (M:N via users_permissions, diretas)
```

**Permissões efetivas** de um usuário = permissões diretas + permissões de todas as suas roles (modelo aditivo).

## Transformações Obrigatórias (Backend → API Response)

> **IMPORTANTE**: As interfaces acima representam o formato **final** que o frontend recebe. O Prisma retorna formatos diferentes que DEVEM ser transformados pelo controller antes de enviar a resposta.

### 1. Junction table → flat

O Prisma retorna relações M:N em formato junction table:

```typescript
// ❌ Formato bruto do Prisma (junction table)
{ roles: [{ role: { id, name, description } }] }
{ permissions: [{ permission: { id, name, description } }] }

// ✅ Formato esperado pelo frontend (flat)
{ roles: [{ id, name, description, permissions: [...] }] }
{ permissions: [{ id, name, description }] }
```

**Solução**: Usar `flattenUserRelations()` e `flattenRolePermissions()` de `src/types/auth.types.ts`.

**Afeta**: `User.roles`, `User.permissions`, `Role.permissions`.

### 2. Campos computados

`avatar_url` **não existe no banco de dados**. TODO endpoint que retorna User DEVE computar:

```typescript
avatar_url = user.avatar ? `${APP_API_URL}/files/${user.avatar}` : null
```

**Afeta**: Login, Profile, List Users, User ACL, Create User.

### 3. Timestamps em relações

Selects Prisma de relações M:N devem incluir `created_at` e `updated_at` nos nested objects. Isso é definido em `USER_PUBLIC_SELECT` e `ROLE_WITH_PERMISSIONS_SELECT` em `src/types/auth.types.ts`.

## Estado de Autenticação (AuthContext)

```typescript
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;    // Derivado: user !== null
  isAdmin: boolean;            // Derivado: user?.roles.some(r => r.name === 'admin')
  isLoading: boolean;          // true durante inicialização (tentativa de refresh)
}
```

**Ciclo de vida**:
1. App carrega → `isLoading: true`
2. Se há refresh token em localStorage → tenta refresh
   - Sucesso → `{ user, isAuthenticated: true, isLoading: false }`
   - Falha → `{ user: null, isAuthenticated: false, isLoading: false }`
3. Se não há refresh token → `{ user: null, isAuthenticated: false, isLoading: false }`
4. Login → atualiza user + tokens
5. Logout → limpa tudo, redireciona ao login

## Formulários (Zod Schemas)

### Login

```typescript
// Campos: email (obrigatório, formato e-mail), password (obrigatório)
loginSchema: { email: string, password: string }
```

### Perfil (Edição)

```typescript
// Campos: name (opcional), email (opcional, formato e-mail), old_password (opcional), password (opcional, min 6)
updateProfileSchema: { name?: string, email?: string, old_password?: string, password?: string }
```

### Recuperação de Senha

```typescript
forgotPasswordSchema: { email: string }
resetPasswordSchema: { token: string, password: string (min 6), password_confirmation: string }
// Refinement: password === password_confirmation
```

### Admin - Criar Usuário

```typescript
createUserSchema: { name: string, email: string, password: string (min 6) }
```

### Admin - Criar Role

```typescript
createRoleSchema: { name: string, description: string }
```

### Admin - Criar Permissão

```typescript
createPermissionSchema: { name: string, description: string }
```

### Admin - Atribuir ACL

```typescript
userAclSchema: { roles: string[] (UUIDs), permissions: string[] (UUIDs) }
```

### Admin - Atribuir Permissões a Role

```typescript
rolePermissionsSchema: { permissions: string[] (UUIDs, min 1) }
```
