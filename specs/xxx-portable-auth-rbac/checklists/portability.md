# Architectural Portability Checklist: Portable Auth, Session & RBAC System

**Purpose**: Validate that the specification artifacts are sufficient for an implementer in a **different project** (different language, ORM, framework) to reproduce the full auth/RBAC system without access to the reference codebase.
**Created**: 2026-02-24
**Feature**: [spec.md](../spec.md)
**Depth**: Thorough
**Audience**: Implementer in another project

## Repository Interface Contract Precision

- [x] CHK001 - Are return types specified for all repository methods (e.g., does `findById` return entity-or-null, or throw on not-found)? An implementer cannot write a fake without knowing this. [Clarity, Spec §AR-005, Layer 2 table] — **Fixed**: Repository table now specifies full return types (e.g., `findById(id: string) → User | null`)
- [x] CHK002 - Are all repository method parameters typed explicitly (e.g., `findByIds(ids: string[])` vs `findByIds(ids: UUID[])`)? Current spec lists methods with informal signatures. [Clarity, Spec §AR-005] — **Fixed**: All parameters now explicitly typed (e.g., `findByIds(ids: string[]) → Role[]`)
- [x] CHK003 - Is the `IUserRecoveryTokensRepository.generate(userId)` method's behavior specified? It is unusual — does it create the entity AND auto-generate the UUID token internally, or does the caller provide data? This differs from the `create(data)` pattern used by all other repositories. [Ambiguity, Spec §Layer 2 table] — **Fixed**: Clarified that `generate(userId)` creates the record AND auto-generates the UUID token internally; caller provides only userId
- [x] CHK004 - Are the `getUserPermissions(id)` and `getUserRoles(id)` methods on `IUsersRepository` distinguished from `findById(id)`? An implementer needs to know what these return differently — the full User with only permissions populated? Only the permissions array? [Ambiguity, Spec §Layer 2 table] — **Fixed**: Clarified that `getUserPermissions` returns `Permission[]` (only direct permissions) and `getUserRoles` returns `Role[]` (only roles)
- [x] CHK005 - Is it specified whether repository methods are synchronous or asynchronous (promise/future)? The reference uses async/await but the spec doesn't mandate this. [Gap, Spec §AR-005] — **Fixed**: AR-005 now mandates all repository methods be asynchronous

## Provider Interface Contract Precision

- [x] CHK006 - Are `IHashProvider` method signatures fully typed? (e.g., `generateHash(payload: string): Promise<string>` vs `generateHash(payload: string): string`). Async vs sync matters for bcrypt vs scrypt. [Clarity, Spec §Cross-Cutting Providers table] — **Fixed**: Full typed signatures added with async (Promise) return types
- [x] CHK007 - Is there an `ITokenProvider` interface abstraction for token generation/verification (sign, verify)? The spec abstracts hashing, dates, and mail behind providers, but token signing is done inline in AuthenticateUserService/UserRefreshTokenService. This breaks the portability pattern — an implementer using a different token library has no interface to implement. [Gap, Spec §AR-021] — **Fixed**: Added `ITokenProvider` with `sign()` and `verify()` methods; added to service dependencies
- [x] CHK008 - Are the `IDateProvider` method return value semantics specified? (e.g., does `compareInHours` return positive if start < end, or the reverse? What timezone does `dateNow()` return?) [Clarity, Spec §Cross-Cutting Providers table] — **Fixed**: Added semantics: positive if end > start, `dateNow()` returns UTC, `convertToUTC` returns ISO-8601
- [x] CHK009 - Is `IMailProvider.sendMail` template data format portable? The `templateData` includes `file` (template path) + `variables`, which assumes file-based templates. An implementer using SendGrid templates or React Email would need adaptation. Is this intentional? [Ambiguity, Spec §Cross-Cutting Providers table] — **Fixed**: Changed `file` to `template` (opaque identifier) with note that provider decides how to resolve it
- [x] CHK010 - Are fake implementation behaviors specified for all providers? The quickstart describes FakeHashProvider and FakeDateProvider briefly, but FakeMailProvider behavior (store sent mails in array) has no verification contract (how does a test assert an email was sent?). [Completeness, Quickstart §Phase 3] — **Fixed**: Added detailed fake behaviors for all 4 providers including FakeMailProvider assertion pattern

## Layer Separation & Dependency Direction

