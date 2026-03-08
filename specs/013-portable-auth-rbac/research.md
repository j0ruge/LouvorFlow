# Research: Portable Authentication, Session & RBAC System

**Feature**: `003-portable-auth-rbac` | **Date**: 2026-02-24

## R1: Token Strategy — JWT with Access + Refresh Token Pair

**Decision**: Use JWT (JSON Web Tokens) for both access and refresh tokens with token rotation on refresh.

**Rationale**:
- JWT is the most portable token format — every server-side language has mature JWT libraries
- Stateless access tokens reduce database lookups per request (only the `sub` claim containing the user ID is needed)
- Refresh tokens are stored in the database, enabling revocation (logout, rotation)
- Token rotation (delete old refresh token, issue new one on refresh) prevents replay attacks

**Alternatives considered**:
- **Opaque tokens**: Would require database lookup on every request; less portable, more server load
- **Session cookies**: Stateful, requires session store, less suitable for API-first architectures
- **Paseto**: More secure by design but far less library support across languages

**Configuration defaults**:
- Access token: signed with a secret, expires in configurable period (recommended: 15min–1h for production, 90d was reference project default)
- Refresh token: signed with a separate secret, expires in 30 days, stored in database
- Both secrets loaded from environment variables

---

## R2: Password Hashing Strategy

**Decision**: Abstract behind `IHashProvider` interface. Recommended default: bcrypt with cost factor 10–12.

