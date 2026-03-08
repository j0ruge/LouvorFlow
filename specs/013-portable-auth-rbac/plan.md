# Implementation Plan: Portable Authentication, Session & RBAC System

**Branch**: `003-portable-auth-rbac` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-portable-auth-rbac/spec.md`

**Note**: This is a **portable implementation plan** — designed to be reproduced in any server-side project regardless of language, framework, or ORM. It is not tied to the reference project (warehouse_explorer_api).

## Summary

Build a complete authentication, session management, and role-based access control (RBAC) system following a strict 5-layer architecture (Models → Repositories → Services → Controllers → Routes). The system supports email/password authentication with JWT access + refresh token pairs (with rotation), fine-grained RBAC with roles and direct permissions, password recovery via email, user profile management, and admin bootstrapping via a seed command. All external dependencies (ORM, hashing, dates, mail, storage) are abstracted behind provider interfaces to ensure portability.

## Technical Context

**Language/Version**: Any server-side language (TypeScript/Node.js, Python, Go, Java, C#, etc.)
**Primary Dependencies**: Any HTTP framework (Express, Fastify, NestJS, Hono, Flask, Gin, Spring, etc.)
**Storage**: Any relational database via any ORM (TypeORM, Prisma, Drizzle, Sequelize, SQLAlchemy, GORM, etc.)
**Testing**: Any test runner; unit tests use fake/in-memory repository implementations
**Target Platform**: Server-side web application (REST API)
**Project Type**: Web service (REST API backend)
**Performance Goals**: Login <2s, token refresh <500ms, middleware overhead <100ms (see SC-001 to SC-003)
**Constraints**: Library-agnostic — business logic and interfaces must not reference any specific library
**Scale/Scope**: 6 entities, 5 repository interfaces, 13 services, 12 controllers, 6 route groups, 4 provider interfaces, 3 middleware, 12 DTOs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project-specific constitution gates defined (constitution.md is a blank template). Proceeding without gates.

**Post-Phase 1 re-check**: N/A — no gates to re-evaluate.

## Project Structure

### Documentation (this feature)

```text
specs/003-portable-auth-rbac/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions & best practices
├── data-model.md        # Phase 1: Complete entity/relationship model
├── quickstart.md        # Phase 1: Step-by-step implementation guide
├── contracts/           # Phase 1: REST API contracts
│   └── auth-rbac-api.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (target project — portable template)