- [x] CHK011 - Is the "no layer bypass" rule (AR: Controllers MUST NOT call Repositories) accompanied by guidance on how to enforce it in languages without compile-time dependency checks (e.g., Python, JavaScript without strict imports)? [Clarity, Spec §AR-016] — **Fixed**: Added enforcement guidance (code review, linting, architectural fitness functions)
- [x] CHK012 - Is it specified where token generation/verification logic lives? AuthenticateUserService and UserRefreshTokenService both call `sign()` and `verify()` directly. If this is intentional (no ITokenProvider), is there a portability note explaining that token library calls are the ONE exception to provider abstraction? [Gap, Spec §AR-009, AR-021] — **Fixed**: Resolved by adding ITokenProvider; services now depend on the interface
- [x] CHK013 - Are middleware implementations specified as belonging to a specific layer, or are they cross-cutting? The spec places them under `shared/infra/http/middlewares/` (routes layer) but `ensureAuthenticated` and `can()/is()` call repositories directly, bypassing the service layer. Is this an accepted exception to AR-016? [Consistency, Spec §AR-023 vs AR-016] — **Fixed**: Documented as explicit exception in the layered architecture section
- [x] CHK014 - Is it specified whether the DI container registration file belongs to the infrastructure layer or is a standalone bootstrap concern? An implementer needs to know where to put it. [Gap, Quickstart §Phase 7] — **Fixed**: Clarified as standalone bootstrap concern in both quickstart and spec assumptions

## Data Model Portability

- [x] CHK015 - Is the term "eager-loaded" (used for User→Roles and User→Permissions relationships) defined in ORM-agnostic terms? "Eager-loaded" is ORM-specific jargon. Should it be: "When a User is fetched, their Roles and Permissions MUST be included in the result"? [Clarity, Data Model §Users] — **Fixed**: Replaced with ORM-agnostic requirement description
- [x] CHK016 - Is the serialization exclusion mechanism for the `password` field specified in ORM-agnostic terms? AR-004 says "marked for exclusion" but doesn't define how. The reference uses `@Exclude()` from class-transformer (TypeScript-specific). An implementer in Go or Python needs a portable approach description. [Ambiguity, Spec §AR-004] — **Fixed**: AR-004 now lists portable mechanisms (decorators, toJSON, serializer allowlists, DTO mapping)
- [x] CHK017 - Is the `avatar_url` computed property specified? The reference User entity has `getAvatarUrl()` using `process.env.APP_API_URL + "/files/" + avatar`. The data model lists `avatar` but the API contract schema includes both `avatar` and `avatar_url`. Where is the URL computation defined? [Gap, Data Model §Users vs Contract §User schema] — **Fixed**: Added computed property section to data model with formula and implementation guidance
- [x] CHK018 - Are ON DELETE behaviors specified for all foreign keys beyond join tables? The join tables specify CASCADE, but `users_refresh_tokens.user_id` and `users_recovery_tokens.user_id` FK behaviors are not specified. [Completeness, Data Model §UsersRefreshTokens] — **Fixed**: Added ON DELETE CASCADE to both FKs
- [x] CHK019 - Is database migration strategy addressed? The data model defines tables but an implementer needs to know: ORM auto-sync, migration files, raw SQL, or project-specific approach? [Gap, Quickstart §Phase 1] — **Fixed**: Added Migration Strategy section to data model
- [x] CHK020 - Are field length constraints (String(255), String(500)) guidance or mandatory? Would a Prisma implementer using `@db.Text` instead of `@db.VarChar(255)` violate the spec? [Clarity, Data Model] — **Fixed**: Added Field Length Constraints section clarifying values are recommended minimums

## Token Handling Specificity

- [x] CHK021 - Are JWT claims for access token vs refresh token explicitly listed? The reference puts `{ sub: userId }` in the access token and `{ sub: userId, email }` in the refresh token. An implementer needs to know the exact claim structure for each token type. [Gap, Spec §FR-003, FR-004] — **Fixed**: Added AR-028 (access token claims) and AR-029 (refresh token claims)
- [x] CHK022 - Is it specified which secret verifies which token? The reference `ensureAuthenticated` middleware uses `secretRefreshToken` to verify the access token (likely a bug). The spec should unambiguously state: access token verified with `APP_SECRET`, refresh token verified with `APP_SECRET_REFRESH_TOKEN`. [Ambiguity, Spec §AR-023] — **Fixed**: Added AR-030 (access token verification) and AR-031 (refresh token verification)
- [x] CHK023 - Does the refresh token endpoint return ONLY a new refresh token, or also a new access token? The spec and reference only return a new refresh token, but the user's access token is expired (that's why they're refreshing). Should the endpoint also return a new access token? [Gap, Spec §FR-005, Story 2] — **Fixed**: Updated Story 2, service table, and contract to return both access + refresh tokens
- [x] CHK024 - Is it specified which JWT signing algorithm to use (HS256, RS256, etc.) or is this deferred to the implementer? If deferred, is there a recommendation? [Gap, Research §R1] — **Fixed**: AR-028 recommends HS256 for symmetric secrets, notes RS256 as alternative
- [x] CHK025 - Are the recommended production token expiration values specified? The spec notes the reference uses 90d for access tokens but recommends "shorter period in production". What is the recommended range? [Clarity, Spec §Assumptions] — **Fixed**: AR-032 specifies 15min–1h for access tokens, 7–30d for refresh tokens

