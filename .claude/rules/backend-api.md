---
paths:
  - "packages/backend/**"
---

# Backend — Regras de Desenvolvimento

## Arquitetura em Camadas

```text
Request → Routes → Middlewares (auth/validation) → Controllers → Services → Repositories → Prisma → PostgreSQL
```

Estrutura do backend:

```text
packages/backend/
├── src/
│   ├── routes/          # Definições de rota
│   │   └── auth/        # Rotas de autenticação e RBAC
│   ├── controllers/     # Manipuladores de requisição HTTP
│   │   └── auth/        # Controllers de auth (sessions, users, roles, permissions, profile, password)
│   ├── services/        # Lógica de negócio e validações
│   │   ├── auth/        # Services de auth
│   │   └── convites/    # Services de convites (gerar, validar, aceitar, listar, revogar)
│   ├── repositories/    # Acesso a dados (Prisma ORM)
│   │   └── auth/        # Repositories de auth
│   ├── context/          # AsyncLocalStorage para tenant context por request
│   ├── middlewares/      # Middlewares Express (ensureAuthenticated, ensureTenantContext, ensureSuperAdmin, is, can, validateRequest)
│   ├── providers/        # Singletons com interface (HashProvider, TokenProvider, DateProvider, MailProvider)
│   ├── config/           # Configurações (auth.ts com requireSecret())
│   ├── validators/       # Schemas Zod (auth.validators.ts)
│   ├── errors/          # AppError (erro padronizado)
│   └── types/           # Interfaces TypeScript
│       └── auth/        # Types de auth
├── prisma/
│   ├── schema.prisma    # Schema do banco (25 modelos: 16 domínio + 9 auth)
│   ├── cliente.ts       # Prisma Client: singleton base + forTenant() + getPrisma()
│   └── migrations/      # Migrações do banco
├── seeds/
│   └── admin.ts         # Bootstrap idempotente: tenants, admin, super-admin
├── tests/
│   ├── services/        # Testes unitários dos services
│   └── fakes/           # Repositórios falsos para testes
├── docs/
│   └── openapi.json     # Especificação OpenAPI 3.0
└── index.ts             # Entry point (porta 3000)
```

## Criação paralela de artefatos (MANDATORY RULE)

Todas as operações devem ser concorrentes/paralelas em projetos de API.
Crie endpoints, modelos de banco de dados, testes e documentação simultaneamente.
Exemplo de padrão correto:

```text
- Write("packages/backend/src/routes/recurso.routes.ts", routes)
- Write("packages/backend/src/controllers/recurso.controller.ts", controller)
- Write("packages/backend/src/services/recurso.service.ts", service)
- Write("packages/backend/src/repositories/recurso.repository.ts", repository)
- Write("packages/backend/src/validators/recurso.validators.ts", validators)
- Write("packages/backend/src/middlewares/recurso.middleware.ts", middleware)  # se necessário
- Write("packages/backend/tests/services/recurso.service.test.ts", tests)
- Write("packages/backend/docs/openapi.json", spec)  # atualizar
```

## Formato de erros

Todas as respostas de erro devem seguir o formato padronizado usando `AppError`:

```json
{ "erro": "Mensagem descritiva do erro", "codigo": 400 }
```

Controllers **NÃO** usam try-catch. Express 5 suporta async error handling nativo — erros lançados em controllers/services/repositories propagam automaticamente para o error handler centralizado em `app.ts`.

Códigos HTTP utilizados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

## Autenticação e Autorização (RBAC)

### Middleware chain para rotas protegidas

```text
ensureAuthenticated → ensureTenantContext → can(permissions) → validateRequest({ body, params }) → controller
```

### Middlewares disponíveis

