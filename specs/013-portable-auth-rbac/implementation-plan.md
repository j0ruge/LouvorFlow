# Plano: Autenticação e RBAC — LouvorFlow

## Contexto

A spec 013 define um sistema completo de autenticação, sessão e RBAC de forma genérica/portável. Este plano adapta essa spec para o LouvorFlow, respeitando os padrões já estabelecidos no projeto: estrutura flat, singletons com imports diretos, testes com `vi.mock()`, Prisma 6, Express 5, e formato de erro `{ erro, codigo }`.

**Problema**: O LouvorFlow não tem sistema de autenticação — qualquer pessoa pode acessar qualquer endpoint.

**Resultado esperado**: Sistema completo de auth JWT (access + refresh tokens), controle de acesso baseado em papéis (RBAC), recuperação de senha, e gerenciamento de perfil.

---

## Decisões de Adaptação (Spec Genérica → LouvorFlow)

| Spec Genérica | LouvorFlow |
|---|---|
| `Users` entity separada | **`Integrantes`** já tem `email` + `senha` — será o entity de auth |
| Estrutura modular (`modules/users/`) | Estrutura flat existente (`controllers/`, `services/`, `repositories/`) |
| DI container (tsyringe/inversify) | **Imports diretos** com singletons (padrão existente) |
| Interfaces + Fakes para providers | **Provider wrappers** simples + `vi.mock()` para testes |
| Error: `{ status: "error", message }` | **`{ erro, codigo }`** (formato existente) |
| `{orm}` genérico | **Prisma 6** com `$extends` |
| Nomes em inglês (users, roles) | **Rotas auth em inglês** (sessions, roles, permissions — padrão universal) |
| DTO interfaces separadas por arquivo | **Arquivo único** `types/auth.ts` com todos os DTOs de auth |

### Decisão Crítica: Prisma `$extends` e senha

O `prisma/cliente.ts` atual remove `senha` de TODAS as queries de Integrantes via `$extends`. Para autenticação, precisamos ler a `senha` para comparar. **Solução**: exportar o PrismaClient base (sem extensão) para uso exclusivo do repositório de auth.

---

## Dependências a Instalar

```text
# Runtime
jsonwebtoken    — Geração/verificação de JWT
dayjs           — Operações com datas (expiração de tokens)
nodemailer      — Envio de email (recuperação de senha)

# DevDependencies
@types/jsonwebtoken
@types/nodemailer
```

---

## Modelos Prisma (Novos + Alterações)

### Alterações em `Integrantes`
- Adicionar campo `avatar String? @db.VarChar(255)` (opcional, para perfil)
- Adicionar relações: `Roles`, `Permissions`, `RefreshTokens`, `RecoveryTokens`

### Novos Modelos

```text
Roles             — id, nome (unique), descricao, timestamps
Permissions       — id, nome (unique), descricao, timestamps
IntegrantesRoles  — integrante_id + role_id (composite PK, junction M:N)
IntegrantesPermissions — integrante_id + permission_id (composite PK, junction M:N)
PermissoesRole    — role_id + permission_id (composite PK, junction M:N)
RefreshTokens     — id, refresh_token, integrante_id (FK CASCADE), expires_date, timestamps
RecoveryTokens    — id, token (UUID), integrante_id (FK CASCADE), timestamps
```

---

## Arquivos a Criar/Modificar

### Modificar (existentes)

| Arquivo | Alteração |
|---|---|
| `prisma/schema.prisma` | Novos models + relações em Integrantes |
| `prisma/cliente.ts` | Exportar `basePrisma` (sem `$extends`) para queries de auth |
| `src/app.ts` | Registrar novas rotas de auth |
| `src/repositories/integrantes.repository.ts` | Adicionar métodos de auth (findByEmailWithSenha, getUserRoles, getUserPermissions) |
| `src/types/index.ts` | Adicionar INTEGRANTE_AUTH_SELECT |
| `.env.example` | Novas variáveis de auth |
| `docs/openapi.json` | Documentar todos os novos endpoints |

### Criar (novos)

**Config:**
- `src/config/auth.ts` — Configuração de tokens (secrets, expiração)

**Providers (wrappers simples):**
- `src/providers/hash.provider.ts` — Encapsula bcryptjs (generateHash, compareHash)
- `src/providers/token.provider.ts` — Encapsula jsonwebtoken (sign, verify)
- `src/providers/date.provider.ts` — Encapsula dayjs (compareInHours, addDays, dateNow)
- `src/providers/mail.provider.ts` — Encapsula nodemailer/ethereal (sendMail)

