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
│   │   └── auth/        # Services de auth
│   ├── repositories/    # Acesso a dados (Prisma ORM)
│   │   └── auth/        # Repositories de auth
│   ├── middlewares/      # Middlewares Express (ensureAuthenticated, is, can, validateRequest)
│   ├── providers/        # Singletons com interface (HashProvider, TokenProvider, DateProvider, MailProvider)
│   ├── config/           # Configurações (auth.ts com requireSecret())
│   ├── validators/       # Schemas Zod (auth.validators.ts)
│   ├── errors/          # AppError (erro padronizado)
│   └── types/           # Interfaces TypeScript
│       └── auth/        # Types de auth
├── prisma/
│   ├── schema.prisma    # Schema do banco (22 modelos: 14 domínio + 8 auth)
│   ├── cliente.ts       # Singleton do Prisma Client
│   └── migrations/      # Migrações do banco
├── seeds/
│   └── admin.ts         # Bootstrap idempotente do admin
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
ensureAuthenticated → is(roles) / can(permissions) → validateRequest({ body, params }) → controller
```

### Middlewares disponíveis

- **`ensureAuthenticated`**: Verifica JWT no header `Authorization: Bearer <token>`, injeta `req.user.id`. Retorna `401` se token inválido/ausente.
- **`is(roles: string[])`**: Verifica se o usuário possui alguma das roles especificadas (cacheadas em `req.user.roles`). Retorna `403` se não autorizado.
- **`can(permissions: string[])`**: Verifica permissões diretas do usuário + permissões via roles (cacheadas em `req.user`). Retorna `403` se não autorizado.
- **`validateRequest({ body?, params? })`**: Factory de middleware que valida request body/params contra schemas Zod. Retorna `400` com detalhes de validação.

### Providers

Singletons em `src/providers/` com interfaces definidas em `src/types/auth/`:

| Provider | Responsabilidade |
|----------|-----------------|
| `HashProvider` | Hashing de senhas (bcryptjs) |
| `TokenProvider` | Geração/verificação de JWT (jsonwebtoken) |
| `DateProvider` | Manipulação de datas/expiração (dayjs) |
| `MailProvider` | Envio de e-mails (nodemailer) |

### Config

`src/config/auth.ts` — Configurações de JWT (secret, expiração). Usa `requireSecret()` que lança erro em produção se `APP_SECRET` não estiver definido.

### Seeds

`seeds/admin.ts` — Bootstrap idempotente do usuário admin com role `admin`. Usa variáveis de ambiente `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

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
- Schema: `packages/backend/prisma/schema.prisma` (22 modelos: 14 domínio + 8 auth).
- Singleton do client: `packages/backend/prisma/cliente.ts`.
- Migrações via `npx prisma migrate dev`. Nunca usar SQL direto para alterar schema.
- Convenção de FK: `fk_nome_entidade` para 1:N, `[entidade]_id` para N:N.

## Manutenção de Documentação

- Após nova funcionalidade: atualizar `packages/backend/docs/openapi.json`.
- Após modificação de API (rotas, contratos): atualizar spec OpenAPI.
- Novas entidades/modelos: atualizar `packages/backend/prisma/schema.prisma` e documentar.

## Integração com Ferramentas

- Use `npm run typecheck` para verificação de tipos antes de commitar.
- Use `npm run test` para garantir que testes passam antes de submeter.
