# Feature Specification: Portable Authentication, Session & RBAC System

**Feature Branch**: `003-portable-auth-rbac`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Extrair e especificar o sistema de autenticação, sessão e RBAC deste projeto de forma agnóstica a bibliotecas, para reprodução em outros projetos"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Login with Credentials (Priority: P1)

A user provides their email and password to authenticate. The system validates credentials, generates a short-lived access token and a long-lived refresh token, and returns both along with the user's profile (excluding sensitive data like password hashes).

**Why this priority**: Authentication is the foundational capability. Without login, no other feature (RBAC, profile, password recovery) can function. This is the minimum viable product.

**Independent Test**: Can be fully tested by sending email/password credentials and verifying that a valid access token, refresh token, and sanitized user profile are returned. Delivers immediate value as the entry point for all authenticated interactions.

**Acceptance Scenarios**:

1. **Given** a registered user with valid credentials, **When** they submit their email and password, **Then** the system returns an access token, a refresh token, and the user profile without the password hash
2. **Given** an email that does not exist in the system, **When** the user attempts to log in, **Then** the system returns a generic "incorrect email/password" error (not revealing whether the email exists)
3. **Given** a valid email but incorrect password, **When** the user attempts to log in, **Then** the system returns the same generic "incorrect email/password" error
4. **Given** a login request missing email or password, **When** submitted, **Then** the system rejects with a validation error

---

### User Story 2 - Token Refresh (Priority: P1)

An authenticated user whose access token has expired uses their refresh token to obtain a new one without re-entering credentials. The old refresh token is invalidated and a new refresh token is issued (token rotation).

**Why this priority**: Token refresh is essential for maintaining sessions without forcing frequent re-logins. It is coupled with the login flow and critical for usability.

**Independent Test**: Can be fully tested by using a valid refresh token to request a new token pair and verifying the old refresh token is invalidated.

**Acceptance Scenarios**:

1. **Given** a valid, non-expired refresh token, **When** the user requests a token refresh, **Then** the system returns a new access token AND a new refresh token, and invalidates the old refresh token
2. **Given** an expired or invalid refresh token, **When** the user requests a token refresh, **Then** the system rejects with an authentication error
3. **Given** a refresh token that has already been used (revoked), **When** the user requests a token refresh, **Then** the system rejects with an authentication error

---

### User Story 3 - Route Protection with Authentication Middleware (Priority: P1)

Protected routes require a valid access token in the request header. The system extracts and verifies the token, then attaches the user identity to the request context for downstream processing.

**Why this priority**: Without route protection, there is no way to enforce authentication on any endpoint. This is the enforcement mechanism for the entire security model.

**Independent Test**: Can be tested by sending requests to protected routes with and without valid tokens and verifying access is correctly granted or denied.

**Acceptance Scenarios**:

1. **Given** a request with a valid access token in the Authorization header (Bearer scheme), **When** the request reaches a protected route, **Then** the user identity is extracted and the request proceeds
2. **Given** a request without an Authorization header, **When** the request reaches a protected route, **Then** the system rejects with a 401 Unauthorized error
3. **Given** a request with an expired or malformed token, **When** the request reaches a protected route, **Then** the system rejects with a 401 Unauthorized error

---

### User Story 4 - Role-Based Access Control (Priority: P2)

An administrator assigns roles (e.g., "admin", "manager") and direct permissions (e.g., "create_users", "view_reports") to users. Protected routes can require specific roles or specific permissions. The system checks the authenticated user's roles and permissions before granting access.

**Why this priority**: RBAC builds on authentication to provide authorization granularity. It is the second most important capability after basic auth is functional.

**Independent Test**: Can be tested by creating roles and permissions, assigning them to users, and verifying that routes with role/permission guards correctly allow or deny access.

**Acceptance Scenarios**:

1. **Given** an authenticated user with the "admin" role, **When** they access a route requiring "admin" role, **Then** access is granted
2. **Given** an authenticated user without the "admin" role, **When** they access a route requiring "admin" role, **Then** the system returns 403 Forbidden
3. **Given** an authenticated user with the "create_users" permission assigned directly, **When** they access a route requiring "create_users" permission, **Then** access is granted
4. **Given** an authenticated user whose role has the "create_users" permission (not directly assigned), **When** they access a route requiring "create_users" permission, **Then** access is granted (role-inherited permissions are resolved)
5. **Given** an authenticated user without the required permission (neither direct nor role-inherited), **When** they access a route requiring that permission, **Then** the system returns 403 Forbidden
6. **Given** a user with roles that have associated permissions, **When** their full access control list is queried, **Then** the system returns all roles and all permissions (both direct and role-inherited)

---

### User Story 5 - RBAC Entity Management (Priority: P2)

An administrator creates and manages roles and permissions. This includes creating individual roles and permissions, assigning permissions to roles, and assigning roles and direct permissions to users.

**Why this priority**: This is the management interface for the RBAC model, required for any dynamic permission system.

**Independent Test**: Can be tested by creating roles, creating permissions, linking them, and verifying the relationships are correctly persisted.

**Acceptance Scenarios**:

1. **Given** a role name and description, **When** an admin creates a role, **Then** the role is persisted and returned with a unique identifier
2. **Given** a role name that already exists, **When** an admin tries to create it again, **Then** the system rejects with a duplicate error
3. **Given** a permission name and description, **When** an admin creates a permission, **Then** the permission is persisted and returned with a unique identifier
4. **Given** a permission name that already exists, **When** an admin tries to create it again, **Then** the system rejects with a duplicate error
5. **Given** a valid role and a list of permission identifiers, **When** an admin assigns permissions to the role, **Then** the role-permission associations are persisted
6. **Given** a valid user and lists of role and permission identifiers, **When** an admin assigns the ACL to the user, **Then** the user's roles and direct permissions are updated

