# Quickstart: Portable Auth & RBAC System

**Feature**: `003-portable-auth-rbac` | **Date**: 2026-02-24

This guide provides a step-by-step implementation order for building the authentication, session management, and RBAC system in **any** server-side project. Follow the layers bottom-up.

---

## Prerequisites

Before starting, choose your stack:

| Concern | Choose one |
|---------|-----------|
| Language | TypeScript, Python, Go, Java, C#, etc. |
| HTTP Framework | Express, Fastify, NestJS, Hono, Flask, Gin, Spring, .NET, etc. |
| ORM | TypeORM, Prisma, Drizzle, Sequelize, SQLAlchemy, GORM, etc. |
| Database | PostgreSQL (recommended), MySQL, SQLite, etc. |
| DI Container | tsyringe, InversifyJS, NestJS built-in, dependency-injector, manual, Spring, .NET built-in |
| Hash Library | bcrypt, argon2, scrypt |
| Token Library | jsonwebtoken, jose, go-jwt, jjwt, System.IdentityModel.Tokens.Jwt |
| Date Library | dayjs, date-fns, luxon, built-in |
| Mail Library | nodemailer, SES SDK, SendGrid, etc. |

Set up environment variables:

```
APP_SECRET=<jwt-access-token-secret>
APP_SECRET_REFRESH_TOKEN=<jwt-refresh-token-secret>
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d
REFRESH_TOKEN_EXPIRES_DAYS=30
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
ADMIN_NAME=Administrator
APP_API_URL=http://localhost:3333
APP_WEB_URL=http://localhost:3000
```

---

## Implementation Order

### Phase 1 — Foundation (Layer 1: Models + Cross-Cutting)

**Goal**: Define all data structures and shared utilities.

1. **Create `AppError`** — Domain error class with `message` (string) and `statusCode` (number, default 400)
2. **Create `BaseEntity`** — Common base with `id` (UUID, auto-generated), `created_at`, `updated_at`
3. **Create entities** (see [data-model.md](./data-model.md)):
   - `User` (extends BaseEntity) — name, email, password (excluded from serialization), avatar, relationships to Roles and Permissions
   - `Role` (extends BaseEntity) — name, description, relationship to Permissions
   - `Permission` (extends BaseEntity) — name, description
   - `UsersRefreshTokens` (extends BaseEntity) — refresh_token, user_id (FK), expires_date
   - `UsersRecoveryTokens` (extends BaseEntity) — token (UUID), user_id (FK)
4. **Create join tables/relations** — `users_roles`, `users_permissions`, `permissions_role`
5. **Run database migration** to create all tables

### Phase 2 — DTOs

**Goal**: Define all input/output data contracts.

Create all 9 DTOs as interfaces/types (see spec AR-026/AR-027):
- `ICreateUserDTO`, `ICreateUserRoleDTO`, `ICreateUserPermissionDTO`
- `ICreateRolePermissionsDTO`, `ICreateUserAccessControlListDTO`
- `ICreateUserRefreshTokenDTO`, `IRequestDTO`, `IResponseDTO`, `IUserACLsDTO`

### Phase 3 — Provider Interfaces + Fakes (Cross-Cutting)

**Goal**: Define all external capability abstractions.

1. **`IHashProvider`** interface: `generateHash(payload: string) → Promise<string>`, `compareHash(payload: string, hashed: string) → Promise<boolean>`
   - Fake: `generateHash` returns the payload as-is (no hashing), `compareHash` does a direct string comparison (`payload === hashed`). This makes test assertions trivial — you can assert the stored password equals the plaintext input.
   - Real: uses bcrypt/argon2
2. **`ITokenProvider`** interface: `sign(payload, secret, options) → string`, `verify(token, secret) → payload`
   - Fake: `sign` returns a deterministic string (e.g., `"fake-token-{subject}"`), `verify` returns the payload embedded in the token (or throws for tokens not matching the expected pattern). Alternatively, use the real JWT library in tests since it's fast and deterministic.
   - Real: uses jsonwebtoken/jose/go-jwt
