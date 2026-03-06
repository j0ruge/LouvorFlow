# Data Model: Portable Authentication, Session & RBAC System

**Feature**: `003-portable-auth-rbac` | **Date**: 2026-02-24

## Entity Relationship Diagram (Text)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    Users     │──M:N──│   users_roles    │──M:N──│    Roles     │
│              │       └──────────────────┘       │              │
│              │                                  │              │
│              │       ┌──────────────────┐       │              │       ┌──────────────────┐
│              │──M:N──│users_permissions │──M:N──│              │──M:N──│permissions_role   │
└──────┬───────┘       └──────────────────┘       └──────────────┘       └────────┬─────────┘
       │                                                                          │
       │ 1:N                                                                M:N   │
       │                                                                          │
┌──────┴────────────┐                                                   ┌─────────┴────┐
│UsersRefreshTokens │                                                   │ Permissions  │
└───────────────────┘                                                   └──────────────┘
       │
       │ (same user)
       │
┌──────┴─────────────┐
│UsersRecoveryTokens │
└────────────────────┘
```

## Base Entity

All entities inherit from a common base.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID (string) | PRIMARY KEY | Generated on creation (v4 UUID) |
| `created_at` | Timestamp | NOT NULL, auto-set on insert | |
| `updated_at` | Timestamp | NOT NULL, auto-set on insert/update | |

---

## Entity: Users

**Table name**: `users`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK (from Base) | |
| `name` | String (255) | NOT NULL | |
| `email` | String (255) | NOT NULL, UNIQUE | Used as login identifier |
| `password` | String (255) | NOT NULL | Hashed (never stored plaintext). Excluded from serialized output |
| `avatar` | String (255) | NULLABLE | Optional profile image filename |
| `created_at` | Timestamp | (from Base) | |
| `updated_at` | Timestamp | (from Base) | |

**Relationships**:
- Many-to-Many with **Roles** via `users_roles` — When a User is fetched, their Roles MUST be included in the result (i.e., loaded together with the user, not requiring a separate query from the caller's perspective). The implementation may use ORM eager-loading, joins, or a follow-up query — the key requirement is that `user.roles` is populated when the user is returned from the repository.
- Many-to-Many with **Permissions** via `users_permissions` — Same requirement: `user.permissions` MUST be populated when the user is returned from the repository.

**Computed property**:
- `avatar_url` — A read-only computed value (not stored in the database). Computed as: `{APP_API_URL}/files/{avatar}` when `avatar` is non-null, otherwise `null`. This SHOULD be implemented as a getter method, `toJSON()` override, or serialization hook — NOT as a database column.

**Indexes**:
- UNIQUE index on `email`

**Serialization rule**: `password` field MUST be excluded from all API responses. The exclusion mechanism is implementation-specific (see spec AR-004).

---

## Entity: Roles

**Table name**: `roles`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK (from Base) | |
| `name` | String (255) | NOT NULL, UNIQUE | e.g., "admin", "manager", "user" |
| `description` | String (500) | NOT NULL | Human-readable description |
| `created_at` | Timestamp | (from Base) | |
| `updated_at` | Timestamp | (from Base) | |

**Relationships**:
- Many-to-Many with **Permissions** via `permissions_role`

**Indexes**:
- UNIQUE index on `name`

---

## Entity: Permissions

**Table name**: `permissions`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK (from Base) | |
| `name` | String (255) | NOT NULL, UNIQUE | e.g., "create_users", "view_reports" |
| `description` | String (500) | NOT NULL | Human-readable description |
| `created_at` | Timestamp | (from Base) | |
| `updated_at` | Timestamp | (from Base) | |

**Indexes**:
- UNIQUE index on `name`

---

## Entity: UsersRefreshTokens

**Table name**: `users_refresh_tokens`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK (from Base) | |
| `refresh_token` | String (500) | NOT NULL | The signed JWT refresh token value |
| `user_id` | UUID | NOT NULL, FK → users.id, ON DELETE CASCADE | Cascade delete: when a user is deleted, all their refresh tokens are removed |
| `expires_date` | Timestamp | NOT NULL | Absolute expiry (e.g., now + 30 days) |
| `created_at` | Timestamp | (from Base) | |
| `updated_at` | Timestamp | (from Base) | |

**Relationships**:
- Many-to-One with **Users** via `user_id`

**Indexes**:
- Index on `user_id` (for logout: delete all by user)
- Composite index on `(user_id, refresh_token)` (for token validation lookup)

---

## Entity: UsersRecoveryTokens

**Table name**: `users_recovery_tokens`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK (from Base) | |
| `token` | UUID | NOT NULL, auto-generated | Recovery token sent via email |
| `user_id` | UUID | NOT NULL, FK → users.id, ON DELETE CASCADE | Cascade delete: when a user is deleted, all their recovery tokens are removed |
| `created_at` | Timestamp | (from Base) | Used for 2-hour expiry check |
| `updated_at` | Timestamp | (from Base) | |

**Indexes**:
- Index on `token` (for token lookup during password reset)

**Business rule**: Token expires 2 hours after `created_at`.

---

## Join Table: users_roles

**Table name**: `users_roles`

| Field | Type | Constraints |
|-------|------|-------------|
| `user_id` | UUID | PK (composite), FK → users.id, ON DELETE CASCADE |
| `role_id` | UUID | PK (composite), FK → roles.id, ON DELETE CASCADE |

---

## Join Table: users_permissions

**Table name**: `users_permissions`

| Field | Type | Constraints |
|-------|------|-------------|
| `user_id` | UUID | PK (composite), FK → users.id, ON DELETE CASCADE |
| `permission_id` | UUID | PK (composite), FK → permissions.id, ON DELETE CASCADE |

---

## Join Table: permissions_role

**Table name**: `permissions_role`

| Field | Type | Constraints |
|-------|------|-------------|
| `role_id` | UUID | PK (composite), FK → roles.id, ON DELETE CASCADE |
| `permission_id` | UUID | PK (composite), FK → permissions.id, ON DELETE CASCADE |

---

## Validation Rules (at service/route level)

| Entity | Field | Validation |
|--------|-------|------------|
| User | email | Valid email format, unique |
| User | password | Required (minimum length deferred to project policy) |
| User | name | Required, non-empty |
| Role | name | Required, unique |
| Role | description | Required |
| Permission | name | Required, unique |
| Permission | description | Required |
| Password Reset | password_confirmation | Must match `password` |
| Password Reset | token | Valid UUID format |
| Profile Update | old_password | Required when `password` is provided |

## Migration Strategy

Database schema creation SHOULD use the project's standard migration approach:
- **ORM migrations** (TypeORM migrations, Prisma migrate, Alembic, GORM AutoMigrate) — recommended for projects already using an ORM migration tool
- **Raw SQL migration files** — acceptable for projects that manage schema manually
- **ORM auto-sync** — acceptable ONLY for development; MUST NOT be used in production

The spec defines the target schema; the migration mechanism is an implementation detail. Migrations SHOULD be versioned and idempotent.

## Field Length Constraints

The `String(255)` and `String(500)` values in this data model are **recommended minimums**, not strict mandates. Implementers MAY use larger types (e.g., `TEXT`, `VARCHAR(1000)`) if their database/ORM defaults differ. The key constraint is that `password` hashes require at least 255 characters (bcrypt hashes are 60 chars, argon2 can be longer). Using `TEXT` instead of `VARCHAR(255)` does NOT violate this spec.

## Seed Data (Admin Bootstrap)

On first deploy, the seed command creates:

| Entity | Data |
|--------|------|
| Permission | `name: "admin_full_access"`, `description: "Full administrative access"` |
| Role | `name: "admin"`, `description: "System administrator"`, permissions: [`admin_full_access`] |
| User | `name: $ADMIN_NAME`, `email: $ADMIN_EMAIL`, `password: hash($ADMIN_PASSWORD)`, roles: [`admin`] |

All values sourced from environment variables. Seed is idempotent (check-before-create).

**Note**: The `admin_full_access` permission is the **minimum required** seed permission. It serves as the single permission that grants full administrative access. Implementers MAY create additional granular permissions (e.g., `manage_users`, `manage_roles`) in their seed if their project requires finer-grained access control, but this is not required by the core spec.