**Middleware:**
- `src/middlewares/ensureAuthenticated.ts` — Extrai Bearer token, verifica JWT, anexa `{ id }` ao request
- `src/middlewares/is.ts` — Verifica se o usuário tem o papel requerido (403 se não)
- `src/middlewares/can.ts` — Verifica permissões diretas + herdadas de papéis (403 se não)

**Repositories:**
- `src/repositories/roles.repository.ts` — CRUD de roles
- `src/repositories/permissions.repository.ts` — CRUD de permissions
- `src/repositories/refresh-tokens.repository.ts` — Criação, busca, deleção de refresh tokens
- `src/repositories/recovery-tokens.repository.ts` — Geração e busca de recovery tokens

**Services (13 total):**
- `src/services/auth.service.ts` — Login (valida credenciais, gera tokens)
- `src/services/refresh-token.service.ts` — Rotação de refresh token
- `src/services/logout.service.ts` — Deleta todos os refresh tokens do user
- `src/services/roles.service.ts` — Criação de role (nome único)
- `src/services/permissions.service.ts` — Criação de permission (nome única)
- `src/services/role-permissions.service.ts` — Atribuir permissions a role
- `src/services/user-acl.service.ts` — Atribuir/listar ACL de integrante
- `src/services/forgot-password.service.ts` — Gera token de recovery, envia email
- `src/services/reset-password.service.ts` — Valida token (2h), atualiza senha
- `src/services/profile.service.ts` — Exibir/atualizar perfil próprio

**Controllers:**
- `src/controllers/sessions.controller.ts` — POST login, POST refresh, POST logout
- `src/controllers/roles.controller.ts` — POST create role, POST assign permissions
- `src/controllers/permissions.controller.ts` — POST create permission
- `src/controllers/user-acl.controller.ts` — POST assign ACL, GET list ACL
- `src/controllers/profile.controller.ts` — GET show, PUT update
- `src/controllers/password.controller.ts` — POST forgot, POST reset