```text
src/
├── config/
│   ├── auth.{ext}                  # Token secrets, expiration config
│   │                               # ⚠ SECURITY: Fallback values (e.g., 'default-dev-secret')
│   │                               #   are for LOCAL DEVELOPMENT ONLY. Production deployments
│   │                               #   MUST set real, cryptographically random secrets via
│   │                               #   environment variables. Add a startup check that fails
│   │                               #   if dev defaults are used in production.
│   └── env.{ext}                   # Environment variable loader
├── shared/
│   ├── errors/
│   │   └── AppError.{ext}          # Domain error class (message + statusCode)
│   ├── container/
│   │   └── index.{ext}             # DI container registration (repos + providers)
│   └── infra/
│       └── http/
│           └── middlewares/
│               ├── ensureAuthenticated.{ext}  # Token verification middleware
│               ├── is.{ext}                    # Role-check middleware
│               └── can.{ext}                   # Permission-check middleware (direct + role-inherited)
├── modules/
│   └── users/
│       ├── dtos/
│       │   ├── ICreateUserDTO.{ext}
│       │   ├── ICreateRoleDTO.{ext}
│       │   ├── ICreatePermissionDTO.{ext}
│       │   ├── ICreateRolePermissionsDTO.{ext}
│       │   ├── ICreateUserAccessControlListDTO.{ext}
│       │   ├── ICreateUserRefreshTokenDTO.{ext}
│       │   ├── IRequestDTO.{ext}
│       │   ├── IResponseDTO.{ext}
│       │   ├── ILogoutDTO.{ext}
│       │   ├── IShowProfileDTO.{ext}
│       │   ├── IUpdateProfileDTO.{ext}
│       │   └── IUserACLsDTO.{ext}
│       ├── repositories/
│       │   ├── IUsersRepository.{ext}            # Interface
│       │   ├── IRolesRepository.{ext}            # Interface
│       │   ├── IPermissionsRepository.{ext}      # Interface
│       │   ├── IUsersRefreshTokensRepository.{ext} # Interface
│       │   ├── IUserRecoveryTokensRepository.{ext} # Interface
│       │   └── fakes/                            # In-memory implementations for testing
│       │       ├── FakeUsersRepository.{ext}
│       │       ├── FakeRolesRepository.{ext}
│       │       ├── FakePermissionsRepository.{ext}
│       │       ├── FakeUsersRefreshTokensRepository.{ext}
│       │       └── FakeUserRecoveryTokensRepository.{ext}
│       ├── providers/
│       │   ├── HashProvider/
│       │   │   ├── models/IHashProvider.{ext}      # Interface
│       │   │   ├── implementations/{Impl}.{ext}    # e.g., BCryptHashProvider
│       │   │   └── fakes/FakeHashProvider.{ext}
│       │   ├── TokenProvider/
│       │   │   ├── models/ITokenProvider.{ext}      # Interface
│       │   │   ├── implementations/{Impl}.{ext}     # e.g., JsonWebTokenProvider
│       │   │   └── fakes/FakeTokenProvider.{ext}
│       │   ├── DateProvider/
│       │   │   ├── models/IDateProvider.{ext}       # Interface
│       │   │   ├── implementations/{Impl}.{ext}     # e.g., DayjsDateProvider
│       │   │   └── fakes/FakeDateProvider.{ext}
│       │   └── MailProvider/
│       │       ├── models/IMailProvider.{ext}        # Interface
│       │       ├── implementations/{Impl}.{ext}     # e.g., EtherealMailProvider
│       │       └── fakes/FakeMailProvider.{ext}
│       ├── infra/
│       │   ├── {orm}/                              # ORM-specific implementations
│       │   │   ├── entities/
│       │   │   │   ├── BaseEntity.{ext}
│       │   │   │   ├── User.{ext}
│       │   │   │   ├── Role.{ext}
│       │   │   │   ├── Permission.{ext}
│       │   │   │   ├── UserRefreshToken.{ext}
│       │   │   │   └── UserRecoveryToken.{ext}
│       │   │   └── repositories/
│       │   │       ├── UsersRepository.{ext}
│       │   │       ├── RolesRepository.{ext}
│       │   │       ├── PermissionsRepository.{ext}
│       │   │       ├── UsersRefreshTokensRepository.{ext}
│       │   │       └── UserRecoveryTokensRepository.{ext}
│       │   └── http/
│       │       ├── controllers/
│       │       │   ├── SessionsController.{ext}
│       │       │   ├── UsersRefreshTokensController.{ext}
│       │       │   ├── LogoutController.{ext}
│       │       │   ├── UsersController.{ext}
│       │       │   ├── RolesController.{ext}
│       │       │   ├── PermissionsController.{ext}
│       │       │   ├── CreateRolePermissionController.{ext}
│       │       │   ├── CreateUserAccessControlListController.{ext}
│       │       │   ├── ListUserAccessControlListController.{ext}
│       │       │   ├── ForgotPasswordController.{ext}
│       │       │   ├── ResetPasswordController.{ext}
│       │       │   └── ProfileController.{ext}
│       │       └── routes/
│       │           ├── sessions.routes.{ext}
│       │           ├── users.routes.{ext}
│       │           ├── roles.routes.{ext}
│       │           ├── permissions.routes.{ext}
│       │           ├── password.routes.{ext}
│       │           └── profile.routes.{ext}
│       └── services/
│           ├── AuthenticateUserService.{ext}
│           ├── UserRefreshTokenService.{ext}
│           ├── LogoutUserService.{ext}
│           ├── CreateUserService.{ext}
│           ├── CreateRoleService.{ext}
│           ├── CreatePermissionService.{ext}
│           ├── CreateRolePermissionService.{ext}
│           ├── CreateUserAccessControlListService.{ext}
│           ├── ListUserAccessControlListService.{ext}
│           ├── SendForgotPasswordEmailService.{ext}
│           ├── ResetPasswordService.{ext}
│           ├── ShowProfileService.{ext}
│           └── UpdateProfileService.{ext}
├── seeds/
│   └── admin.{ext}                 # Bootstrap seed: creates admin user + role
└── tests/
    └── unit/
        └── modules/users/services/
            ├── AuthenticateUserService.spec.{ext}
            ├── UserRefreshTokenService.spec.{ext}
            ├── LogoutUserService.spec.{ext}
            ├── CreateUserService.spec.{ext}
            ├── CreateRoleService.spec.{ext}
            ├── CreatePermissionService.spec.{ext}
            ├── CreateRolePermissionService.spec.{ext}
            ├── CreateUserAccessControlListService.spec.{ext}
            ├── ListUserAccessControlListService.spec.{ext}
            ├── ResetPasswordService.spec.{ext}
            ├── SendForgotPasswordEmailService.spec.{ext}
            ├── ShowProfileService.spec.{ext}
            └── UpdateProfileService.spec.{ext}
```

**Structure Decision**: Modular monolith with `modules/users/` containing all auth/RBAC concerns. ORM-specific code is isolated under `infra/{orm}/` so swapping ORMs means replacing only that directory while all interfaces, services, and tests remain untouched.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern (AR-005–AR-008) | ORM portability is the primary goal of this spec | Direct ORM access would couple business logic to a specific library |
| Provider interfaces (AR-021–AR-022) | Hashing, dates, mail must be swappable across projects | Inline library calls would break portability |
| 13 separate service classes (AR-012) | Single responsibility per business operation enables independent testing | Fat services would create tangled dependencies and untestable code |