- **`ensureAuthenticated`**: Verifica JWT no header `Authorization: Bearer <token>`, injeta `req.user.id` e `req.user.tenantId`. Se o token contém `tenantId`, valida que o tenant está ativo, cria Prisma scoped via `forTenant()` em `req.prisma`, e configura AsyncLocalStorage para `getPrisma()`. Retorna `401` se token inválido/ausente ou tenant inativo.
- **`ensureTenantContext`**: Verifica que `req.user.tenantId` está presente. Retorna `403` se ausente. **Obrigatório em todas as rotas de domínio.**
- **`ensureSuperAdmin`**: Verifica role `super-admin` via tenant sentinela (SYSTEM_TENANT_ID). Anexa `basePrisma` ao request. Usado em rotas `/api/igrejas`.
- **`is(roles: string[])`**: Verifica se o usuário possui alguma das roles especificadas (filtradas por tenant ativo). Retorna `403` se não autorizado.
- **`can(permissions: string[])`**: Verifica permissões diretas do usuário + permissões via roles (filtradas por tenant ativo). Retorna `403` se não autorizado.
- **`validateRequest({ body?, params? })`**: Factory de middleware que valida request body/params contra schemas Zod. Retorna `400` com detalhes de validação.

### Proteção de rotas de domínio

Todos os endpoints de domínio (artistas, categorias, eventos, funções, integrantes, músicas, tipos-eventos, tonalidades, relatórios) são protegidos:

- **GET**: `ensureAuthenticated, ensureTenantContext` — qualquer usuário logado com tenant ativo
- **POST / PUT / DELETE**: `ensureAuthenticated, ensureTenantContext, can(['recurso.write'])` — exige permissão de escrita no tenant ativo

### Padrão misto: rotas autenticadas + públicas (Convites)

O módulo de convites (`/api/convites`) combina rotas autenticadas (líder: gerar, listar, revogar) e rotas públicas (participante: validar token, aceitar convite) no mesmo arquivo de rotas. Rotas públicas não usam middlewares de autenticação — o token UUID na URL é a única forma de autorização.

### Rotas de gestão de tenants

- `/api/igrejas/*`: protegidas por `ensureAuthenticated + ensureSuperAdmin`
- Usam `basePrisma` (sem filtro de tenant) para operações cross-tenant
- Endpoints:
  - `GET /api/igrejas` — listar tenants
  - `POST /api/igrejas` — criar tenant
  - `GET /api/igrejas/:id` — detalhar tenant
  - `PUT /api/igrejas/:id` — atualizar tenant
  - `DELETE /api/igrejas/:id` — remover tenant
  - `GET /api/igrejas/:id/users` — listar usuários vinculados ao tenant
  - `POST /api/igrejas/:id/users` — vincular usuário ao tenant
  - `DELETE /api/igrejas/:id/users/:userId` — desvincular usuário do tenant

### Providers

Singletons em `src/providers/` com interfaces definidas em `src/types/auth/`:

| Provider | Responsabilidade |
|----------|-----------------|
| `HashProvider` | Hashing de senhas (bcryptjs) |
| `TokenProvider` | Geração/verificação de JWT (jsonwebtoken) |
| `DateProvider` | Manipulação de datas/expiração (dayjs) |
| `MailProvider` | Envio de e-mails (nodemailer) |

### Config

`src/config/auth.ts` — Configurações de JWT (secret, expiração). Usa `requireSecret()` que lança erro em produção se a variável não estiver definida. Secrets configurados:

- `APP_SECRET` — access token
- `APP_SECRET_REFRESH_TOKEN` — refresh token
- `APP_SECRET_SELECTION_TOKEN` — selection token para fluxo multi-tenant de seleção de igreja (expiração: 5min)

### Seeds