**Routes:**
- `src/routes/sessions.routes.ts` — /api/sessions/*
- `src/routes/roles.routes.ts` — /api/roles/*
- `src/routes/permissions.routes.ts` — /api/permissions/*
- `src/routes/profile.routes.ts` — /api/profile/*
- `src/routes/password.routes.ts` — /api/password/*
(ACL endpoints adicionados em `integrantes.routes.ts`: `/api/integrantes/:id/acl`)

**Seeds:**
- `src/seeds/admin.ts` — Script CLI para bootstrap do admin (npm run seed)

**Testes (fakes + unit tests):**
- `tests/fakes/fake-roles-repository.ts`
- `tests/fakes/fake-permissions-repository.ts`
- `tests/fakes/fake-refresh-tokens-repository.ts`
- `tests/fakes/fake-recovery-tokens-repository.ts`
- `tests/fakes/fake-hash-provider.ts`
- `tests/fakes/fake-token-provider.ts`
- `tests/fakes/fake-date-provider.ts`
- `tests/fakes/fake-mail-provider.ts`
- `tests/services/auth.service.test.ts`
- `tests/services/refresh-token.service.test.ts`
- `tests/services/logout.service.test.ts`
- `tests/services/roles.service.test.ts`
- `tests/services/permissions.service.test.ts`
- `tests/services/role-permissions.service.test.ts`
- `tests/services/user-acl.service.test.ts`
- `tests/services/forgot-password.service.test.ts`
- `tests/services/reset-password.service.test.ts`
- `tests/services/profile.service.test.ts`

---

## Endpoints da API

| Método | Rota | Middleware | Descrição |
|---|---|---|---|
| POST | `/api/sessions` | (público) | Login — email + senha → tokens + perfil |
| POST | `/api/sessions/refresh-token` | (público) | Rotação de refresh token |
| POST | `/api/sessions/logout` | ensureAuthenticated | Logout — revoga todos refresh tokens |
| POST | `/api/roles` | ensureAuthenticated + is(["admin"]) | Criar role |
| POST | `/api/roles/:roleId/permissions` | ensureAuthenticated + is(["admin"]) | Atribuir permissions a role |
| POST | `/api/permissions` | ensureAuthenticated + is(["admin"]) | Criar permission |
| GET | `/api/integrantes/:id/acl` | ensureAuthenticated + is(["admin"]) | Listar ACL do integrante |
| POST | `/api/integrantes/:id/acl` | ensureAuthenticated + is(["admin"]) | Atribuir roles/permissions ao integrante |
| GET | `/api/profile` | ensureAuthenticated | Ver perfil próprio |
| PUT | `/api/profile` | ensureAuthenticated | Atualizar perfil próprio |
| POST | `/api/password/forgot` | (público) | Solicitar recuperação de senha |
| POST | `/api/password/reset` | (público) | Resetar senha com token |

**Nota sobre rotas existentes**: Após o sistema de auth estar funcional, as rotas existentes de CRUD (`/api/integrantes`, `/api/artistas`, `/api/musicas`, etc.) receberão `ensureAuthenticated` para que apenas usuários logados possam acessar. A rota `POST /api/integrantes` (criar integrante) ganhará também `is(["admin"])`. **Detalhe**: essa proteção será aplicada na última etapa (Fase 8, step 8) para não quebrar o frontend durante o desenvolvimento.

---

## Fases de Implementação

### Fase 1: Infraestrutura (T001-T003, T010, T002)
1. Instalar dependências (`jsonwebtoken`, `dayjs`, `nodemailer`, tipos)
2. Atualizar `.env.example` com variáveis de auth
3. Criar `src/config/auth.ts`
4. Atualizar `prisma/schema.prisma` com novos models
5. Refatorar `prisma/cliente.ts` (exportar `basePrisma`)
6. Executar `prisma migrate dev`
7. Executar `prisma generate`

### Fase 2: Providers + DTOs (T011-T015, T021-T024)
1. Criar providers: hash, token, date, mail
2. Criar fakes dos providers para testes
3. Criar DTOs em `src/types/auth.ts`

### Fase 3: Repositories (T016-T020, T025-T029)
1. Criar repositórios: roles, permissions, refresh-tokens, recovery-tokens
2. Estender integrantes.repository com métodos de auth
3. Criar fakes dos repositórios para testes

### Fase 4: Middleware (T040, T047, T048)
1. `ensureAuthenticated` — Verifica JWT access token
2. `is(roles[])` — Verifica papel do usuário
3. `can(permissions[])` — Verifica permissões (diretas + herdadas)

### Fase 5: Services + Testes — Auth Core (T032-T044)
1. AuthService + teste (login com credenciais)
2. RefreshTokenService + teste (rotação de tokens)
3. LogoutService + teste (revogar refresh tokens)

### Fase 6: Services + Testes — RBAC (T046-T070)
1. RolesService + teste (criar role, nome único)
2. PermissionsService + teste (criar permission, nome única)
3. RolePermissionsService + teste (atribuir permissions a role)
4. UserAclService + teste (atribuir/listar ACL)

### Fase 7: Services + Testes — User Mgmt + Self-Service (T052-T083)
1. Criar integrante (atualizar service existente com RBAC)
2. ForgotPasswordService + teste
3. ResetPasswordService + teste
4. ProfileService (show + update) + teste

### Fase 8: Controllers + Routes (T034-T035, T038-T039, T043-T044, T050-T055, T064-T070, T075-T077, T082-T083)
1. SessionsController + sessions.routes.ts
2. RolesController + roles.routes.ts
3. PermissionsController + permissions.routes.ts
4. UserAclController + adicionar routes em integrantes.routes.ts
5. ProfileController + profile.routes.ts
6. PasswordController + password.routes.ts
7. Registrar novas rotas em app.ts
8. Adicionar middleware ensureAuthenticated nas rotas existentes

### Fase 9: Seed + Validação (T045, T084-T090)
1. Criar script de seed admin (`npm run seed`)
2. Adicionar Zod validations nos novos endpoints
3. Smoke test via API (login → refresh → RBAC → logout)
4. Atualizar `docs/openapi.json`

---

## Variáveis de Ambiente (novas)

```text
# Auth
JWT_SECRET=louvorflow-jwt-secret-dev
JWT_REFRESH_SECRET=louvorflow-jwt-refresh-secret-dev
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_DAYS=30

# Admin Seed
ADMIN_EMAIL=admin@louvorflow.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Administrador

# App URLs
APP_API_URL=http://localhost:3000
APP_WEB_URL=http://localhost:5173
```

---

## Verificação

1. **Testes unitários**: `npm run test` — todos os novos services testados com fakes
2. **Typecheck**: `npm run typecheck` — sem erros de tipo
3. **Smoke test manual**:
   - `npm run seed` → admin criado no banco
   - `POST /api/sessions` com admin → tokens retornados
   - `POST /api/roles` com Bearer token → role criada
   - `POST /api/permissions` com Bearer token → permission criada
   - `POST /api/sessions/refresh-token` → novos tokens
   - `POST /api/sessions/logout` → refresh token invalidado
   - Acessar rota protegida sem token → 401
   - Acessar rota admin sem role admin → 403
4. **OpenAPI**: `docs/openapi.json` atualizado com todos os novos endpoints
