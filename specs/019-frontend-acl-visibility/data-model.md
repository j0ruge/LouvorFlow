# Data Model: 019-frontend-acl-visibility

**Date**: 2026-03-15

## Entities

### No schema changes required

This feature does not introduce new database tables or columns. All required entities already exist:

- **Permissions** — `name` (unique), `description`, `id` (UUID), timestamps
- **Roles** — `name` (unique), `description`, `id` (UUID), timestamps
- **PermissionsRoles** — junction: `role_id`, `permission_id` (composite unique)
- **UsersPermissions** — junction: `user_id`, `permission_id` (composite unique)
- **UsersRoles** — junction: `user_id`, `role_id` (composite unique)

## Seed Data (new records)

### New Permissions

| name | description |
|------|-------------|
| `configuracoes.write` | Permite criar, editar e excluir dados de configuração (artistas, categorias, funções, tonalidades, tipos de eventos) |
| `integrantes.write` | Permite criar, editar e excluir integrantes |
| `escalas.write` | Permite criar, editar e excluir escalas e gerenciar suas músicas e integrantes |
| `musicas.write` | Permite criar, editar e excluir músicas, versões, categorias e funções associadas |

### Permission-Role Associations (seed)

All 4 new permissions are associated to the existing `admin` role, ensuring admin retains full access:

| role | permission |
|------|-----------|
| `admin` | `configuracoes.write` |
| `admin` | `integrantes.write` |
| `admin` | `escalas.write` |
| `admin` | `musicas.write` |

## Frontend Data Shape

### Effective Permissions (computed client-side)

The frontend computes effective permissions from the existing `user` object:

```text
effectivePermissions = Set(
  user.permissions.map(p => p.name)           // direct permissions
  ∪ user.roles.flatMap(r => r.permissions.map(p => p.name))  // role-inherited
)
```

### Permission Check Logic

```text
useCan(permission):
  if user has "admin_full_access" in effectivePermissions → true (bypass)
  if permission in effectivePermissions → true
  else → false
```

## Route-to-Permission Mapping

| Domain | Backend routes | Permission required (POST/PUT/DELETE) |
|--------|---------------|--------------------------------------|
| Artistas | `/api/artistas` | `configuracoes.write` |
| Categorias | `/api/categorias` | `configuracoes.write` |
| Funções | `/api/funcoes` | `configuracoes.write` |
| Tonalidades | `/api/tonalidades` | `configuracoes.write` |
| Tipos de Eventos | `/api/tipos-eventos` | `configuracoes.write` |
| Integrantes | `/api/integrantes` | `integrantes.write` |
| Eventos (escalas) | `/api/eventos` | `escalas.write` |
| Músicas | `/api/musicas` | `musicas.write` |

GET endpoints remain `ensureAuthenticated` only (any logged-in user can read).
