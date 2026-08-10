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
│   ├── middlewares/      # Middlewares Express (ensureAuthenticated, ensureTenantContext, ensureSuperAdmin, is, ensureHasRole, can, validateRequest, rateLimit)
│   ├── providers/        # Singletons com interface (HashProvider, TokenProvider, DateProvider, MailProvider) + selection-token-store (uso único do selection_token)
│   ├── config/           # Configurações (auth.ts com requireSecret())
│   ├── validators/       # Schemas Zod (auth.validators.ts)
│   ├── errors/          # AppError (erro padronizado)
│   └── types/           # Interfaces TypeScript
│       └── auth/        # Types de auth
├── prisma/
│   ├── schema.prisma    # Schema do banco (26 modelos: 17 domínio + 9 auth)
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

**Erros do Prisma nunca devem escapar crus.** O handler genérico de `app.ts` ecoa `err.message` fora de produção, então um `P2002`/`P2003`/`P2025` não tratado vira um 500 que vaza detalhe interno. Toda escrita sujeita a corrida deve traduzir os códigos conhecidos em `AppError` — ver `eventos.service.handleVersaoSentinel` (versões) e `handleIntegranteSentinel` (vínculo de integrante). Para o caso "linha sumiu durante a operação", prefira `updateMany` + checagem de `count === 0` lançando um sentinela, em vez de `update` (que lança `P2025` cru) — ver `eventos.repository.setMusicaVersaoAtomic`.

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
- **`is(roles: string[])`**: Verifica se o usuário possui alguma das roles especificadas (filtradas por tenant ativo). Retorna `403` se não autorizado. **Exige `req.user.tenantId`** — retorna `403` se ausente (sem tenant, `getUserRoles` omitiria o filtro e retornaria roles de todos os tenants). Use sempre após `ensureTenantContext`.
- **`ensureHasRole`**: Garante que o usuário possui ao menos uma role no tenant ativo. Também exige `req.user.tenantId` (`403` se ausente).
- **`can(permissions: string[])`**: Verifica permissões diretas do usuário + permissões via roles (filtradas por tenant ativo). Retorna `403` se não autorizado (inclui guarda de `tenantId` ausente).
- **`validateRequest({ body?, params?, query? })`**: Factory de middleware que valida request body/params/query contra schemas Zod. Retorna `400` com detalhes de validação. Para `query`, o resultado validado é exposto em `res.locals.query` (Express 5 torna `req.query` imutável).
- **`rateLimit({ windowMs, max, message? })`** (`src/middlewares/rateLimit.ts`): Factory de rate limiting em memória, sem dependências externas. Limita requisições por IP numa janela fixa e retorna `429` ao exceder. Aplicado em **todas as rotas públicas que executam `bcrypt` ou consomem token**, para proteger contra brute force, enumeração e exaustão de CPU — janela de 15 min em todas:
  - Convites: `/:token/validate` 30, `/:token/accept` 10
  - Sessões: `POST /sessions` (login) 10, `POST /sessions/refresh-token` 60, `POST /sessions/select-tenant` 60
  - Senha: `POST /password/forgot` 5 (cada requisição dispara envio de e-mail — sem limite vira mail bomb e vetor de enumeração), `POST /password/reset` 10 Estado por processo (um limiter distribuído seria necessário em deploy multi-instância). **Requer `app.set('trust proxy', 1)`** (configurado em `app.ts`) para que `req.ip` reflita o IP real do cliente atrás do proxy reverso (nginx/Docker); sem isso todos os clientes colapsariam em um único bucket. O valor `1` evita confiar em `X-Forwarded-For` forjado por clientes.

**Isolamento de tenant em rotas de auth (users/roles/permissions)**: além de `is(['admin','super-admin'])`, todas usam `ensureTenantContext`. A guarda de `tenantId` em `is`/`can`/`ensureHasRole` é defesa em profundidade — o vazamento cross-tenant de roles é impedido mesmo se a ordem dos middlewares for alterada.

### Proteção de rotas de domínio

Todos os endpoints de domínio (artistas, categorias, eventos, funções, integrantes, músicas, tipos-eventos, tonalidades, relatórios) são protegidos:

- **GET**: `ensureAuthenticated, ensureTenantContext` — qualquer usuário logado com tenant ativo
- **POST / PUT / DELETE**: `ensureAuthenticated, ensureTenantContext, can(['recurso.write'])` — exige permissão de escrita no tenant ativo

