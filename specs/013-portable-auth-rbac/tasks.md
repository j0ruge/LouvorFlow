# Tasks: Portable Authentication, Session & RBAC System

**Input**: Design documents from `/specs/003-portable-auth-rbac/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/auth-rbac-api.yaml, research.md, quickstart.md

**Tests**: Unit tests for all 13 services are included because the architecture explicitly defines fake repositories and providers for testing (AR-007, AR-021), and the project structure includes test files for every service.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (modular monolith)**: `src/` at repository root
- Entity models: `src/modules/users/infra/{orm}/entities/`
- Repository interfaces + fakes: `src/modules/users/repositories/`
- Concrete ORM repos: `src/modules/users/infra/{orm}/repositories/`
- Services: `src/modules/users/services/`
- Controllers: `src/modules/users/infra/http/controllers/`
- Routes: `src/modules/users/infra/http/routes/`
- Providers: `src/modules/users/providers/{ProviderName}/`
- Tests: `src/tests/unit/modules/users/services/`
- `{ext}` = file extension for chosen language (e.g., `.ts`, `.py`, `.go`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, configuration, and shared error handling

- [x] T001 Create project directory structure per plan.md Project Structure section
- [x] T002 [P] Configure environment variables and auth config in src/config/auth.{ext} and src/config/env.{ext} per spec Configuration & Environment Variables section (APP_SECRET, APP_SECRET_REFRESH_TOKEN, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_DAYS, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, APP_API_URL, APP_WEB_URL)
- [x] T003 [P] Create AppError class extending native Error with message and statusCode (default 400) in src/shared/errors/AppError.{ext} per AR-011

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All entities, DTOs, provider/repository interfaces with fakes, concrete implementations, DI wiring, and global error handler. MUST be complete before ANY user story can begin.

**CRITICAL**: No user story work can begin until this phase is complete

### Entities (Layer 1 — Models)

- [x] T004 Create BaseEntity with id (UUID v4), created_at, updated_at in src/modules/users/infra/{orm}/entities/BaseEntity.{ext} per AR-001
- [x] T005 [P] Create User entity extending BaseEntity with name, email (unique), password (excluded from serialization per AR-004), avatar (nullable), avatar_url (computed getter: {APP_API_URL}/files/{avatar}), M:N relationships to Roles and Permissions (eager-loaded) in src/modules/users/infra/{orm}/entities/User.{ext}
- [x] T006 [P] Create Role entity extending BaseEntity with name (unique), description, M:N relationship to Permissions in src/modules/users/infra/{orm}/entities/Role.{ext}
- [x] T007 [P] Create Permission entity extending BaseEntity with name (unique), description in src/modules/users/infra/{orm}/entities/Permission.{ext}
- [x] T008 [P] Create UserRefreshToken entity extending BaseEntity with refresh_token, user_id (FK -> users, ON DELETE CASCADE), expires_date in src/modules/users/infra/{orm}/entities/UserRefreshToken.{ext}
- [x] T009 [P] Create UserRecoveryToken entity extending BaseEntity with token (UUID, auto-generated), user_id (FK -> users, ON DELETE CASCADE) in src/modules/users/infra/{orm}/entities/UserRecoveryToken.{ext}
- [x] T010 Create database migration for all tables (users, roles, permissions, users_refresh_tokens, users_recovery_tokens) and join tables (users_roles, users_permissions, permissions_role) with composite PKs and FK cascades per data-model.md

### DTOs (AR-026, AR-027)

- [x] T011 [P] Create all DTO interfaces in src/modules/users/dtos/: ICreateUserDTO (name, email, password), ICreateRoleDTO (name, description), ICreatePermissionDTO (name, description), ICreateRolePermissionsDTO (roleId, permissions[]), ICreateUserAccessControlListDTO (userId, roles[], permissions[]), ICreateUserRefreshTokenDTO (user_id, expires_date, refresh_token), IRequestDTO (email, password), IResponseDTO (user, token, refresh_token), ILogoutDTO (user_id), IShowProfileDTO (user_id), IUpdateProfileDTO (user_id, name, email, old_password?, password?), IUserACLsDTO (userId, name, roles, permissions)

### Provider Interfaces + Fakes (AR-021, AR-022)

- [x] T012 [P] Create IHashProvider interface (generateHash, compareHash — both async) in src/modules/users/providers/HashProvider/models/IHashProvider.{ext} and FakeHashProvider (generateHash returns payload as-is, compareHash does direct string comparison) in src/modules/users/providers/HashProvider/fakes/FakeHashProvider.{ext}
- [x] T013 [P] Create ITokenProvider interface (sign, verify) in src/modules/users/providers/TokenProvider/models/ITokenProvider.{ext} and FakeTokenProvider (sign returns deterministic "fake-token-{subject}", verify parses subject from "fake-token-{subject}" format and returns `{ sub: subject }` or throws on unrecognized format) in src/modules/users/providers/TokenProvider/fakes/FakeTokenProvider.{ext}
- [x] T014 [P] Create IDateProvider interface (compareInHours, convertToUTC, dateNow, compareInDays, addDays) in src/modules/users/providers/DateProvider/models/IDateProvider.{ext} and FakeDateProvider (dateNow returns controllable fixed date via setter, compare methods use real arithmetic) in src/modules/users/providers/DateProvider/fakes/FakeDateProvider.{ext}
- [x] T015 [P] Create IMailProvider interface (sendMail with to, subject, templateData) in src/modules/users/providers/MailProvider/models/IMailProvider.{ext} and FakeMailProvider (stores sent mails in public sentMails array) in src/modules/users/providers/MailProvider/fakes/FakeMailProvider.{ext}

### Repository Interfaces + Fakes (AR-005, AR-006, AR-007)

- [x] T016 [P] Create IUsersRepository interface (findById, findByEmail, getUserPermissions, getUserRoles, create, save — all async) in src/modules/users/repositories/IUsersRepository.{ext} and FakeUsersRepository (in-memory array, UUID generation on create, case-insensitive findByEmail) in src/modules/users/repositories/fakes/FakeUsersRepository.{ext}
- [x] T017 [P] Create IRolesRepository interface (findAll, findById, findByIds, findByName, create, save — all async) in src/modules/users/repositories/IRolesRepository.{ext} and FakeRolesRepository (in-memory array, UUID generation on create, findByIds returns partial matches) in src/modules/users/repositories/fakes/FakeRolesRepository.{ext}
- [x] T018 [P] Create IPermissionsRepository interface (findById, findByIds, findByName, create, save — all async) in src/modules/users/repositories/IPermissionsRepository.{ext} and FakePermissionsRepository (in-memory array, UUID generation on create, findByIds returns partial matches) in src/modules/users/repositories/fakes/FakePermissionsRepository.{ext}
- [x] T019 [P] Create IUsersRefreshTokensRepository interface (create, findByUserIdAndRefreshToken, deleteById, deleteAllByUserId — all async) in src/modules/users/repositories/IUsersRefreshTokensRepository.{ext} and FakeUsersRefreshTokensRepository (in-memory array) in src/modules/users/repositories/fakes/FakeUsersRefreshTokensRepository.{ext}
- [x] T020 [P] Create IUserRecoveryTokensRepository interface (generate with auto-UUID token, findByToken — all async) in src/modules/users/repositories/IUserRecoveryTokensRepository.{ext} and FakeUserRecoveryTokensRepository (in-memory array, generate creates token with UUID) in src/modules/users/repositories/fakes/FakeUserRecoveryTokensRepository.{ext}

### Concrete Provider Implementations

- [x] T021 [P] Implement concrete HashProvider (e.g., BCryptHashProvider with cost factor 10-12) in src/modules/users/providers/HashProvider/implementations/BCryptHashProvider.{ext} per research.md R2
- [x] T022 [P] Implement concrete TokenProvider (e.g., JsonWebTokenProvider wrapping JWT library) in src/modules/users/providers/TokenProvider/implementations/JsonWebTokenProvider.{ext} per research.md R1
- [x] T023 [P] Implement concrete DateProvider (e.g., DayjsDateProvider wrapping date library) in src/modules/users/providers/DateProvider/implementations/DayjsDateProvider.{ext}
- [x] T024 [P] Implement concrete MailProvider (e.g., EtherealMailProvider wrapping nodemailer/SES/SendGrid) in src/modules/users/providers/MailProvider/implementations/EtherealMailProvider.{ext}

### Concrete ORM Repository Implementations (Layer 2 — concrete)

- [x] T025 [P] Implement UsersRepository satisfying IUsersRepository using chosen ORM in src/modules/users/infra/{orm}/repositories/UsersRepository.{ext}
- [x] T026 [P] Implement RolesRepository satisfying IRolesRepository using chosen ORM in src/modules/users/infra/{orm}/repositories/RolesRepository.{ext}
- [x] T027 [P] Implement PermissionsRepository satisfying IPermissionsRepository using chosen ORM in src/modules/users/infra/{orm}/repositories/PermissionsRepository.{ext}
- [x] T028 [P] Implement UsersRefreshTokensRepository satisfying IUsersRefreshTokensRepository using chosen ORM in src/modules/users/infra/{orm}/repositories/UsersRefreshTokensRepository.{ext}
- [x] T029 [P] Implement UserRecoveryTokensRepository satisfying IUserRecoveryTokensRepository using chosen ORM in src/modules/users/infra/{orm}/repositories/UserRecoveryTokensRepository.{ext}

### DI Container + Global Error Handler

- [x] T030 Register all repositories (5), providers (4) in DI container mapping interface tokens to concrete implementations in src/shared/container/index.{ext} per research.md R3
- [x] T031 [P] Implement global error handler middleware: AppError → {status:"error", message} with statusCode; unknown errors → {status:"error", message:"Internal server error"} with 500; register as last middleware per FR-029 in src/shared/infra/http/middlewares/errorHandler.{ext}

**Checkpoint**: Foundation ready — all entities, DTOs, interfaces, fakes, concrete implementations, and DI wiring complete. User story implementation can now begin.

---

## Phase 3: User Story 1 — User Login with Credentials (Priority: P1) MVP

**Goal**: A user provides email and password to authenticate and receives an access token, refresh token, and sanitized user profile.

**Independent Test**: Send email/password credentials via POST /sessions and verify that a valid access token, refresh token, and user profile (without password hash) are returned. Verify generic error on wrong email or wrong password.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T032 [US1] Unit test for AuthenticateUserService in src/tests/unit/modules/users/services/AuthenticateUserService.spec.{ext} — test cases: (1) valid credentials return user+token+refresh_token, (2) non-existent email throws "Incorrect email/password combination" 401, (3) wrong password throws "Incorrect email/password combination" 401; use FakeUsersRepository, FakeHashProvider, FakeTokenProvider, FakeUsersRefreshTokensRepository, FakeDateProvider

### Implementation for User Story 1

- [x] T033 [US1] Implement AuthenticateUserService with execute(IRequestDTO) in src/modules/users/services/AuthenticateUserService.{ext} — validate email exists, compare password hash, sign access token (sub: userId, secret: APP_SECRET), sign refresh token (sub: userId, email, secret: APP_SECRET_REFRESH_TOKEN), store refresh token in DB with expiry, return IResponseDTO per AR-028/AR-029/AR-030
- [x] T034 [US1] Implement SessionsController (POST handler) resolving AuthenticateUserService from DI container, extracting email+password from request body, returning LoginResponse in src/modules/users/infra/http/controllers/SessionsController.{ext}
- [x] T035 [US1] Create sessions route file with POST /sessions endpoint, input validation (email format, password required), wired to SessionsController in src/modules/users/infra/http/routes/sessions.routes.{ext}

**Checkpoint**: User Story 1 fully functional — users can log in and receive tokens

---

## Phase 4: User Story 2 — Token Refresh (Priority: P1)

**Goal**: An authenticated user exchanges a valid refresh token for a new access token and new refresh token (rotation). The old refresh token is invalidated.

**Independent Test**: Use a valid refresh token from login to POST /sessions/refresh-token and verify new token pair is returned and old refresh token is invalidated.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T036 [US2] Unit test for UserRefreshTokenService in src/tests/unit/modules/users/services/UserRefreshTokenService.spec.{ext} — test cases: (1) valid refresh token returns new access+refresh token pair, old token deleted, (2) expired/invalid token throws "Refresh token does not exist" 400, (3) already-revoked token throws error (replay attack), (4) concurrent requests with the same token — only the first succeeds, subsequent fail; use FakeUsersRefreshTokensRepository, FakeTokenProvider, FakeDateProvider

### Implementation for User Story 2

- [x] T037 [US2] Implement UserRefreshTokenService with execute(token) in src/modules/users/services/UserRefreshTokenService.{ext} — verify refresh token with APP_SECRET_REFRESH_TOKEN, lookup in DB by userId+token, check expiry, delete old token, create new refresh token, sign new access token with APP_SECRET per AR-031
- [x] T038 [US2] Implement UsersRefreshTokensController (POST handler) resolving UserRefreshTokenService, extracting token from body/header/query in src/modules/users/infra/http/controllers/UsersRefreshTokensController.{ext}
- [x] T039 [US2] Add POST /sessions/refresh-token endpoint with input validation to sessions.routes.{ext}

**Checkpoint**: Token refresh works — users can silently renew sessions

---

## Phase 5: User Story 3 — Route Protection with Authentication Middleware (Priority: P1)

**Goal**: Protected routes require a valid access token in the Authorization header (Bearer scheme). The middleware extracts and verifies the token, then attaches the user identity to the request context.

**Independent Test**: Send requests to any protected route with/without a valid Bearer token and verify access is correctly granted (200) or denied (401 "Invalid authentication token").

### Implementation for User Story 3

- [x] T040 [US3] Implement ensureAuthenticated middleware in src/shared/infra/http/middlewares/ensureAuthenticated.{ext} — extract Bearer token from Authorization header (reject non-Bearer schemes with 401), verify JWT using APP_SECRET (NOT refresh token secret per AR-030), attach { id: userId } to request context, throw AppError("Invalid authentication token", 401) on missing/invalid/expired token or non-Bearer scheme per AR-023

**Checkpoint**: Route protection active — all subsequent protected endpoints can use ensureAuthenticated

---

## Phase 6: User Story 9 — Logout (Priority: P1)

**Goal**: An authenticated user explicitly ends all sessions. All refresh tokens for the user are deleted. The access token remains valid until natural expiration.

**Independent Test**: Log in, call POST /sessions/logout with Bearer token, then attempt token refresh — refresh should fail.

### Tests for User Story 9

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T041 [US9] Unit test for LogoutUserService in src/tests/unit/modules/users/services/LogoutUserService.spec.{ext} — test cases: (1) deletes all refresh tokens for the given user_id; use FakeUsersRefreshTokensRepository

### Implementation for User Story 9

- [x] T042 [US9] Implement LogoutUserService with execute(ILogoutDTO) in src/modules/users/services/LogoutUserService.{ext} — call deleteAllByUserId on refresh token repository
- [x] T043 [US9] Implement LogoutController (POST handler) resolving LogoutUserService, extracting user_id from request context (set by ensureAuthenticated) in src/modules/users/infra/http/controllers/LogoutController.{ext}
- [x] T044 [US9] Add POST /sessions/logout endpoint with ensureAuthenticated middleware, returning 204 on success, to sessions.routes.{ext}

**Checkpoint**: Full session lifecycle complete — login, refresh, logout all working

---

## Phase 7: User Story 10 — Initial Admin Bootstrapping (Priority: P1)

**Goal**: On a fresh deployment, an operator runs a seed CLI command that creates the initial admin user, admin role, and admin_full_access permission. This is the entry point for all RBAC management.

**Independent Test**: Run seed on empty database, verify admin user exists with admin role, can immediately log in and access admin endpoints.

### Implementation for User Story 10

- [x] T045 [US10] Implement idempotent seed CLI command in src/seeds/admin.{ext} — (1) create "admin_full_access" permission if not exists, (2) create "admin" role if not exists and assign admin_full_access permission, (3) create admin user from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME env vars with hashed password if not exists, (4) assign admin role to admin user; must be standalone CLI command (e.g., npm run seed) NOT automatic startup hook per FR-026

**Checkpoint**: System bootstrappable — fresh deployments can be initialized with admin access

---

## Phase 8: User Story 4 — Role-Based Access Control (Priority: P2)

**Goal**: Protected routes can require specific roles (is middleware) or specific permissions (can middleware). The system checks both direct user permissions and role-inherited permissions.

**Independent Test**: Create roles/permissions (via seed or direct DB), assign to user, then access routes guarded by is(["admin"]) and can(["create_users"]) — verify 200 for authorized users and 403 for unauthorized.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T046 [US4] Unit test for ListUserAccessControlListService in src/tests/unit/modules/users/services/ListUserAccessControlListService.spec.{ext} — test cases: (1) returns user's roles and permissions, (2) user not found throws error; use FakeUsersRepository

### Implementation for User Story 4

- [x] T047 [P] [US4] Implement is(roles[]) middleware in src/shared/infra/http/middlewares/is.{ext} — load user's roles from IUsersRepository.getUserRoles, check intersection with required roles, return 403 "User does not have the required role" if no match per AR-024
- [x] T048 [P] [US4] Implement can(permissions[]) middleware in src/shared/infra/http/middlewares/can.{ext} — load user with direct permissions (getUserPermissions) AND all roles with their permissions (getUserRoles → each role's permissions), flatten into single permission name set, check intersection with required permissions, return 403 "User does not have the required permission" if no match per AR-025
- [x] T049 [US4] Implement ListUserAccessControlListService with execute(userId) in src/modules/users/services/ListUserAccessControlListService.{ext} — find user, return IUserACLsDTO with userId, name, roles, permissions
- [x] T050 [US4] Implement ListUserAccessControlListController (GET handler) resolving ListUserAccessControlListService, extracting userId from route params in src/modules/users/infra/http/controllers/ListUserAccessControlListController.{ext}
- [x] T051 [US4] Create users route file with GET /users/acl/:userId endpoint, ensureAuthenticated + is(["admin"]) middleware + input validation in src/modules/users/infra/http/routes/users.routes.{ext}

**Checkpoint**: RBAC enforcement active — admin-only routes protected, permission checks working

---

## Phase 9: User Story 6 — User Registration (Priority: P2)

**Goal**: An administrator creates new user accounts with name, email, and password. Passwords are hashed. Duplicate emails are rejected.

**Independent Test**: POST /users with valid data as admin — verify user created with hashed password. Attempt duplicate email — verify "Email address already used" error.

**Dependencies**: Requires US3 (ensureAuthenticated) and US4 (is middleware) for admin-only route protection

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T052 [US6] Unit test for CreateUserService in src/tests/unit/modules/users/services/CreateUserService.spec.{ext} — test cases: (1) valid input creates user with hashed password, (2) duplicate email throws "Email address already used" 400; use FakeUsersRepository, FakeHashProvider

### Implementation for User Story 6

- [x] T053 [US6] Implement CreateUserService with execute(ICreateUserDTO) in src/modules/users/services/CreateUserService.{ext} — check email uniqueness via findByEmail, hash password, create user
- [x] T054 [US6] Implement UsersController (POST handler) resolving CreateUserService, extracting name+email+password from body, returning 201 with created user (password excluded) in src/modules/users/infra/http/controllers/UsersController.{ext}
- [x] T055 [US6] Add POST /users endpoint with ensureAuthenticated + is(["admin"]) + input validation (name required, email format, password required) to users.routes.{ext}

**Checkpoint**: User creation works — admin can register new accounts

---

## Phase 10: User Story 5 — RBAC Entity Management (Priority: P2)

**Goal**: An administrator creates roles and permissions, assigns permissions to roles, and assigns roles + direct permissions to users.

**Independent Test**: Create role, create permission, assign permission to role, assign role + permission to user — verify all relationships persisted correctly.

**Dependencies**: Requires US3 (ensureAuthenticated) and US4 (is middleware) for admin-only route protection

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T056 [P] [US5] Unit test for CreateRoleService in src/tests/unit/modules/users/services/CreateRoleService.spec.{ext} — test cases: (1) valid input creates role, (2) duplicate name throws "Role already exists" 400; use FakeRolesRepository
- [x] T057 [P] [US5] Unit test for CreatePermissionService in src/tests/unit/modules/users/services/CreatePermissionService.spec.{ext} — test cases: (1) valid input creates permission, (2) duplicate name throws "Permission already exists" 400; use FakePermissionsRepository
- [x] T058 [P] [US5] Unit test for CreateRolePermissionService in src/tests/unit/modules/users/services/CreateRolePermissionService.spec.{ext} — test cases: (1) assigns permissions to role successfully, (2) non-existent role ID throws error, (3) non-existent permission IDs are silently ignored (only existing permissions are assigned); use FakeRolesRepository, FakePermissionsRepository
- [x] T059 [P] [US5] Unit test for CreateUserAccessControlListService in src/tests/unit/modules/users/services/CreateUserAccessControlListService.spec.{ext} — test cases: (1) assigns roles + permissions to user successfully, (2) non-existent user ID throws error, (3) non-existent role/permission IDs are silently ignored (only existing entities are assigned); use FakeUsersRepository, FakeRolesRepository, FakePermissionsRepository

### Implementation for User Story 5

- [x] T060 [P] [US5] Implement CreateRoleService with execute(ICreateRoleDTO) in src/modules/users/services/CreateRoleService.{ext} — check name uniqueness via findByName, create role
- [x] T061 [P] [US5] Implement CreatePermissionService with execute(ICreatePermissionDTO) in src/modules/users/services/CreatePermissionService.{ext} — check name uniqueness via findByName, create permission
- [x] T062 [US5] Implement CreateRolePermissionService with execute(ICreateRolePermissionsDTO) in src/modules/users/services/CreateRolePermissionService.{ext} — find role by roleId, find permissions by IDs, assign permissions to role, save
- [x] T063 [US5] Implement CreateUserAccessControlListService with execute(ICreateUserAccessControlListDTO) in src/modules/users/services/CreateUserAccessControlListService.{ext} — find user, find roles by IDs, find permissions by IDs, assign to user, save
- [x] T064 [P] [US5] Implement RolesController (POST handler) resolving CreateRoleService in src/modules/users/infra/http/controllers/RolesController.{ext}
- [x] T065 [P] [US5] Implement PermissionsController (POST handler) resolving CreatePermissionService in src/modules/users/infra/http/controllers/PermissionsController.{ext}
- [x] T066 [P] [US5] Implement CreateRolePermissionController (POST handler) resolving CreateRolePermissionService, extracting roleId from params and permissions[] from body in src/modules/users/infra/http/controllers/CreateRolePermissionController.{ext}
- [x] T067 [P] [US5] Implement CreateUserAccessControlListController (POST handler) resolving CreateUserAccessControlListService, extracting userId from params and roles[]+permissions[] from body in src/modules/users/infra/http/controllers/CreateUserAccessControlListController.{ext}
- [x] T068 [US5] Create roles route file with POST /roles and POST /roles/:roleId endpoints, ensureAuthenticated + is(["admin"]) + input validation in src/modules/users/infra/http/routes/roles.routes.{ext}
- [x] T069 [US5] Create permissions route file with POST /permissions endpoint, ensureAuthenticated + is(["admin"]) + input validation in src/modules/users/infra/http/routes/permissions.routes.{ext}
- [x] T070 [US5] Add POST /users/acl/:userId endpoint with ensureAuthenticated + is(["admin"]) + input validation (roles[] and permissions[] arrays required) to users.routes.{ext}

**Checkpoint**: Full RBAC management — create roles/permissions, assign to users, enforce on routes

---

## Phase 11: User Story 7 — Password Recovery (Priority: P3)

**Goal**: A user requests password recovery, receives an email with a time-limited reset token (2h expiry), and can set a new password.

**Independent Test**: Request recovery for valid email → verify email sent. Use token to reset password → verify new password works for login. Test expired token (>2h) → verify rejection.

### Tests for User Story 7

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T071 [P] [US7] Unit test for SendForgotPasswordEmailService in src/tests/unit/modules/users/services/SendForgotPasswordEmailService.spec.{ext} — test cases: (1) registered email generates token and sends mail, (2) unregistered email completes silently (no error, prevents enumeration per FR-021); use FakeUsersRepository, FakeMailProvider, FakeUserRecoveryTokensRepository
- [x] T072 [P] [US7] Unit test for ResetPasswordService in src/tests/unit/modules/users/services/ResetPasswordService.spec.{ext} — test cases: (1) valid token resets password, (2) expired token (>2h) throws "Token expired" 400, (3) invalid token throws "Token does not exist" 400; use FakeUserRecoveryTokensRepository, FakeUsersRepository, FakeHashProvider, FakeDateProvider

### Implementation for User Story 7

- [x] T073 [P] [US7] Implement SendForgotPasswordEmailService with execute(email) in src/modules/users/services/SendForgotPasswordEmailService.{ext} — find user by email (silently return if not found per FR-021), generate recovery token, send email with reset link ({APP_WEB_URL}/reset?token={token})
- [x] T074 [P] [US7] Implement ResetPasswordService with execute(token, password) in src/modules/users/services/ResetPasswordService.{ext} — find recovery token, check 2h expiry using IDateProvider.compareInHours, hash new password, update user
- [x] T075 [P] [US7] Implement ForgotPasswordController (POST handler) resolving SendForgotPasswordEmailService, returning 204 always in src/modules/users/infra/http/controllers/ForgotPasswordController.{ext}
- [x] T076 [P] [US7] Implement ResetPasswordController (POST handler) resolving ResetPasswordService, extracting token+password+password_confirmation from body in src/modules/users/infra/http/controllers/ResetPasswordController.{ext}
- [x] T077 [US7] Create password route file with POST /password/forgot and POST /password/reset endpoints (public, no auth middleware), input validation (email format for forgot; token UUID + password + password_confirmation match for reset) in src/modules/users/infra/http/routes/password.routes.{ext}

**Checkpoint**: Password recovery complete — users can self-service password resets

---

## Phase 12: User Story 8 — User Profile Management (Priority: P3)

**Goal**: An authenticated user views and updates their own profile (name, email, password). Changing password requires the current password. Email uniqueness enforced on update.

**Independent Test**: GET /profile returns user data. PUT /profile updates name/email. Attempt password change without old_password → verify rejection. Change password with correct old_password → verify success.

**Dependencies**: Requires US3 (ensureAuthenticated)

### Tests for User Story 8

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T078 [P] [US8] Unit test for ShowProfileService in src/tests/unit/modules/users/services/ShowProfileService.spec.{ext} — test cases: (1) returns user profile, (2) user not found throws "User not found" 400; use FakeUsersRepository
- [x] T079 [P] [US8] Unit test for UpdateProfileService in src/tests/unit/modules/users/services/UpdateProfileService.spec.{ext} — test cases: (1) updates name/email, (2) email already used throws "Email address already used" 400, (3) password change without old_password throws "Old password is required to set a new password" 400, (4) wrong old_password throws "Old password does not match" 400, (5) user not found throws "User not found" 400; use FakeUsersRepository, FakeHashProvider

### Implementation for User Story 8

- [x] T080 [P] [US8] Implement ShowProfileService with execute(IShowProfileDTO) in src/modules/users/services/ShowProfileService.{ext} — find user by id, throw if not found, return user
- [x] T081 [P] [US8] Implement UpdateProfileService with execute(IUpdateProfileDTO) in src/modules/users/services/UpdateProfileService.{ext} — find user, check email uniqueness if changed, require+verify old_password if new password provided, hash new password, save
- [x] T082 [US8] Implement ProfileController (GET show + PUT update handlers) resolving ShowProfileService and UpdateProfileService, extracting user_id from request context in src/modules/users/infra/http/controllers/ProfileController.{ext}
- [x] T083 [US8] Create profile route file with GET /profile and PUT /profile endpoints, ensureAuthenticated middleware + input validation in src/modules/users/infra/http/routes/profile.routes.{ext}

**Checkpoint**: Profile management complete — users can view and update their own data

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Validation, integration testing, and hardening across all user stories

- [x] T084 [P] Add input validation schemas for all route endpoints per AR-017 — validate: email format (RFC 5322 compliant), required fields (non-empty strings), UUID v4 format for all route params (userId, roleId) and ID arrays, password minimum 6 characters, password_confirmation exact match with password (at validation layer, before reaching service), roles[] and permissions[] as arrays of UUID v4 strings (may be empty `[]`), name/description as non-empty strings for role/permission creation
- [x] T085 [P] Run integration smoke test per quickstart.md Phase 13: seed → login admin → create role/permission → assign to role → create user → assign ACL → login user → verify RBAC → refresh token → logout → forgot password → reset → login with new password
- [x] T086 [P] Verify all error messages match spec Standard Error Messages table (AuthenticateUserService: "Incorrect email/password combination" 401, CreateUserService: "Email address already used" 400, etc.)
- [x] T087 [P] Verify password field exclusion from ALL API responses (User serialization) per AR-004
- [x] T088 Review all routes for correct middleware ordering: input validation → ensureAuthenticated → is/can → controller per AR-017/AR-018/AR-019
- [x] T089 [P] Performance benchmark: verify login flow completes in <2s (SC-001), token refresh in <500ms (SC-002), ensureAuthenticated middleware overhead <100ms per request (SC-003), and password recovery email triggered within 5s (SC-006) — use request timing instrumentation or load test tool
- [x] T090 [P] Verify integration smoke test covers full register → login → profile flow without manual intervention per SC-010

**Note**: `IStorageProvider` (file storage for avatars) is intentionally deferred — it is listed as optional in the spec and not required for core auth/RBAC functionality. Implementers SHOULD add it as a project-specific extension if avatar upload is needed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **US1 Login (Phase 3)**: Depends on Foundational — first functional endpoint
- **US2 Token Refresh (Phase 4)**: Depends on US1 (sessions route file exists, token infrastructure)
- **US3 Route Protection (Phase 5)**: Depends on Foundational only — can run parallel with US1/US2
- **US9 Logout (Phase 6)**: Depends on US3 (uses ensureAuthenticated middleware)
- **US10 Admin Bootstrap (Phase 7)**: Depends on Foundational only — can run parallel with US1-US3
- **US4 RBAC Enforcement (Phase 8)**: Depends on US3 (ensureAuthenticated for admin routes)
- **US6 Registration (Phase 9)**: Depends on US4 (needs is(["admin"]) middleware)
- **US5 RBAC Entity Mgmt (Phase 10)**: Depends on US4 (needs is(["admin"]) middleware)
- **US7 Password Recovery (Phase 11)**: Depends on Foundational only (public endpoints)
- **US8 Profile Mgmt (Phase 12)**: Depends on US3 (ensureAuthenticated)
- **Polish (Phase 13)**: Depends on all user stories being complete

### User Story Dependencies

```
Foundational ──┬── US1 (Login) ─── US2 (Refresh)
               │
               ├── US3 (Route Protection) ──┬── US9 (Logout)
               │                            ├── US4 (RBAC) ──┬── US5 (RBAC Mgmt)
               │                            │                └── US6 (Registration)
               │                            └── US8 (Profile)
               │
               ├── US10 (Bootstrap)
               │
               └── US7 (Password Recovery)