---

### User Story 6 - User Registration (Priority: P2)

An administrator creates new user accounts by providing name, email, and password. Passwords are securely hashed before storage. Duplicate emails are rejected.

**Why this priority**: User creation is needed to populate the system with accounts that can then authenticate and be assigned RBAC.

**Independent Test**: Can be tested by creating a user with valid data and verifying the account exists with a hashed password, then attempting duplicate email and verifying rejection.

**Acceptance Scenarios**:

1. **Given** valid name, email, and password, **When** an admin creates a user, **Then** the user is persisted with a hashed password and returned with a unique identifier
2. **Given** an email that already exists, **When** an admin tries to create a user with that email, **Then** the system rejects with a "email already used" error
3. **Given** missing required fields, **When** a creation request is submitted, **Then** the system rejects with validation errors

---

### User Story 7 - Password Recovery (Priority: P3)

A user who has forgotten their password requests a recovery email. The system generates a unique, time-limited recovery token, sends an email with a reset link, and allows the user to set a new password using the token before it expires.

**Why this priority**: Password recovery is important for user self-service but is not required for the core auth/RBAC loop.

**Independent Test**: Can be tested by requesting a recovery token for a valid email, then using the token to reset the password and verifying the new password works for login.

**Acceptance Scenarios**:

1. **Given** a registered email, **When** the user requests password recovery, **Then** a recovery token is generated and an email is sent with a reset link
2. **Given** an unregistered email, **When** the user requests password recovery, **Then** the system responds identically to a successful request (HTTP 204, no body), preventing email enumeration per FR-021
3. **Given** a valid, non-expired recovery token and a new password (with confirmation), **When** the user submits the reset, **Then** the password is updated with a new hash
4. **Given** an expired recovery token (older than 2 hours), **When** the user submits the reset, **Then** the system rejects with a "token expired" error
5. **Given** an invalid or non-existent recovery token, **When** the user submits the reset, **Then** the system rejects with an error

---

### User Story 8 - User Profile Management (Priority: P3)

An authenticated user views and updates their own profile (name, email, password). Changing password requires providing the current password. Email uniqueness is enforced on update.

**Why this priority**: Profile management is a convenience feature that enhances user experience but is not critical for the auth/RBAC core.

**Independent Test**: Can be tested by viewing a profile and updating fields, verifying the old password requirement for password changes.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request their profile, **Then** the system returns their name, email, and other non-sensitive data
2. **Given** valid new name and email, **When** the user updates their profile, **Then** the changes are persisted
3. **Given** a new password and the correct old password, **When** the user updates their profile, **Then** the password is updated with a new hash
4. **Given** a new password without the old password, **When** the user updates their profile, **Then** the system rejects with an error requiring the old password
5. **Given** a new email that is already used by another user, **When** the user updates their profile, **Then** the system rejects with an "email already in use" error

---

### User Story 9 - Logout (Priority: P1)

An authenticated user explicitly ends their session. The system deletes all refresh tokens associated with that user, effectively terminating all active sessions. The current access token remains valid until its natural expiration (short-lived by design).

**Why this priority**: Logout is a fundamental security feature. Without it, a user cannot revoke compromised sessions. Coupled with login and refresh, it completes the session lifecycle.

**Independent Test**: Can be tested by logging in, calling logout, and verifying that all refresh tokens for the user are deleted and subsequent token refresh attempts fail.

**Acceptance Scenarios**:

1. **Given** an authenticated user with one or more active refresh tokens, **When** they request logout, **Then** all their refresh tokens are deleted
2. **Given** a user who has logged out, **When** they attempt to refresh a token, **Then** the system rejects with an authentication error
3. **Given** a user who has logged out, **When** they use their still-valid access token before it expires, **Then** the request is accepted (access token is stateless and short-lived)

---

### User Story 10 - Initial Admin Bootstrapping (Priority: P1)

On a fresh deployment with no users, an operator runs a seed/bootstrap command (CLI or startup routine) that creates the initial admin user with the "admin" role and a default set of permissions. This is the entry point that unlocks all RBAC management endpoints.

**Why this priority**: Without this, no admin exists to create other users, roles, or permissions. This is a prerequisite for the entire RBAC system to function after deployment.

**Independent Test**: Can be tested by running the seed command on an empty database and verifying the admin user, admin role, and role assignment are correctly created.

**Acceptance Scenarios**:

1. **Given** an empty system with no users, **When** the seed/bootstrap command runs, **Then** an admin user is created with the "admin" role and default permissions
2. **Given** a system where the admin user already exists, **When** the seed command runs again, **Then** it is idempotent — no duplicate users or roles are created
3. **Given** the seed command, **When** it completes, **Then** the created admin can immediately log in and access all RBAC management endpoints

---

### Edge Cases

- What happens when a user tries to refresh a token that was already rotated (replay attack)? The system should reject it.
- What happens when a user is deleted but still holds valid tokens? The refresh token becomes orphaned (user lookup fails), so token refresh will fail. The access token remains valid until natural expiry (stateless). User deactivation is out of scope (no status field); it can be addressed as a future enhancement.
- What happens when an admin assigns a non-existent role or permission ID to a user? The system should return a clear error.
- What happens when the password hashing service is unavailable? The system should fail gracefully with an internal error rather than storing plaintext.
- What happens when concurrent refresh token requests are made with the same token? Only the first should succeed; subsequent requests should be rejected.
- What happens when authorization headers use a scheme other than Bearer? The system should reject with a clear error.

