# Research: 019-frontend-acl-visibility

**Date**: 2026-03-15

## Decision 1: Backend permission delivery mechanism

**Decision**: Use the existing profile endpoint (`GET /api/profile`) which already returns `roles[]` with nested `permissions[]` and direct `permissions[]`. No new endpoint needed.

**Rationale**: The `ShowProfileService` already loads the full user with `USER_PUBLIC_SELECT` which includes roles → permissions and direct permissions. The `AuthContext` already stores `user.roles` and `user.permissions` from this response. The frontend just needs a utility to compute effective permissions from this existing data.

**Alternatives considered**:
- Dedicated `/api/me/permissions` endpoint → Rejected: redundant, profile already has the data
- Embed permissions in JWT claims → Rejected: bloats token, stale until refresh

## Decision 2: Backend route migration strategy (ensureHasRole → can)

**Decision**: Replace `ensureHasRole` with `can(['<recurso>.write'])` in all 8 domain route files. Map routes to permissions as follows:

| Routes file | Permission |
|-------------|-----------|
| `artistas.routes.ts` | `configuracoes.write` |
| `categorias.routes.ts` | `configuracoes.write` |
| `funcoes.routes.ts` | `configuracoes.write` |
| `tonalidades.routes.ts` | `configuracoes.write` |
| `tipos-eventos.routes.ts` | `configuracoes.write` |
| `integrantes.routes.ts` | `integrantes.write` |
| `eventos.routes.ts` | `escalas.write` |
| `musicas.routes.ts` | `musicas.write` |

**Rationale**: The `can()` middleware already exists, is battle-tested (used on admin routes), and combines direct + role-inherited permissions with caching on `req.user`. Minimal code change per route file (swap import + middleware call).

**Alternatives considered**:
- Keep `ensureHasRole` + add `can()` after it → Rejected: redundant check, `can()` already verifies user has a role implicitly
- Create new middleware → Rejected: `can()` already does exactly what's needed

## Decision 3: Frontend permission checking pattern

**Decision**: Create a `useCan(permission: string)` hook that computes effective permissions from the existing `user` object in AuthContext. Also create a `<Can permission="...">` wrapper component for declarative usage.

**Rationale**: The user object already contains `roles[].permissions[]` and `permissions[]`. Computing effective permissions is a pure function: flatten role permissions + direct permissions into a Set, then check membership. Admin bypass via `admin_full_access` permission check.

**Alternatives considered**:
- Check roles instead of permissions → Rejected: roles are groupings, permissions are the atomic unit; checking permissions allows flexible role composition
- Add `effectivePermissions` field to backend response → Rejected: frontend can compute this client-side from existing data, avoids API change

## Decision 4: Seed script strategy

**Decision**: Extend existing `seeds/admin.ts` to also create the 4 domain permissions and associate all of them to the "admin" role.

**Rationale**: The seed script is already idempotent (uses `upsert`). Adding 4 more permissions follows the exact same pattern as `admin_full_access`. Associating them to admin role ensures admin retains full access.

**Alternatives considered**:
- Separate seed file for domain permissions → Rejected: adds operational complexity, single seed is simpler
- Don't associate to admin role → Rejected: admin needs all permissions; `admin_full_access` is checked separately but associating domain permissions too is defense-in-depth

## Decision 5: 403 handling on frontend

**Decision**: Intercept 403 responses in `apiFetch` and show a toast notification. No redirect, no re-fetch of permissions.

**Rationale**: 403 during active session is rare (permission revoked mid-session). A toast is the least disruptive UX. Re-fetching permissions on every 403 could cause cascading requests. The user can refresh the page to get updated permissions.

**Alternatives considered**:
- Auto re-fetch profile on 403 → Rejected: could cause loops if permission was intentionally revoked; adds complexity
- Redirect to 403 page → Rejected: too disruptive for a single failed action

## Decision 6: ConfigCrudSection modification approach

**Decision**: Add an optional `readOnly` boolean prop to `ConfigCrudSection`. When `true`, hide create input, edit icons, and delete icons. The parent `Settings.tsx` page passes this prop based on `useCan('configuracoes.write')`.

**Rationale**: Keeps the generic component reusable. The permission check stays at the page level (Settings.tsx), following the pattern of checking at the highest relevant component.

**Alternatives considered**:
- Wrap each `ConfigCrudSection` in `<Can>` → Rejected: would hide entire section including the read-only list
- Add permission check inside ConfigCrudSection → Rejected: couples generic component to specific permission system