**Grupos de funções (`/api/funcoes-grupos`)**: recurso próprio (não aninhado em `/api/funcoes`, que colidiria com `GET /funcoes/:id`). Além do CRUD, expõe `PATCH /reorder` (lista completa dos grupos do tenant; subconjunto retorna 400) e `PUT /:id/funcoes` (substitui o conjunto de funções do grupo — quem sai fica sem grupo, quem entra é movido do grupo anterior). Escritas exigem `configuracoes.write`. A rota `/reorder` é declarada **antes** das rotas com `:id`.

### Health check (rota pública de observabilidade)

`GET /api/health` (`health.routes.ts` → `health.controller.ts`) é público — sem `ensureAuthenticated` nem `ensureTenantContext`. Retorna `{ status: 'ok', sha, timestamp }`, onde `sha` vem da env `GIT_SHA` (injetada em build-time pelo Dockerfile via build-arg `GIT_SHA=${{ github.sha }}`; `'unknown'` fora do CI). Consumido pelo healthcheck do container (`infra/backend/docker-compose.yml`) e pelo smoke test pós-deploy do CI (assert do SHA no ar). Documentado em `infra/README.md` (seção "Detecção de deploy parcial").

### Padrão misto: rotas autenticadas + públicas (Convites)

O módulo de convites (`/api/convites`) combina rotas autenticadas (líder: gerar, listar, revogar) e rotas públicas (participante: validar token, aceitar convite) no mesmo arquivo de rotas. Rotas públicas não usam middlewares de autenticação — o token UUID na URL é a única forma de autorização.

**Papel atribuído no aceite (spec 023, FR-004)**: `accept-convite.service` atribui a role `integrante` (membro básico, criada sem nenhuma permissão pelo seed) ao usuário no tenant do convite, dentro da mesma transação que consome o token — tanto para conta nova (`create`) quanto para conta já existente (`upsert`). A role é resolvida **antes** de qualquer escrita: se não existir, a requisição falha com `500` sem criar conta nem gastar o convite. Sem essa atribuição o participante entraria na igreja sem nenhuma role, e `ensureHasRole` o bloquearia.

### Rotas de gestão de tenants

- `/api/igrejas/*`: protegidas por `ensureAuthenticated + ensureSuperAdmin`
- Usam `basePrisma` (sem filtro de tenant) para operações cross-tenant
- **Guarda do tenant sentinela**: `getById`, `update`, `deactivate`, `addUser`, `removeUser` e `listUsers` recusam `SYSTEM_TENANT_ID` com `403`. O ID é uma constante fixa e pública (`00000000-0000-0000-0000-000000000000`), e é nele que vivem as atribuições de `super-admin` de toda a plataforma — sem a guarda, um `PUT` sobrescreveria seu `status: 'system'` por `active`/`inactive` (únicos valores do validator), quebrando o filtro de `findAll` sem caminho de volta pela API.
- **Atomicidade**: `create()` executa a criação do tenant e o `seedTenantDefaults` na mesma `$transaction` (falha no seed desfaz o tenant, evitando um registro meio-semeado cujo retry bateria no 409 de nome duplicado). `addUser()` resolve a role `admin` **antes** de qualquer escrita e cria vínculo + atribuição de role numa `$transaction` — nunca um sem o outro.
- **Efeito colateral documentado**: `POST /api/igrejas/:id/users` atribui automaticamente a role `admin` ao usuário naquele tenant (super-admin delegando a gestão da igreja).
- Os 8 endpoints estão documentados em `packages/backend/docs/openapi.json` sob a tag `Igrejas`.
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

`src/config/auth.ts` — Configurações de JWT (secret, expiração). Usa `requireSecret(envVar)` que: em produção, lança erro se a variável não estiver definida; em desenvolvimento, quando ausente, **gera um segredo aleatório efêmero por processo** (`crypto.randomBytes`) — nunca um fallback fixo no código-fonte (que permitiria forjar tokens). Como o segredo gerado muda a cada reinício, os tokens de dev são invalidados ao reiniciar. Secrets configurados:

- `APP_SECRET` — access token
- `APP_SECRET_REFRESH_TOKEN` — refresh token
- `APP_SECRET_SELECTION_TOKEN` — selection token para fluxo multi-tenant de seleção de igreja (expiração: 5min)