## Requirements *(mandatory)*

### Architectural Requirements — Layered Separation

The system MUST follow a strict 5-layer architecture with unidirectional dependency flow:

```
Routes → Controllers → Services → Repositories → Models
```

Each layer has a single responsibility and MUST NOT bypass layers (e.g., a Controller MUST NOT call a Repository directly). In languages without compile-time dependency enforcement, this rule SHOULD be enforced via code review, linting rules (e.g., ESLint import restrictions, architectural fitness functions), or project convention documentation. **Exception**: Authentication and authorization middleware (`ensureAuthenticated`, `is()`, `can()`) are cross-cutting concerns that live in the routes/middleware layer but MAY access repositories directly (bypassing services) because they are infrastructure-level request filters, not business operations. This is the ONE accepted exception to the no-bypass rule.

#### Layer 1 — Models (Entities)

Responsibility: Define data structures, attributes, types, and relationships. No business logic, no persistence logic.

- **AR-001**: Each entity MUST extend a common Base Entity providing: unique identifier (UUID), creation timestamp, update timestamp
- **AR-002**: Models MUST define relationships declaratively (many-to-many, many-to-one) without referencing any specific ORM
- **AR-003**: Models MUST NOT contain persistence logic, HTTP logic, or business rules
- **AR-004**: Sensitive fields (e.g., password hash) MUST be marked for exclusion from serialized output. The exclusion mechanism is implementation-specific: decorators (`@Exclude()` in class-transformer), `toJSON()` overrides, serializer allowlists, or DTO mapping. The key requirement is that the `password` field MUST NEVER appear in any API response, regardless of the mechanism used. **Recommended dual mechanism**: (1) **Query-level exclusion** — repository methods that return user data (e.g., `findById`) SHOULD exclude the password field at the query level (e.g., Prisma `select`, TypeORM `select`, SQL column list). This prevents the password hash from ever being loaded into memory unnecessarily. (2) **Service/serialization-level exclusion** — as a defense-in-depth measure, the controller or service layer SHOULD also strip the password field before returning the response (e.g., `const { password: _, ...user } = rawUser`). **Asymmetry**: `findByEmail()` MUST return the password hash (it is needed by `AuthenticateUserService` to compare credentials). `findById()` and other query methods SHOULD NOT return the password hash. This intentional asymmetry is a key design decision that implementers must be aware of.

#### Layer 2 — Repositories (Data Access Interfaces)

Responsibility: Define abstract contracts for data persistence and retrieval. Each entity that requires persistence MUST have a corresponding repository interface.

- **AR-005**: Every repository MUST be defined as an interface (contract) separate from its implementation. All repository methods MUST be asynchronous (return promises/futures) to support both synchronous in-memory fakes and asynchronous ORM implementations transparently.
- **AR-006**: Repository implementations (using any ORM: TypeORM, Prisma, Drizzle, Sequelize, etc.) MUST satisfy the interface without changing it
- **AR-007**: Each repository MUST also have a fake/in-memory implementation for unit testing. Fake repositories MUST generate UUIDs internally when `create()` is called (the caller does NOT provide IDs). Fake `findByEmail` MUST perform case-insensitive matching to mirror database behavior. Fake `findByIds` MUST return only the entities that exist (partial matches) — it does NOT throw if some IDs are missing.
- **AR-008**: Repositories MUST NOT contain business logic — only CRUD operations and specific queries

**Required Repository Interfaces:**

| Repository Interface | Required Methods (all async) |
|---|---|
| **IUsersRepository** | `findById(id: string) → User | null`, `findByEmail(email: string) → User | null`, `getUserPermissions(id: string) → Permission[]` (returns ONLY the user's direct permissions array), `getUserRoles(id: string) → Role[]` (returns the user's roles array; each Role MUST include its `permissions` relationship loaded — this is required by the `can()` middleware per AR-025), `create(data: ICreateUserDTO) → User`, `save(user: User) → User` |
| **IRolesRepository** | `findAll() → Role[]`, `findById(id: string) → Role | null`, `findByIds(ids: string[]) → Role[]`, `findByName(name: string) → Role | null`, `create(data: ICreateRoleDTO) → Role`, `save(role: Role) → Role` |
| **IPermissionsRepository** | `findById(id: string) → Permission | null`, `findByIds(ids: string[]) → Permission[]`, `findByName(name: string) → Permission | null`, `create(data: ICreatePermissionDTO) → Permission`, `save(permission: Permission) → Permission` |
| **IUsersRefreshTokensRepository** | `create(data: ICreateUserRefreshTokenDTO) → UserRefreshToken`, `findByUserIdAndRefreshToken(userId: string, token: string) → UserRefreshToken | null`, `deleteById(id: string) → void`, `deleteAllByUserId(userId: string) → void` |
| **IUserRecoveryTokensRepository** | `generate(userId: string) → UserRecoveryToken` (creates a new recovery token record with an auto-generated UUID token value and associates it with the given userId — the caller provides ONLY the userId, the repository generates the token internally), `findByToken(token: string) → UserRecoveryToken | null` |

#### Layer 3 — Services (Business Logic)

Responsibility: Contain ALL business rules, validations, orchestration, and domain logic. Services receive dependencies (repositories, providers) via dependency injection through their constructor.