3. **`IDateProvider`** interface: `compareInHours(start, end)`, `convertToUTC(date)`, `dateNow()`, `compareInDays(start, end)`, `addDays(days)`
   - Fake: `dateNow()` returns a fixed, controllable date (expose a setter like `setCurrentDate(date)` for tests). `compareInHours`/`compareInDays` use real arithmetic on the provided dates. This enables deterministic time-dependent tests (e.g., testing token expiry by setting `dateNow` to 3 hours in the future).
   - Real: uses dayjs/date-fns/luxon
4. **`IMailProvider`** interface: `sendMail({ to, subject, templateData }) → Promise<void>`
   - Fake: stores sent mails in a public array property (e.g., `sentMails: Array<{ to, subject, templateData }>`). Tests assert by checking `fakeMailProvider.sentMails.length` and inspecting the captured mail objects (recipient, subject, template variables).
   - Real: uses nodemailer/SES/SendGrid

### Phase 4 — Repository Interfaces + Fakes (Layer 2)

**Goal**: Define all data access contracts.

For each of the 5 repositories, create:
1. **Interface** with the exact methods from the spec
2. **Fake implementation** using in-memory arrays/maps

| Repository | Key Methods |
|---|---|
| IUsersRepository | findById, findByEmail, getUserPermissions, getUserRoles, create, save |
| IRolesRepository | findAll, findById, findByIds, findByName, create, save |
| IPermissionsRepository | findById, findByIds, findByName, create, save |
| IUsersRefreshTokensRepository | create, findByUserIdAndRefreshToken, deleteById, deleteAllByUserId |
| IUserRecoveryTokensRepository | generate, findByToken |

### Phase 5 — Services + Unit Tests (Layer 3)

**Goal**: Implement all business logic. Write tests FIRST using fakes.

Implement in this order (dependencies build on each other):

1. **CreateUserService** + test — simplest service, validates email uniqueness, hashes password
2. **CreateRoleService** + test — validates name uniqueness
3. **CreatePermissionService** + test — validates name uniqueness
4. **CreateRolePermissionService** + test — assigns permissions to a role
5. **CreateUserAccessControlListService** + test — assigns roles + permissions to user
6. **ListUserAccessControlListService** + test — reads user's full ACL
7. **AuthenticateUserService** + test — validates credentials, generates tokens
8. **UserRefreshTokenService** + test — validates + rotates refresh tokens
9. **LogoutUserService** + test — deletes all refresh tokens for user
10. **SendForgotPasswordEmailService** + test — generates recovery token, sends email
11. **ResetPasswordService** + test — validates recovery token (2h expiry), updates password
12. **ShowProfileService** + test — returns user profile
13. **UpdateProfileService** + test — updates profile, enforces old password for changes

**Testing pattern**: Each test file instantiates the service with fake repositories/providers, exercises the happy path and error paths from the acceptance scenarios.

**Fake repository conventions**:
- Fakes store entities in an in-memory array (e.g., `private users: User[] = []`)
- `create(data)` generates a UUID for the entity, sets `created_at`/`updated_at`, pushes to the array, and returns the entity
- `findByEmail(email)` performs **case-insensitive** comparison
- `findByIds(ids)` returns only entities that match (partial results OK — no throw for missing IDs)
- `save(entity)` finds the entity by ID in the array and replaces it (or pushes if new)

**Test structure per service** (minimum assertions):
- Happy path: call `execute(validDto)` → assert return value matches expected shape
- Each error path from the acceptance scenarios: call `execute(invalidDto)` → assert it throws `AppError` with the expected message and status code
- Example for `CreateUserService`: (1) create user succeeds → returns user with hashed password, (2) duplicate email → throws "Email address already used"

### Phase 6 — ORM Repository Implementations (Layer 2 — concrete)

**Goal**: Implement real data access using your chosen ORM.

Create concrete implementations for all 5 repositories that satisfy the interfaces defined in Phase 4. These go under `infra/{orm}/repositories/`.

### Phase 7 — DI Container Registration