`seeds/admin.ts` — Bootstrap idempotente: cria tenant sentinela "Sistema" (`SYSTEM_TENANT_ID`), tenant padrão (`DEFAULT_TENANT_ID`), roles `admin` e `super-admin`, permissões de domínio, e usuário admin com dual assignment. Usa variáveis de ambiente `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

## Validação de entrada

Validação de entrada obrigatória usando **Zod** em todos os endpoints.
Schemas de validação ficam em `src/validators/` (ex.: `auth.validators.ts`).
O middleware `validateRequest()` aplica os schemas automaticamente.

### Express 5 Breaking Changes

- **`req.query` é read-only** (getter). Middlewares NÃO devem reatribuir `req.query = ...`. Para validação, usar `schema.parse(req.query)` sem reatribuição — o resultado validado pode ser usado localmente, mas não deve substituir `req.query`.
- **Async error handling nativo**: Express 5 propaga automaticamente erros de funções async para o error handler. Controllers NÃO precisam de try-catch.

## Transformações Prisma → API Response

Quando o backend usa Prisma com junction tables (M:N), o controller **DEVE** transformar o formato antes de retornar ao frontend:

1. **Junction table → flat**: Prisma M:N retorna `{ role: { id, name } }`. O controller DEVE achatar para `{ id, name }` usando `flattenUserRelations()` ou `flattenRolePermissions()` de `src/types/auth.types.ts`.
2. **Campos computados**: `avatar_url` não existe no banco. TODO endpoint que retorna User DEVE computar: `avatar_url = avatar ? "${APP_API_URL}/files/${avatar}" : null`.
3. **Timestamps em relações**: Selects Prisma de relações M:N devem incluir `created_at` e `updated_at` nos nested objects.

## Convenções de Código

- Use RESTful APIs com verbos HTTP padrão (GET, POST, PUT, DELETE).
- Documentação OpenAPI para todos os endpoints.
- Versionamento por URL (`/v1/`, `/v2/`) para mudanças quebradoras.

## Testes

- Framework: **Vitest** com `globals: true` e ambiente `node`.
- Padrão: testes unitários dos **services** com **repositórios falsos** (fakes).
- Fakes ficam em `tests/fakes/` e implementam a mesma interface dos repositórios reais.
- Dados mock compartilhados em `tests/fakes/mock-data.ts`.
- Scripts: `npm run test` (execução única), `npm run test:watch` (modo watch).

## Banco de Dados

- ORM: **Prisma 6** com PostgreSQL 17.
- Schema: `packages/backend/prisma/schema.prisma` (25 modelos: 16 domínio + 9 auth).
- Client: `packages/backend/prisma/cliente.ts`:
  - `prisma` (default export) — singleton base, sem filtro de tenant. Usar para operações globais (auth, seeds, super-admin).
  - `forTenant(tenantId)` — retorna client com `$extends` que injeta `tenant_id` em todas as operações de domínio.
  - `getPrisma()` — retorna o client do contexto atual via AsyncLocalStorage (tenant-scoped se em request com tenant, base caso contrário). **Repositories de domínio DEVEM usar `getPrisma()`.**
  - `SYSTEM_TENANT_ID`, `DEFAULT_TENANT_ID` — constantes dos tenants fixos.
- **Proteção do campo `password`**: toda query que retorna dados de usuário ao frontend **DEVE** usar `USER_PUBLIC_SELECT` (auth) ou `INTEGRANTE_PUBLIC_SELECT` (domínio).
- **Unificação users/integrantes (spec 018)**: A tabela `integrantes` foi removida. Os endpoints `/api/integrantes/*` operam sobre a tabela `Users`. Junction tables: `eventos_users` (antes `eventos_integrantes`), `users_funcoes` (antes `integrantes_funcoes`). O campo `name` do Users é mapeado para `nome` na resposta da API de integrantes.
- Migrações via `npx prisma migrate dev`. Nunca usar SQL direto para alterar schema.
- Convenção de FK: `fk_nome_entidade` para 1:N, `[entidade]_id` para N:N.

## Manutenção de Documentação

- Após nova funcionalidade: atualizar `packages/backend/docs/openapi.json`.
- Após modificação de API (rotas, contratos): atualizar spec OpenAPI.
- Novas entidades/modelos: atualizar `packages/backend/prisma/schema.prisma` e documentar.

## Integração com Ferramentas

- Use `npm run typecheck` para verificação de tipos antes de commitar.
- Use `npm run test` para garantir que testes passam antes de submeter.