- **AR-009**: Each service MUST receive its dependencies through constructor injection, depending only on interfaces (never concrete implementations)
- **AR-010**: Services MUST NOT access HTTP request/response objects — they receive plain data (DTOs) and return plain data or domain entities
- **AR-011**: Services MUST throw domain-specific errors (with message and status code) for business rule violations. `AppError` is a throwable/catchable class (MUST extend the language's native error/exception base class) with two fields: `message` (human-readable string) and `statusCode` (HTTP status integer, default 400). It is the ONLY error type that services throw for expected business rule violations. Unexpected errors (e.g., database connection failure) propagate as native exceptions and are caught by the global error handler (FR-029).
- **AR-012**: Each distinct business operation MUST be encapsulated in its own service class (single responsibility). All services MUST expose a single public method named `execute(dto)` (or `handle(dto)` — pick one convention per project and use it consistently). This method receives the service's DTO and returns the result.

**Required Services:**

| Service | Responsibility | Dependencies (interfaces) |
|---|---|---|
| **AuthenticateUserService** | Validate credentials, generate access token + refresh token | IUsersRepository, IHashProvider, ITokenProvider, IUsersRefreshTokensRepository, IDateProvider |
| **UserRefreshTokenService** | Validate refresh token, rotate (delete old, create new), issue new access token | IUsersRefreshTokensRepository, ITokenProvider, IDateProvider |
| **CreateUserService** | Register user with hashed password, enforce unique email | IUsersRepository, IHashProvider |
| **CreateRoleService** | Create role, enforce unique name | IRolesRepository |
| **CreatePermissionService** | Create permission, enforce unique name | IPermissionsRepository |
| **CreateRolePermissionService** | Assign permissions to a role | IRolesRepository, IPermissionsRepository |
| **CreateUserAccessControlListService** | Assign roles and direct permissions to a user | IUsersRepository, IRolesRepository, IPermissionsRepository |
| **ListUserAccessControlListService** | Retrieve a user's full ACL (roles + permissions) | IUsersRepository |
| **SendForgotPasswordEmailService** | Generate recovery token, send email with reset link | IUsersRepository, IMailProvider, IUserRecoveryTokensRepository |
| **ResetPasswordService** | Validate recovery token (2h expiry), update password hash | IUsersRepository, IUserRecoveryTokensRepository, IHashProvider |
| **LogoutUserService** | Delete all refresh tokens for the authenticated user | IUsersRefreshTokensRepository |
| **ShowProfileService** | Retrieve authenticated user's profile | IUsersRepository |
| **UpdateProfileService** | Update name/email/password, enforce old password for changes, enforce unique email | IUsersRepository, IHashProvider |

#### Layer 4 — Controllers

Responsibility: Translate HTTP requests into service calls and service results into HTTP responses. Controllers MUST NOT contain business logic.

- **AR-013**: Controllers MUST resolve service instances via the dependency injection container (not instantiate them directly)
- **AR-014**: Controllers MUST extract data from the HTTP request (body, params, query, headers), call the appropriate service, and format the HTTP response
- **AR-015**: Controllers MUST handle serialization concerns (e.g., stripping sensitive fields from the response)
- **AR-016**: Controllers MUST NOT call repositories directly — only services

**Required Controllers:**

| Controller | HTTP Action | Service Called |
|---|---|---|
| **SessionsController** | POST (create session) | AuthenticateUserService |
| **UsersRefreshTokensController** | POST (refresh token) | UserRefreshTokenService |
| **LogoutController** | POST (logout) | LogoutUserService |
| **UsersController** | POST (create user) | CreateUserService |
| **RolesController** | POST (create role) | CreateRoleService |
| **PermissionsController** | POST (create permission) | CreatePermissionService |
| **CreateRolePermissionController** | POST (assign permissions to role) | CreateRolePermissionService |
| **CreateUserAccessControlListController** | POST (assign ACL to user) | CreateUserAccessControlListService |
| **ListUserAccessControlListController** | GET (list user ACL) | ListUserAccessControlListService |
| **ForgotPasswordController** | POST (request recovery) | SendForgotPasswordEmailService |
| **ResetPasswordController** | POST (reset password) | ResetPasswordService |
| **ProfileController** | GET (show), PUT (update) | ShowProfileService, UpdateProfileService |

#### Layer 5 — Routes

Responsibility: Map HTTP endpoints (method + path) to controllers, apply middleware (authentication, authorization, input validation), and define the API surface.

- **AR-017**: Routes MUST apply input validation (schema-based) before the request reaches the controller
- **AR-018**: Routes MUST apply authentication middleware (`ensureAuthenticated`) on protected endpoints
- **AR-019**: Routes MUST apply authorization middleware (`is(roles[])` for role checks, `can(permissions[])` for permission checks) on restricted endpoints
- **AR-020**: Routes MUST NOT contain business logic or data access logic

**Required Route Groups:**

| Route Group | Endpoints | Middleware |
|---|---|---|
| **Sessions** | `POST /sessions` (login), `POST /sessions/refresh-token`, `POST /sessions/logout` | Login/refresh: input validation only (public); Logout: ensureAuthenticated |
| **Users** | `POST /users` (create), `POST /users/acl/:userId`, `GET /users/acl/:userId` | ensureAuthenticated + is(["admin"]) + validation |
| **Roles** | `POST /roles` (create), `POST /roles/:roleId` (assign permissions) | ensureAuthenticated + is(["admin"]) + validation |
| **Permissions** | `POST /permissions` (create) | ensureAuthenticated + is(["admin"]) + validation |
| **Password** | `POST /password/forgot`, `POST /password/reset` | Input validation only (public) |
| **Profile** | `GET /profile`, `PUT /profile` | ensureAuthenticated + validation |

### Middleware Execution Order

For protected routes, middleware MUST execute in the following order:

```text
input validation → ensureAuthenticated → is()/can() → controller
```

**Rationale**: The `is()` and `can()` middleware depend on `req.user` (or equivalent request context) being populated by `ensureAuthenticated`. If `is()`/`can()` execute before `ensureAuthenticated`, they will fail because the user identity is not yet available. Input validation runs first to reject malformed requests before any authentication/authorization overhead.

**Example (Express-style)**:

```text
router.post('/users',
  validateCreateUser,        // 1. Reject invalid input early
  ensureAuthenticated,       // 2. Verify JWT, attach req.user
  is(['admin']),             // 3. Check role (uses req.user.id)
  usersController.create     // 4. Execute business logic
);
```

### Cross-Cutting Concerns — Provider Interfaces

The system uses provider interfaces to abstract external capabilities that vary across implementations.

- **AR-021**: All providers MUST be defined as interfaces with a corresponding fake implementation for testing
- **AR-022**: Provider implementations MUST be registered via the dependency injection container and MUST be swappable without changing service code

**Required Provider Interfaces:**

| Provider Interface | Methods | Purpose |
|---|---|---|
| **IHashProvider** | `generateHash(payload: string) → Promise<string>`, `compareHash(payload: string, hashed: string) → Promise<boolean>` | Password hashing (bcrypt, argon2, scrypt, etc.). Methods are async to support algorithms with inherent async behavior (e.g., bcrypt). Synchronous implementations MUST wrap results in resolved promises. |
| **ITokenProvider** | `sign(payload: Record<string, unknown>, secret: string, options: { subject: string, expiresIn: string }) → string`, `verify(token: string, secret: string) → Record<string, unknown>` | Token generation and verification (jsonwebtoken, jose, go-jwt, jjwt, etc.). `sign` returns the signed token string. `verify` returns the decoded payload or throws on invalid/expired tokens. |
| **IDateProvider** | `compareInHours(start: Date, end: Date) → number`, `convertToUTC(date: Date) → string`, `dateNow() → Date`, `compareInDays(start: Date, end: Date) → number`, `addDays(days: number) → Date` | Date arithmetic (dayjs, date-fns, luxon, etc.). `compareInHours`/`compareInDays` return positive values if `end` is after `start`, negative if before. `dateNow()` returns current time in UTC. `convertToUTC` returns ISO-8601 string. |
| **IMailProvider** | `sendMail({ to: string, subject: string, templateData: { variables: Record<string, string>, template: string } }) → Promise<void>` | Email delivery (nodemailer, SES, SendGrid, etc.). `template` is an opaque identifier (file path, template ID, or inline content) — the provider implementation decides how to resolve it. This keeps the service layer agnostic to the mail provider's template mechanism. |
| **IStorageProvider** | `saveFile(file: string) → Promise<string>`, `deleteFile(file: string) → Promise<void>` | File storage for avatars (local, S3, etc.) — optional |

### Middleware Contracts

- **AR-023**: Authentication middleware (`ensureAuthenticated`) MUST extract the Bearer token from the Authorization header, verify it, and attach the user identity (`{ id }`) to the request context
- **AR-024**: Role authorization middleware (`is(roles[])`) MUST load the user's roles and check if any match the required roles; return 403 Forbidden if not
- **AR-025**: Permission authorization middleware (`can(permissions[])`) MUST load both the user's direct permissions AND permissions inherited from the user's roles, then check if any match the required permissions; return 403 Forbidden if not (the user IS authenticated but lacks the required permission — 403 is semantically correct per FR-022). **Resolution strategy**: The middleware loads the user with their direct permissions AND all roles (with each role's permissions). It flattens all permission names into a single set: `Set(user.permissions[].name) ∪ Set(user.roles[].permissions[].name)`. It then checks whether the intersection with the required permissions is non-empty. This MAY be implemented as a single query with joins, two separate queries merged in memory, or a dedicated repository method — the approach is an implementation detail. **OR logic (default)**: The `can()` middleware uses **OR semantics** (`Array.some()` / set intersection non-empty) — the user needs **at least one** of the listed permissions to pass. Example: `can(["create_users", "manage_users"])` grants access if the user has either `create_users` OR `manage_users`. If AND semantics are needed (user must have ALL listed permissions), implementers SHOULD create a separate `canAll()` middleware rather than changing `can()` behavior.

### Token Specification

- **AR-028**: Access tokens MUST contain the claim `{ sub: <userId> }` as the payload. They are signed with the `APP_SECRET` environment variable. Recommended signing algorithm: HS256 (HMAC-SHA256) for symmetric secrets. RS256 may be used if asymmetric key pairs are preferred but is not required.
- **AR-029**: Refresh tokens MUST contain the claims `{ sub: <userId>, email: <userEmail> }` as the payload. They are signed with the `APP_SECRET_REFRESH_TOKEN` environment variable (a DIFFERENT secret than the access token). **Note on email claim**: The `email` field is included in the refresh token payload as a convenience for token introspection (e.g., logging, debugging, admin dashboards). It is NOT used by the `UserRefreshTokenService` for business logic — the service identifies the user by `sub` (userId) only. Implementers MAY omit the `email` claim if their project does not need it; the system will function correctly with `{ sub: <userId> }` alone.
- **AR-030**: The `ensureAuthenticated` middleware MUST verify access tokens using `APP_SECRET`. It MUST NOT use the refresh token secret.
- **AR-031**: The token refresh endpoint MUST verify the incoming refresh token using `APP_SECRET_REFRESH_TOKEN`, then issue BOTH a new access token (signed with `APP_SECRET`) AND a new refresh token (signed with `APP_SECRET_REFRESH_TOKEN`). The old refresh token MUST be deleted (token rotation).
- **AR-032**: Recommended production token expiration values: access token 15 minutes to 1 hour, refresh token 7 to 30 days. The reference project uses 90 days for access tokens which is NOT recommended for production. All expiration values MUST be configurable via environment variables.

#### AR-033 — findByIds Behavior in Real Repositories

The `findByIds(ids)` method in repository interfaces (`IRolesRepository`, `IPermissionsRepository`) returns only the entities that exist in the database — it performs **partial matching**. If 3 IDs are provided but only 2 exist, the method returns 2 entities without throwing an error. This "silent assignment" pattern is the **default behavior** specified for both fake and real (ORM-backed) repositories.

**Recommendation for production**: Implementers SHOULD consider adding **strict validation** at the service layer for critical operations: compare `findByIds(ids).length` against `ids.length` and throw an `AppError` if they differ. This prevents silent data loss where an admin believes they assigned 5 permissions but only 3 were valid. The spec defaults to "silent assignment" for simplicity, but strict validation is the safer choice for production systems.

### Configuration & Environment Variables

The following environment variables MUST be documented and supported:

| Variable | Purpose | Required |
|---|---|---|
| `APP_SECRET` | Secret key for signing access tokens | Yes |
| `APP_SECRET_REFRESH_TOKEN` | Secret key for signing refresh tokens (MUST differ from APP_SECRET) | Yes |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token expiration (e.g., "15m", "1h") | Yes (default: "1h") |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration (e.g., "7d", "30d") | Yes (default: "30d") |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Numeric days for refresh token DB expiry calculation | Yes (default: 30) |
| `ADMIN_EMAIL` | Initial admin user email for seed | Yes (seed only) |
| `ADMIN_PASSWORD` | Initial admin user password for seed | Yes (seed only) |
| `ADMIN_NAME` | Initial admin user name for seed | Yes (seed only) |
| `APP_API_URL` | Base API URL (used for avatar URL computation) | Yes |
| `APP_WEB_URL` | Frontend URL (used for password reset links in emails) | Yes |

**Security note**: Environment variable defaults (e.g., `APP_SECRET || 'default-dev-secret'`) are acceptable ONLY for local development convenience. Production deployments MUST set real, cryptographically random secrets via environment variables. Fallback values like `'default-dev-secret'` MUST NOT be used in production — they are predictable and allow token forgery. Implementers SHOULD add a startup check that fails loudly if secrets are still set to development defaults in a production environment (e.g., `if (process.env.NODE_ENV === 'production' && secret === 'default-dev-secret') throw new Error(...)`).

**Auth configuration** SHOULD be organized into a single config structure that can be loaded at application startup:

```
authConfig = {
  accessToken: { secret: APP_SECRET, expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  refreshToken: { secret: APP_SECRET_REFRESH_TOKEN, expiresIn: REFRESH_TOKEN_EXPIRES_IN, expiresDays: REFRESH_TOKEN_EXPIRES_DAYS }
}
```

### Data Transfer Objects (DTOs)

- **AR-026**: Each service MUST receive input via a defined DTO interface (not raw HTTP request objects)
- **AR-027**: DTOs define the contract between controllers and services, keeping layers decoupled

**Required DTOs:**

| DTO | Fields | Used By |
|---|---|---|
| **ICreateUserDTO** | name, email, password | CreateUserService |
| **ICreateRoleDTO** | name, description | CreateRoleService |
| **ICreatePermissionDTO** | name, description | CreatePermissionService |
| **ICreateRolePermissionsDTO** | roleId, permissions[] | CreateRolePermissionService |
| **ICreateUserAccessControlListDTO** | userId, roles[], permissions[] | CreateUserAccessControlListService |
| **ICreateUserRefreshTokenDTO** | user_id, expires_date, refresh_token | IUsersRefreshTokensRepository |
| **IRequestDTO** (Login) | email: string, password: string | AuthenticateUserService |
| **IResponseDTO** (Login) | user: SanitizedUser (User without password), token: string, refresh_token: string | AuthenticateUserService |
| **ILogoutDTO** | user_id: string | LogoutUserService |
| **IShowProfileDTO** | user_id: string | ShowProfileService |
| **IUpdateProfileDTO** | user_id: string, name?: string, email?: string, old_password?: string, password?: string | UpdateProfileService |
| **IUserACLsDTO** | userId: string, name: string, roles: Role[], permissions: Permission[] | ListUserAccessControlListService |

**Note on IUpdateProfileDTO**: `name` and `email` are optional because a user may update only one field (e.g., just the name). The service MUST guard against `undefined` values — when `name` or `email` is not provided, the service MUST keep the user's current value (e.g., `user.name = dto.name ?? user.name`). This prevents accidentally setting fields to `undefined` or `null`.

### Functional Requirements

- **FR-001**: System MUST authenticate users using email and password credentials
- **FR-002**: System MUST hash passwords before storage using a configurable one-way hashing mechanism
- **FR-003**: System MUST generate short-lived access tokens upon successful authentication
- **FR-004**: System MUST generate long-lived refresh tokens upon successful authentication
- **FR-005**: System MUST support token refresh with rotation (old refresh token invalidated, new one issued)
- **FR-006**: System MUST protect routes via authentication middleware that validates access tokens from the Authorization header (Bearer scheme)
- **FR-007**: System MUST extract authenticated user identity from the token and attach it to the request context
- **FR-008**: System MUST support role-based route protection (e.g., only "admin" role can access certain routes)
- **FR-009**: System MUST support permission-based route protection (e.g., only users with "create_users" permission)
- **FR-010**: System MUST support many-to-many relationships: users-to-roles, users-to-permissions, and roles-to-permissions
- **FR-011**: System MUST allow creation of roles with name and description (unique name enforced)
- **FR-012**: System MUST allow creation of permissions with name and description (unique name enforced)
- **FR-013**: System MUST allow assignment of permissions to roles
- **FR-014**: System MUST allow assignment of roles and direct permissions to users (Access Control List)
- **FR-015**: System MUST allow querying a user's full ACL (all roles and all permissions)
- **FR-016**: System MUST support user registration with name, email, and password (unique email enforced)
- **FR-017**: System MUST support password recovery via time-limited recovery tokens (2-hour expiry) sent by email
- **FR-018**: System MUST support password reset using a valid recovery token with password confirmation
- **FR-019**: System MUST support viewing and updating the authenticated user's profile
- **FR-020**: System MUST require the current password when changing to a new password
- **FR-021**: System MUST return generic error messages for failed login attempts (not revealing whether email exists)
- **FR-022**: System MUST return 401 for unauthenticated access and 403 for authenticated but unauthorized access
- **FR-023**: System MUST validate all inputs (email format, required fields, password confirmation match)
- **FR-024**: System MUST exclude sensitive fields (password hash) from user data returned in responses
- **FR-025**: System MUST support configurable token expiration times for both access and refresh tokens
- **FR-026**: System MUST provide a seed/bootstrap mechanism implemented as a **standalone CLI command** (e.g., `npm run seed`, `python manage.py seed`, `go run cmd/seed/main.go`). It MUST NOT run automatically on application startup to avoid unintended side effects in production. The seed creates: (1) the `admin_full_access` permission, (2) the `admin` role with `admin_full_access` assigned, and (3) the admin user (from env vars) with the `admin` role. This is the minimum required set — implementers MAY add additional default permissions as needed for their project.
- **FR-027**: System MUST support explicit logout that deletes all refresh tokens for the authenticated user, terminating all active sessions; the access token remains valid until its natural expiration
- **FR-028**: System MUST return all error responses in a consistent, project-canonical format with the appropriate HTTP status code in the response header (e.g., 400, 401, 403, 404). **Reference format**: `{ status: "error", message: "<description>" }`. Implementers SHOULD adapt this to their project's existing error response convention (e.g., `{ errors: ["message"] }`, `{ error: { code, message } }`, etc.). The key requirement is consistency — all error responses in the project MUST use the same shape.
- **FR-029**: System MUST implement a global error handler middleware that catches all errors at the HTTP boundary. For `AppError` instances, it returns the error's `message` and `statusCode` in the project's canonical error format. For unknown/unexpected errors, it returns a generic "Internal server error" message with HTTP 500. This middleware MUST be registered as the last middleware in the HTTP pipeline. **Note**: Projects with an existing centralized error handler SHOULD integrate `AppError` into it rather than creating a second error handler. The error handler MAY coexist with per-controller error handling if the project convention requires it, but `AppError` propagation from services MUST always be caught at the HTTP boundary.

### Standard Error Messages

The following error messages MUST be used consistently across implementations to ensure API clients can rely on predictable responses:

| Service/Context | Condition | Message | Status Code |
|---|---|---|---|
| AuthenticateUserService | User not found or password mismatch | "Incorrect email/password combination" | 401 |
| CreateUserService | Email already registered | "Email address already used" | 400 |
| CreateRoleService | Role name already exists | "Role already exists" | 400 |
| CreatePermissionService | Permission name already exists | "Permission already exists" | 400 |
| ResetPasswordService | Token expired (> 2 hours) | "Token expired" | 400 |
| ResetPasswordService | Token not found | "Token does not exist" | 400 |
| UpdateProfileService | Old password not provided when changing password | "Old password is required to set a new password" | 400 |
| UpdateProfileService | Old password is incorrect | "Old password does not match" | 400 |
| UpdateProfileService | Email already used by another user | "Email address already used" | 400 |
| ShowProfileService / UpdateProfileService | User not found | "User not found" | 400 |
| ensureAuthenticated | Missing or invalid token | "Invalid authentication token" | 401 |
| is() middleware | User lacks required role | "User does not have the required role" | 403 |
| can() middleware | User lacks required permission | "User does not have the required permission" | 403 |
| UserRefreshTokenService | Invalid/expired refresh token | "Refresh token does not exist" | 400 |
| CreateRolePermissionService | Role not found by roleId | "Role not found" | 400 |
| CreateUserAccessControlListService | User not found by userId | "User not found" | 400 |
| ListUserAccessControlListService | User not found by userId | "User not found" | 400 |
| ResetPasswordService | Password and confirmation do not match | "Password confirmation does not match" | 400 |
| Global error handler | Unexpected error | "Internal server error" | 500 |

### Key Entities

- **User**: Represents an authenticated account. Key attributes: unique identifier, name, email (unique), password hash, avatar (optional), creation timestamp, update timestamp. Has many-to-many relationships with Roles and Permissions.
- **Role**: Represents a named authorization group. Key attributes: unique identifier, name (unique), description, creation timestamp, update timestamp. Has many-to-many relationship with Permissions.
- **Permission**: Represents a specific authorization grant. Key attributes: unique identifier, name (unique), description, creation timestamp, update timestamp.
- **Refresh Token**: Represents a long-lived session token. Key attributes: unique identifier, token value, user reference, expiration date, creation timestamp, update timestamp.
- **Recovery Token**: Represents a time-limited password reset token. Key attributes: unique identifier, token value (UUID), user reference, creation timestamp.
- **Base Entity**: All entities share a common base with: unique identifier (UUID), creation timestamp, update timestamp.

### Relationship Tables

- **users_roles**: Links users to roles (user identifier, role identifier)
- **users_permissions**: Links users to direct permissions (user identifier, permission identifier)
- **permissions_role**: Links roles to permissions (role identifier, permission identifier)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the login flow (submit credentials, receive tokens) in under 2 seconds
- **SC-002**: Token refresh completes in under 500 milliseconds
- **SC-003**: Authentication middleware adds no more than 100 milliseconds overhead per request
- **SC-004**: 100% of protected routes correctly reject unauthenticated requests (no bypass possible)
- **SC-005**: 100% of role/permission-guarded routes correctly enforce authorization (no privilege escalation possible)
- **SC-006**: Password recovery email is triggered within 5 seconds of the request
- **SC-007**: All user-facing error messages are generic enough to prevent information disclosure (no email enumeration on login)
- **SC-008**: The system can be implemented with any ORM, hashing library, token library, or dependency injection framework without changing the business logic or interfaces
- **SC-009**: All repository, hash provider, date provider, and token provider interfaces are fully decoupled from their implementations
- **SC-010**: An integration smoke test covering the full flow (register → login → access profile) completes successfully without manual intervention

## Out-of-Scope but Recommended Extensions

The following capabilities are intentionally excluded from this core specification but are strongly recommended for production deployments:

- **Rate limiting**: Apply rate limiting to authentication endpoints (`POST /sessions`, `POST /password/forgot`, `POST /password/reset`) to prevent brute-force attacks. Recommended: 5–10 attempts per minute per IP for login, 3 attempts per hour per email for password recovery.
- **CORS configuration**: Configure Cross-Origin Resource Sharing headers appropriate to the deployment environment. Restrict allowed origins to the frontend domain(s) in production.
- **Audit logging**: Log authentication events (login success/failure, logout, password reset, role/permission changes) for security auditing and incident investigation.
- **Account lockout**: Temporarily lock accounts after repeated failed login attempts (e.g., 5 failures within 15 minutes → 30-minute lockout). Requires adding a `failed_attempts` counter and `locked_until` timestamp to the User entity.
- **Token blacklisting**: For immediate access token revocation (e.g., on password change or account compromise), maintain a blacklist of revoked access token JTIs checked by `ensureAuthenticated`. This adds statefulness to access token validation but provides stronger security guarantees.
- **Atomic refresh token rotation**: The current spec deletes the old refresh token and creates a new one as separate operations. In high-concurrency scenarios, a race condition can occur where two concurrent refresh requests both succeed with the same token. For production, consider wrapping the delete+create in a database transaction or using an atomic compare-and-swap mechanism.
- **Password complexity rules**: The spec requires only a minimum length (6 characters recommended). Production systems SHOULD enforce additional complexity rules (uppercase, lowercase, digit, special character) configurable per project policy.

## Clarifications

### Session 2026-02-24

- Q: How is the first admin user created in a fresh deployment (chicken-and-egg problem)? → A: A dedicated seed/bootstrap command creates the initial admin user and role on first deploy
- Q: How does a user explicitly end their session (logout)? → A: Logout deletes all refresh tokens for the user; access token expires naturally
- Q: Should permission middleware check only direct user permissions or also role-inherited ones? → A: Both — direct user permissions AND permissions inherited from the user's roles
- Q: Should the User entity have a status field (active/inactive) with middleware enforcement? → A: No — keep simple, no status field; matches reference implementation. Deactivation can be a future enhancement.
- Q: Should the spec prescribe a standard error response format for the API? → A: Yes — simple format: `{ status: "error", message: "..." }` with HTTP status code in the response header

## Assumptions

- The system targets server-side web applications using a request/response model (not real-time or event-driven architectures)
- Token-based authentication using signed tokens (e.g., JWT) is the expected mechanism, but the specification does not mandate a specific token format
- The hashing mechanism is abstracted behind a provider interface; implementations may use bcrypt, argon2, scrypt, etc.
- Date/time operations are abstracted behind a provider interface to enable testability and timezone consistency
- Dependency injection is used to wire services and repositories, but the specific DI container is not prescribed
- Email delivery for password recovery is abstracted behind a mail provider interface
- The system uses UUIDs as primary identifiers for all entities
- Access token expiry is configurable via `ACCESS_TOKEN_EXPIRES_IN` (recommended production range: 15 minutes to 1 hour; the reference project's 90-day default is NOT suitable for production — see AR-032)
- Refresh token expiry is configurable via `REFRESH_TOKEN_EXPIRES_IN` (recommended: 7–30 days, default: 30 days)
- Recovery token expiry is 2 hours (hardcoded business rule)
- Input validation is performed at the request boundary (controller/route level) before reaching business logic
- The "admin" role is the default administrative role used for RBAC management endpoints, but the role names are configurable
- File upload for user avatars is considered optional/out of scope for the core auth/RBAC specification
- Rate limiting is recommended but considered an infrastructure concern, not part of the core auth specification
- List (findAll/paginated) and delete operations for Users, Roles, and Permissions are intentionally out of scope for this core specification. The repository interfaces include only the methods required by the defined services. Implementers SHOULD add `findAll()`, `delete(id)`, and pagination methods as needed for their admin UI, but these are project-specific extensions.
- The DI container registration file is a standalone bootstrap concern (not part of any layer). It lives at the application entry point and wires all interfaces to concrete implementations before the HTTP server starts.