**Goal**: Wire everything together. The DI container registration is a **standalone bootstrap concern** — it does not belong to any of the 5 layers. It lives at the application entry point (e.g., `src/shared/container/index.ts`, `src/bootstrap.py`, `cmd/wire.go`) and executes before the HTTP server starts.

Register all singletons in your DI container:
- `'UsersRepository'` → concrete UsersRepository
- `'RolesRepository'` → concrete RolesRepository
- `'PermissionsRepository'` → concrete PermissionsRepository
- `'UsersRefreshTokensRepository'` → concrete UsersRefreshTokensRepository
- `'UsersRecoveryTokensRepository'` → concrete UserRecoveryTokensRepository
- `'HashProvider'` → concrete hash implementation
- `'TokenProvider'` → concrete token implementation (e.g., jsonwebtoken wrapper)
- `'DateProvider'` → concrete date implementation
- `'MailProvider'` → concrete mail implementation

### Phase 8 — Controllers (Layer 4)

**Goal**: Translate HTTP ↔ Service calls.

Create all 12 controllers. Each controller:
1. Resolves the service from the DI container
2. Extracts data from the request (body, params, query)
3. Calls the service
4. Returns the response (with serialization: strip password)

### Phase 9 — Middleware (Cross-Cutting)

**Goal**: Implement route protection.

1. **`ensureAuthenticated`** — Extract Bearer token → verify JWT → attach `{ id }` to request
2. **`is(roles[])`** — Load user roles → check intersection → 403 if no match
3. **`can(permissions[])`** — Load user direct permissions + role-inherited permissions → flatten into single permission name set → check intersection with required permissions → 403 if no match

### Phase 10 — Routes (Layer 5)

**Goal**: Define the API surface.

Wire all routes with middleware and validation (see [API contract](./contracts/auth-rbac-api.yaml)):

| Route Group | Middleware | Endpoints |
|---|---|---|
| Sessions | public | POST /sessions, POST /sessions/refresh-token |
| Sessions | ensureAuthenticated | POST /sessions/logout |
| Users | ensureAuthenticated + is(["admin"]) | POST /users, POST/GET /users/acl/:userId |
| Roles | ensureAuthenticated + is(["admin"]) | POST /roles, POST /roles/:roleId |
| Permissions | ensureAuthenticated + is(["admin"]) | POST /permissions |
| Password | public | POST /password/forgot, POST /password/reset |
| Profile | ensureAuthenticated | GET /profile, PUT /profile |

### Phase 11 — Global Error Handler

**Goal**: Catch all errors and format responses.

Create a global error handler middleware that:
- Catches `AppError`: returns `{ status: "error", message }` with `statusCode`
- Catches unknown errors: returns `{ status: "error", message: "Internal server error" }` with 500

### Phase 12 — Seed Command (CLI)

**Goal**: Bootstrap the first admin user.

Create an idempotent **CLI command** (e.g., `npm run seed`, `python manage.py seed`, `go run cmd/seed/main.go`). This MUST be a standalone command, NOT an automatic startup hook — running it on every app start risks unintended side effects in production. The command:
1. Creates "admin" role (if not exists)
2. Creates default permissions (if not exist)
3. Assigns permissions to admin role
4. Creates admin user from env vars (if not exists)
5. Assigns admin role to admin user

### Phase 13 — Integration Smoke Test

**Goal**: Verify the full flow end-to-end.

1. Run seed → verify admin exists
2. Login as admin → get tokens
3. Create role, permission → assign permission to role
4. Create user → assign role + permissions
5. Login as new user → verify access based on role/permissions
6. Refresh token → verify rotation
7. Logout → verify refresh token invalidated
8. Forgot password → reset → login with new password

---

## Reference Files

- **Specification**: [spec.md](./spec.md) — Full requirements (28 FRs, 27 ARs)
- **Data Model**: [data-model.md](./data-model.md) — Entity definitions with fields, types, constraints
- **API Contract**: [contracts/auth-rbac-api.yaml](./contracts/auth-rbac-api.yaml) — OpenAPI 3.0 spec
- **Research**: [research.md](./research.md) — Technology decisions and alternatives