```

### Within Each User Story

1. Unit tests written FIRST (should FAIL before implementation)
2. Services implemented (business logic)
3. Controllers implemented (HTTP translation)
4. Routes wired with middleware and validation

### Parallel Opportunities

**After Foundational completes, these can start in parallel:**
- US1 (Login) — independent
- US3 (Route Protection) — independent
- US10 (Admin Bootstrap) — independent
- US7 (Password Recovery) — independent

**After US3 completes:**
- US9 (Logout) + US4 (RBAC) + US8 (Profile) — all parallel

**After US4 completes:**
- US5 (RBAC Entity Mgmt) + US6 (Registration) — parallel

**Within each story, [P] tasks can run simultaneously:**
- All test files within a story
- Entity models (T005-T009)
- Provider interfaces (T012-T015)
- Repository interfaces (T016-T020)
- Concrete implementations (T021-T029)
- Parallel services within US5 (T060+T061)
- Parallel controllers within US5 (T064-T067)

---

## Parallel Example: User Story 5 (largest story)

```
# Step 1: Launch all tests in parallel
Task: "Unit test for CreateRoleService in src/tests/.../CreateRoleService.spec.{ext}"
Task: "Unit test for CreatePermissionService in src/tests/.../CreatePermissionService.spec.{ext}"
Task: "Unit test for CreateRolePermissionService in src/tests/.../CreateRolePermissionService.spec.{ext}"
Task: "Unit test for CreateUserAccessControlListService in src/tests/.../CreateUserAccessControlListService.spec.{ext}"