**Rationale**:
- bcrypt is the most widely supported across languages (Node.js, Python, Go, Java, C#, Ruby)
- Cost factor 10–12 provides a good balance between security and performance (~100–400ms per hash)
- The interface (`generateHash`, `compareHash`) is intentionally minimal to support any algorithm

**Alternatives considered**:
- **Argon2**: Winner of the Password Hashing Competition; better memory-hard properties but less library support in some ecosystems
- **scrypt**: Good memory-hard alternative but less common than bcrypt
- **PBKDF2**: NIST-approved but slower adoption in modern frameworks

**Portability note**: The `IHashProvider` interface means the choice is deferred to implementation time. The spec only requires the two methods; the algorithm is an implementation detail.

---

## R3: Dependency Injection Patterns Across Frameworks

**Decision**: Constructor injection with interface-based dependencies, registered in a centralized container.

**Rationale**:
- Constructor injection is the most universal DI pattern — supported natively or via libraries in all major ecosystems
- Registration happens once in a container setup file, making it easy to swap implementations

**Framework-specific implementation guides**:

| Framework | DI Approach |
|---|---|
| **Node.js + tsyringe** | `@injectable()` decorator + `@inject('token')` + `container.registerSingleton()` |
| **Node.js + InversifyJS** | `@injectable()` + `@inject(TYPES.X)` + `container.bind()` |
| **NestJS** | Built-in DI — `@Injectable()` + `@Inject('TOKEN')` + module `providers[]` |
| **Python + dependency-injector** | `@inject` + `Container` with `Factory`/`Singleton` providers |
| **Go** | Manual constructor injection (no decorator — pass interfaces as function params) |
| **Java + Spring** | `@Service` + `@Autowired` / constructor injection (built-in) |
| **C# + .NET** | `builder.Services.AddScoped<IRepo, RepoImpl>()` (built-in) |

**Key pattern**: Regardless of framework, the service constructor signature defines its dependencies. The container wires concrete implementations to interface tokens.

---

## R4: Repository Pattern Across ORMs

**Decision**: Interface-based repository pattern with ORM-specific implementations isolated under `infra/{orm}/`.

**Rationale**:
- The repository interface is the **stability boundary** — it never changes when switching ORMs
- ORM-specific implementations live in a single directory, making replacement a contained operation
- Fake/in-memory implementations share the same interface, enabling pure unit tests without database

**ORM-specific implementation notes**:

| ORM | Entity Definition | Repository Implementation |
|---|---|---|
| **TypeORM** | Decorator-based entities (`@Entity`, `@Column`, `@ManyToMany`) | `getRepository(Entity).find/save/delete` |
| **Prisma** | Schema file (`schema.prisma`) generates client | `prisma.user.findUnique/create/update` |
| **Drizzle** | Schema in TypeScript code (`pgTable(...)`) | `db.select().from(users).where(...)` |
| **Sequelize** | `Model.init()` or decorator-based | `Model.findOne/create/save` |
| **SQLAlchemy** | Declarative models (`class User(Base)`) | `session.query(User).filter_by(...)` |
| **GORM** | Struct tags (`gorm:"primaryKey"`) | `db.Where(...).First(&user)` |

**Key insight**: The interface methods (`findById`, `findByEmail`, `create`, `save`) map naturally to any ORM's query API. The mapping is straightforward regardless of the ORM chosen.

---

## R5: Middleware Patterns Across Frameworks

**Decision**: Middleware as function-based interceptors that execute before the controller.

**Rationale**:
- Every HTTP framework supports middleware (or equivalent: filters, guards, interceptors)
- The pattern is the same: extract data from request → validate → either proceed or reject

**Framework-specific patterns**:

| Framework | Middleware Pattern |
|---|---|
| **Express/Fastify** | `(req, res, next) => { ... next() }` or `(req, res, next) => { throw error }` |
| **NestJS** | Guards (`@UseGuards(AuthGuard)`) implementing `CanActivate` interface |
| **Hono** | Middleware function `app.use('*', async (c, next) => { ... })` |
| **Flask** | Decorators (`@login_required`) or `before_request` hooks |
| **Gin (Go)** | `func AuthMiddleware() gin.HandlerFunc { return func(c *gin.Context) { ... } }` |
| **Spring** | `OncePerRequestFilter` or `HandlerInterceptor` |
| **.NET** | `IAuthorizationFilter` or middleware pipeline (`app.UseAuthentication()`) |

**Permission resolution for `can()` middleware**: Must load user with both `user.permissions` (direct) and `user.roles[].permissions` (inherited), flatten into a single permission name list, then check intersection with required permissions.

---

## R6: Seed/Bootstrap Strategy

**Decision**: Idempotent seed command that creates admin user + admin role on first deploy.

**Rationale**:
- A CLI command or startup hook is the most portable approach
- Idempotency (check-before-create) prevents duplicates on repeated runs
- Admin credentials should come from environment variables (not hardcoded)

**Implementation pattern**:
1. Check if "admin" role exists → create if not
2. Check if admin user exists (by email from env) → create with hashed password if not
3. Assign "admin" role to admin user if not already assigned
4. Optionally create default permissions and assign to admin role

**Environment variables needed**: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

---

## R7: Error Handling Pattern

**Decision**: Custom `AppError` class with `message` and `statusCode`, caught by a global error handler that formats errors into the **project's canonical error format**.

**Rationale**:
- Domain errors (`AppError`) are thrown by services and caught at the HTTP boundary
- A global error handler middleware formats them into the project's canonical error response format
- Non-domain errors (unexpected crashes) return a generic 500 response
- The error response format is **project-specific** — each project defines its own canonical format (e.g., `{ status: "error", message }`, `{ errors: ["message"] }`, `{ error: { code, message } }`)

**Pattern**:

```text
Service throws AppError(message, statusCode)
  → Controller does NOT catch (lets it propagate)
    → Global error handler catches:
        - If AppError: respond with message and statusCode in the project's error format
        - If unknown error: respond with "Internal server error" and 500 in the project's error format
```

**Integration note**: If the project already has a centralized error handler, integrate `AppError` into it (e.g., add a condition to check `if (error instanceof AppError)`) rather than creating a separate handler. The key requirement is that `AppError` instances are caught at the HTTP boundary and translated to the correct HTTP status code.

---

## R8: Seed Idempotency Strategy

**Decision**: Use upsert with unique key as conflict target for seed operations.

**Rationale**:
- Seeds must be idempotent — running them multiple times must not create duplicates or fail
- Two strategies are available, with different trade-offs

**Strategy comparison**:

| Strategy | Approach | Pros | Cons |
|----------|----------|------|------|
| **Check-before-create** | `findByName(x)` → if null → `create(x)` | Simple, explicit, easy to debug | Race condition if run concurrently; 2 queries per entity |
| **Upsert** | `upsert({ where: { name: x }, create: {...}, update: {} })` | Atomic, single query, no race condition | Requires unique constraint on conflict target; `update: {}` (no-op) is non-obvious |

**Recommendation**: Use **upsert** with the entity's unique field (`name` for roles/permissions, `email` for users) as the conflict target. The `update` clause can be a no-op (empty object or re-setting the same values) to achieve "create if not exists" semantics.

**Example (Prisma)**:

```typescript
await prisma.role.upsert({
  where: { name: 'admin' },
  create: { name: 'admin', description: 'System administrator' },
  update: {},  // no-op — already exists, don't change it
});
```

**Fallback**: If the ORM does not support upsert natively, use check-before-create with a try/catch on the unique constraint violation as a safety net.