## Cross-Artifact Consistency

- [x] CHK026 - Does the API contract (YAML) include 401/403 error responses for ALL admin-protected endpoints? `POST /roles`, `POST /roles/:roleId`, `POST /permissions` only show 400 responses but are admin-gated (should also document 401/403). [Completeness, Contract §/roles, §/permissions] — **Fixed**: Added 401/403 responses to all three endpoints in contract YAML
- [x] CHK027 - Does the API contract's refresh-token endpoint accept the token from multiple sources (body, header `x-access-token`, query)? The reference `UsersRefreshTokensController` accepts from all three, but the YAML contract only specifies request body. [Consistency, Contract §/sessions/refresh-token vs Spec §Controller table] — **Fixed**: Contract now documents all three sources (body, header, query)
- [x] CHK028 - Is the `password/forgot` endpoint response consistent? The API contract returns 204 on success but 400 if user not found. However, FR-021 requires generic errors to prevent email enumeration. Returning 400 for non-existent email contradicts this. [Conflict, Spec §FR-021 vs Contract §/password/forgot] — **Fixed**: Contract now always returns 204; spec Story 7 scenario 2 updated
- [x] CHK029 - Is the `can()` middleware HTTP status code consistent with semantic meaning? AR-025 specifies 401 Unauthorized for failed permission checks, but the user IS authenticated (just not authorized) — 403 Forbidden would be semantically correct per FR-022. The `is()` middleware correctly uses 403. [Conflict, Spec §AR-025 vs §FR-022] — **Fixed**: AR-025 changed to 403 Forbidden; Story 4 scenario 5 updated
- [x] CHK030 - Are all 13 services listed in the spec's service table also present in the quickstart's Phase 5 implementation order? Is LogoutUserService (#9) included? [Consistency, Spec §Layer 3 table vs Quickstart §Phase 5] — **Verified**: All 13 services present in Phase 5 (#9 is LogoutUserService)

## DTO & Service Contract Completeness

- [x] CHK031 - Is `IResponseDTO` defined portably? It references `User` entity directly (`user: User`). Should it reference a serialized/sanitized user shape (without password) instead of the entity class? [Ambiguity, Spec §DTO table] — **Fixed**: Changed to `user: SanitizedUser (User without password)`
- [x] CHK032 - Is there a DTO for the LogoutUserService input? The service needs the authenticated user's ID, but no DTO is listed in the DTO table. [Gap, Spec §DTO table] — **Fixed**: Added `ILogoutDTO { user_id: string }`
- [x] CHK033 - Is there a DTO for the UpdateProfileService input? The reference uses an inline `IRequest` interface with `user_id, name, email, old_password?, password?`. No formal DTO is listed. [Gap, Spec §DTO table] — **Fixed**: Added `IUpdateProfileDTO { user_id, name, email, old_password?, password? }`
- [x] CHK034 - Is there a DTO for the ShowProfileService input? It requires `user_id` from the authenticated context. [Gap, Spec §DTO table] — **Fixed**: Added `IShowProfileDTO { user_id: string }`
- [x] CHK035 - Are service method signatures (execute/handle) standardized? All reference services use `execute(dto)` but this convention isn't stated in the spec. An implementer might use different method names. [Gap, Spec §AR-012] — **Fixed**: AR-012 now specifies `execute(dto)` or `handle(dto)` convention

## Testing Portability

- [x] CHK036 - Are fake repository behaviors specified precisely enough to reproduce? For example, does `FakeUsersRepository.findByEmail` do case-sensitive or case-insensitive matching? Does `FakeRolesRepository.findByIds` return partial matches or throw if any ID is missing? [Clarity, Spec §AR-007] — **Fixed**: AR-007 specifies case-insensitive findByEmail and partial-match findByIds; quickstart adds detailed conventions
- [x] CHK037 - Is it specified how fake repositories handle ID generation? The reference `FakeUsersRepository` needs to generate UUIDs for `create()`. Is this the fake's responsibility or the caller's? [Gap, Spec §AR-007] — **Fixed**: AR-007 specifies fakes generate UUIDs internally on create()
- [x] CHK038 - Are unit test expectations for each service documented as concrete test cases, or must the implementer derive them from the acceptance scenarios? The quickstart says "exercises the happy path and error paths from the acceptance scenarios" but doesn't list expected assertions. [Clarity, Quickstart §Phase 5] — **Fixed**: Quickstart Phase 5 now includes test structure template and example assertions

## Configuration & Environment Portability

- [x] CHK039 - Are ALL required environment variables documented in a single place? The quickstart lists 7 env vars but the spec also mentions configurable token expiration — is there an `ACCESS_TOKEN_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_IN` env var? [Completeness, Quickstart §Prerequisites vs Spec §FR-025] — **Fixed**: Added token expiration env vars to quickstart; added full env var table to spec
- [x] CHK040 - Is the auth configuration structure (secrets + expiration values) defined as a portable config schema? The reference has `authConfig.jwp.secret` but the spec doesn't prescribe a config structure. [Gap, Spec §FR-025] — **Fixed**: Added `authConfig` structure definition in new Configuration section of spec

## Error Handling Portability

- [x] CHK041 - Is the `AppError` class specified with enough detail to reproduce? The spec says `message + statusCode (default 400)` but doesn't specify: Is it a class or interface? Does it extend the language's native Error? Should it be throwable/catchable? [Clarity, Spec §AR-011, Research §R7] — **Fixed**: AR-011 now specifies AppError as throwable class extending native error base
- [x] CHK042 - Is the global error handler middleware specified as a formal requirement? It appears in the quickstart (Phase 11) and research (R7) but has no FR or AR number in the spec. [Gap, Spec §Functional Requirements] — **Fixed**: Added FR-029 for global error handler
- [x] CHK043 - Are specific error messages standardized for each service failure? E.g., "Incorrect email/password combination" (login), "Email address already used" (register), "Token expired" (password reset). An implementer needs consistent messages for API clients. [Clarity, Spec §FR-028] — **Fixed**: Added Standard Error Messages table with 15 standardized messages

## Seed/Bootstrap Portability

- [x] CHK044 - Is the seed mechanism specified as a CLI command, a startup hook, or both? The spec says "CLI command or startup routine" but the quickstart says "seed script/command". An implementer needs to know which to build. [Ambiguity, Spec §FR-026] — **Fixed**: FR-026 now specifies standalone CLI command only (not startup hook)
- [x] CHK045 - Are the default permissions created by the seed defined? The data model lists `admin_full_access` but the spec mentions "default set of permissions" (plural). Is one permission sufficient or should there be a standard set? [Ambiguity, Data Model §Seed Data vs Spec §Story 10] — **Fixed**: Clarified `admin_full_access` as minimum required; additional permissions are optional

## Architectural Gap Analysis

- [x] CHK046 - Is there guidance on how the `can()` middleware resolves role-inherited permissions in practice? The spec says "load both direct permissions AND permissions inherited from user's roles" but doesn't specify: one query with joins? Two queries merged? A dedicated repository method? [Gap, Spec §AR-025] — **Fixed**: AR-025 now includes resolution strategy (flatten to set union, check intersection)
- [x] CHK047 - Is there a requirement for a `findAll` or `list` operation for Users, Roles, or Permissions? The spec only defines creation and lookup-by-id/name. An admin managing users would need to list them. [Gap, Spec §Layer 2 table] — **Fixed**: Documented as intentionally out of scope in Assumptions; implementers SHOULD add as needed
- [x] CHK048 - Is there a requirement for DELETE operations on any entity (remove role, remove permission, remove user)? No repository interface includes delete methods except for refresh tokens. [Gap, Spec §Layer 2 table] — **Fixed**: Documented as intentionally out of scope in Assumptions; implementers SHOULD add as needed

## Notes

- Check items off as completed: `[x]`
- Items marked [Gap] indicate missing requirements that an implementer would need answered
- Items marked [Ambiguity] indicate requirements that exist but could be interpreted multiple ways
- Items marked [Conflict] indicate requirements that contradict each other across artifacts
- Items marked [Consistency] indicate misalignment between spec, data-model, contract, or quickstart
- Priority: Address [Conflict] items first, then [Gap], then [Ambiguity], then [Consistency], then [Clarity]
- Total items: 48
- **All 48 items resolved**: 2026-02-24