# Step 2: Launch independent services in parallel
Task: "Implement CreateRoleService in src/.../services/CreateRoleService.{ext}"
Task: "Implement CreatePermissionService in src/.../services/CreatePermissionService.{ext}"

# Step 3: Launch dependent services (after Step 2)
Task: "Implement CreateRolePermissionService in src/.../services/CreateRolePermissionService.{ext}"
Task: "Implement CreateUserAccessControlListService in src/.../services/CreateUserAccessControlListService.{ext}"

# Step 4: Launch all controllers in parallel
Task: "Implement RolesController in src/.../controllers/RolesController.{ext}"
Task: "Implement PermissionsController in src/.../controllers/PermissionsController.{ext}"
Task: "Implement CreateRolePermissionController in src/.../controllers/CreateRolePermissionController.{ext}"
Task: "Implement CreateUserAccessControlListController in src/.../controllers/CreateUserAccessControlListController.{ext}"

# Step 5: Wire routes (sequential, may share route files)
Task: "Create roles routes in src/.../routes/roles.routes.{ext}"
Task: "Create permissions routes in src/.../routes/permissions.routes.{ext}"
Task: "Add ACL assignment route to users.routes.{ext}"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 + Logout Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T031) — **CRITICAL: blocks all stories**
3. Complete Phase 3: US1 Login (T032-T035)
4. Complete Phase 4: US2 Token Refresh (T036-T039)
5. Complete Phase 5: US3 Route Protection (T040)
6. Complete Phase 6: US9 Logout (T041-T044)
7. **STOP and VALIDATE**: Login → get tokens → refresh → logout — full session lifecycle works
8. Deploy/demo if ready — **this is the MVP**

### Incremental Delivery

1. **MVP** (Phases 1-7): Setup + Foundation + Login + Refresh + Auth Middleware + Logout = functional auth system
2. **+ Admin Bootstrap** (Phase 7): US10 seed command → admin can log in
3. **+ RBAC** (Phases 8-10): US4 + US5 + US6 → role/permission management, user registration
4. **+ Self-Service** (Phases 11-12): US7 + US8 → password recovery, profile management
5. **+ Polish** (Phase 13): Validation hardening, integration test, error message audit

### Parallel Team Strategy

With 3 developers after Foundational:
- **Dev A**: US1 → US2 → US9 (session lifecycle)
- **Dev B**: US3 → US4 → US5 (protection + RBAC)
- **Dev C**: US10 → US6 → US7 → US8 (bootstrap + registration + self-service)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable after Foundational
- Verify unit tests FAIL before implementing the service
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- `{ext}` = file extension for your chosen language (.ts, .py, .go, .java, .cs, etc.)
- `{orm}` = your chosen ORM directory name (typeorm, prisma, drizzle, sequelize, etc.)
- All file paths assume the modular monolith structure from plan.md