**Rotação segura de refresh token**: `refresh-token.service` chama `refreshTokensRepository.rotateAtomic`, que remove o token antigo e cria o novo dentro de uma única transação Prisma (`$transaction`). O `deleteMany` mantém a trava otimista (a contagem de linhas removidas; em requisições concorrentes apenas uma obtém `count === 1`, impedindo double-spend) e a atomicidade garante que uma falha ao persistir o novo token faça rollback, preservando o antigo (o usuário não fica deslogado por um erro transitório). A emissão de nova sessão completa (`authenticate-user._generateSession`, reutilizada por select/switch-tenant) usa `replaceAllByUserId`, que remove todos os tokens do usuário e cria o novo na mesma transação.

**Selection token de uso único**: o `selection_token` carrega um `jti`; `select-tenant.service` o consome uma única vez via `selection-token-store.provider` (store em memória, por processo) imediatamente antes de emitir a sessão, bloqueando replay dentro da validade de 5 min.

**Login em tempo constante**: `authenticate-user.service` executa um `compareHash` contra um hash descartável (gerado de um valor aleatório e memoizado) quando o e-mail não existe. A mensagem de erro já era idêntica nos dois casos, mas sem essa comparação o caminho "e-mail inexistente" retornaria em milissegundos enquanto o de "senha errada" gastaria o bcrypt de custo 12 — a diferença de tempo, sozinha, permitiria enumerar quais e-mails têm conta.

### Seeds

`seeds/admin.ts` — Bootstrap idempotente: cria tenant sentinela "Sistema" (`SYSTEM_TENANT_ID`), tenant padrão (`DEFAULT_TENANT_ID`), roles `admin`, `super-admin` e `integrante`, permissões de domínio, e usuário admin com dual assignment. Usa variáveis de ambiente `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`. Roda a cada deploy (ver `.github/workflows/cd-staging-backend.yml`), antes de o container novo subir.

A role `integrante` é criada **deliberadamente sem permissões**: ela dá ao membro convidado uma role no tenant (satisfazendo `ensureHasRole`) sem conceder escrita. O líder promove depois, se quiser.

`seeds/domain-defaults.ts` — `seedTenantDefaults(client, tenantId)` semeia funções, grupos de funções, tipos de evento, categorias e tonalidades de um tenant. O parâmetro é tipado como `Prisma.TransactionClient` (que o `PrismaClient` base também satisfaz), para que a mesma função sirva ao seed avulso e à criação de igreja pela API dentro de uma `$transaction`.

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
- Schema: `packages/backend/prisma/schema.prisma` (26 modelos: 17 domínio + 9 auth).
- Client: `packages/backend/prisma/cliente.ts`:
  - `prisma` (default export) — singleton base, sem filtro de tenant. Usar para operações globais (auth, seeds, super-admin).
  - `forTenant(tenantId)` — retorna client com `$extends` que injeta `tenant_id` em todas as operações de domínio.
  - `getPrisma()` — retorna o client do contexto atual via AsyncLocalStorage (tenant-scoped se em request com tenant, base caso contrário). **Repositories de domínio DEVEM usar `getPrisma()`.**
  - `SYSTEM_TENANT_ID`, `DEFAULT_TENANT_ID` — constantes dos tenants fixos.
- **Proteção do campo `password`**: toda query que retorna dados de usuário ao frontend **DEVE** usar `USER_PUBLIC_SELECT` (auth) ou `INTEGRANTE_PUBLIC_SELECT` (domínio).
- **E-mail é case-insensitive de ponta a ponta**: `Users.email` tem `@unique` **case-sensitive** no Postgres, então `Bob@x.com` e `bob@x.com` seriam duas linhas distintas. Para impedir contas duplicadas: (1) os validators Zod normalizam com `.trim().toLowerCase()` antes de gravar; (2) **toda** busca por e-mail usa `mode: 'insensitive'` — `auth/users.repository.findByEmail` (login, com `orderBy: created_at asc` para resolver de forma determinística eventuais duplicatas legadas), `integrantes.repository.findByEmail` e `findByEmailExcludingId`. Um lookup case-sensitive em qualquer caminho de escrita reabre a brecha.
- **Isolamento de tenant em modelos globais**: `Users` é compartilhado entre igrejas, então buscas que alimentam escrita **precisam** filtrar por `tenant_users: { some: { tenant_id } }`. Ver `eventos.repository.findIntegranteById` e `integrantes.repository.findAll`. Sem o filtro, um usuário com `escalas.write` na igreja A consegue vincular à escala alguém que só pertence à igreja B.
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
