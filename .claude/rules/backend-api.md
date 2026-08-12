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
│   ├── utils/           # Utilitários puros (ex.: ordenação pt-BR com Intl.Collator)
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

**Erros do Prisma nunca devem escapar crus.** O handler genérico de `app.ts` ecoa `err.message` fora de produção, então um `P2002`/`P2003`/`P2025` não tratado vira um 500 que vaza detalhe interno. Toda escrita sujeita a corrida deve traduzir os códigos conhecidos em `AppError` — ver `eventos.service.handleVersaoSentinel` (versões) e `handleIntegranteSentinel` (vínculo de integrante). Para o caso "linha sumiu durante a operação", prefira `updateMany` + checagem de `count === 0` lançando um sentinela, em vez de `update` (que lança `P2025` cru) — ver `eventos.repository.setMusicaVersaoAtomic` e seu irmão `setMusicaTonalidadeAtomic` (tom por música na escala, F10 — mesmo padrão).

Códigos HTTP utilizados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

### Checagem de unicidade nunca basta sozinha

Um `findByName`/`findByEmail`/`findTenantUser` antes da escrita resolve o **caso comum** (mensagem de erro amigável), mas não é uma trava: duas requisições concorrentes passam juntas pela checagem. Toda checagem desse tipo precisa de um respaldo no banco **e** da tradução do erro do Prisma:

- `igrejas.service.addUser` — `try/catch` na `$transaction` traduzindo `P2002` de `tenant_users` em `409` (`traduzirVinculoDuplicado`).
- `convites/accept-convite.service.handleNewUser` — `try/catch` traduzindo `P2002` de `Users.email` em `409`; o claim do convite em si já era atômico (`updateMany` condicional + `count !== 1`).
- `igrejas.service.removeUser` — o repositório usa `deleteMany` e devolve o `count`; `count === 0` vira `404`. Nunca `delete` (que lança `P2025` cru).

**Pendência conhecida**: `Tenant.name` **não tem unique constraint** no schema. `create`/`update` de igreja checam duplicidade só por leitura, então dois `POST /api/igrejas` simultâneos com o mesmo nome criam dois tenants homônimos. Fechar isso exige índice único case-insensitive (`lower(name)`, via SQL — o `@unique` do Prisma é case-sensitive) mais o `P2002` → `409`; a migração falha se já houver duplicatas em produção, então precisa de reconciliação antes.

### Sequências `MAX(x) + 1` precisam de lock

Calcular a próxima posição lendo o máximo e gravando `+1` é read-modify-write. Sob READ COMMITTED (padrão do Prisma no Postgres) duas requisições leem o mesmo máximo e gravam a mesma posição — e um `@@index([evento_id, ordem])` **não** é unique, portanto não barra a duplicata.

`eventos.repository.createMusica` abre a transação com `SELECT id FROM eventos WHERE id = $1 FOR UPDATE`, serializando as inserções daquele evento: a segunda requisição espera a primeira concluir e só então lê o máximo já atualizado.

### Cópias compostas rodam server-side, numa transação única

Duplicar uma entidade com sub-recursos (escala = evento + repertório + integrantes + funções) é um **endpoint dedicado** (`POST /eventos/:eventoId/duplicar` → `eventos.repository.duplicarEvento`), nunca uma composição de chamadas no cliente. Três razões: (1) atomicidade — 1 POST + N POSTs no cliente deixa cópia parcial se falhar no meio; (2) fidelidade — a cópia grava `Eventos_Users_Funcoes` direto, sem a revalidação contra funções **globais atuais** que `addIntegrante` faz (um integrante que trocou de função desde a escala original viraria 400); (3) custo — sem N round-trips serializados pelo lock de `MAX(ordem)+1`. O `tx` derivado de `getPrisma()` preserva o `$extends` de tenant, então as leituras da origem já chegam filtradas. Campos omitidos no body (`fk_tipo_evento`, `descricao`) herdam da origem; a cópia nasce com `status` DEFAULT `publicada`.

### Status de publicação de escalas (decisão D5)

`eventos.status` é o enum `EventoStatus` (`rascunho` | `publicada`, DEFAULT `publicada`, índice `[tenant_id, status]`). `rascunho` é a escala em preparação — não deve ser comunicada à equipe nem contar como "próxima escala". **Publicar = `PUT /api/eventos/:id` com `{ status: 'publicada' }`** — não há endpoint dedicado. `create` aceita `status` opcional (F13 cria rascunhos); `data` continua NOT NULL mesmo em rascunho. A validação de data (ISO 8601 + ano 1900–9999) vive em `parseDataEvento` (`eventos.service.ts`), compartilhada por `create`/`update`/`duplicar`.

### Projeção Prisma compartilhada, tipo derivado

Quando mais de um caminho carrega a **mesma** forma de entidade, o `include`/`select` mora num módulo só e o tipo é **derivado** dele com `Prisma.<Model>GetPayload<{ include: ReturnType<typeof fn> }>` — nunca uma interface reescrita à mão espelhando a query.

`services/auth/user-session-include.ts` é a referência: login, seleção e troca de igreja repetiam o mesmo `include` de ~40 linhas e havia ainda uma quarta cópia como interface (`IUserWithRelations`). Quatro cópias que só ficavam em sincronia por disciplina; agora mudar a projeção é erro de compilação em quem consome.

### Efeitos colaterais de desativação vivem num único helper

Desativar um tenant precisa invalidar o cache de status **e** revogar os refresh tokens dos usuários vinculados. Como o status pode virar `inactive` tanto pelo `DELETE /api/igrejas/:id` quanto pelo `PUT` com `status: 'inactive'`, os dois efeitos ficam em `aplicarEfeitosDeDesativacao` (`igrejas.service`), chamado pelos dois caminhos. Sem isso, desativar pelo `PUT` deixaria sessões ativas renovando indefinidamente num tenant desativado.

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
  - Senha: `POST /password/forgot` 5 (cada requisição dispara envio de e-mail — sem limite vira mail bomb e vetor de enumeração), `POST /password/reset` 10

  Dois desses limites são **configuráveis por env, só para desenvolvimento**: `LOGIN_RATE_LIMIT_MAX` (login, padrão 10) e `TOKEN_EXCHANGE_RATE_LIMIT_MAX` (refresh + select-tenant, padrão 60). Existem porque a suíte E2E faz um login por teste e uma renovação por carga de página, do mesmo IP — com os padrões de produção ela é inatingível num run único. Sem a variável, o valor de produção vale. **Nunca definir em produção.** Ver `.env.example` e `.claude/rules/frontend-react.md` (seção de sessão nos specs E2E).

  Estado por processo (um limiter distribuído seria necessário em deploy multi-instância). **Requer `app.set('trust proxy', 1)`** (configurado em `app.ts`) para que `req.ip` reflita o IP real do cliente atrás do proxy reverso (nginx/Docker); sem isso todos os clientes colapsariam em um único bucket. O valor `1` evita confiar em `X-Forwarded-For` forjado por clientes.

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

## Ordenação de Listas Nomeadas

- Listas completas retornadas por services (categorias, artistas) são ordenadas **no service** com `compararNomesPtBr` (`src/utils/ordenacao.ts`, `Intl.Collator('pt-BR')`) — determinístico, imune ao collation do banco e testável com os fakes.
- Listas **paginadas** (músicas) ordenam no banco (`orderBy: { nome: 'asc' }` no repository) — a paginação exige ordenação na query. O collation do banco deve ordenar acentos junto da letra-base (verificado `en_US.utf8` no dev em 2026-08-10; conferir `SELECT datcollate FROM pg_database WHERE datname = current_database();` ao provisionar novos ambientes — collation `C`/`POSIX`, comum em imagens alpine, quebraria a ordem de nomes acentuados).

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
- **Duplicidade de nome nos domínios de suporte é case-insensitive (decisão D7)**: `artistas`, `categorias`, `funcoes`, `tonalidades` e `tipos-eventos` têm `@@unique([tenant_id, nome|tom])` **case-sensitive** no Postgres — "Hillsong" e "hillsong" coexistiriam sem barreira. `findByNome`/`findByTom` e as variantes `*ExcludingId` desses 5 repositories usam `mode: 'insensitive'`, então `POST`/`PUT` retornam `409` para variação só de caixa. **Efeito em dados legados**: tenants com duplicados por caixa gravados antes desta mudança (ex.: "Grace" e "GRACE", possíveis quando a comparação ainda era case-sensitive) passam a ter edições de qualquer um dos gêmeos bloqueadas por 409 — o `*ExcludingId` exclui só o próprio id, então até um re-save sem alterar o nome colide com o gêmeo; a saída é renomear um dos dois antes de conseguir editar. **Acento não é coberto**: `mode: 'insensitive'` normaliza caixa, não diacríticos — "Adoração" e "Adoracao" continuam sendo nomes distintos no backend. A barreira de acento é client-side, mas hoje existe só no fluxo do `CreatableCombobox` (`normalizeForSearch` suprime a opção "Criar" quando já há uma opção equivalente por acento/caixa); o CRUD direto via `ConfigCrudSection` ainda não tem pré-checagem nenhuma no frontend — chega na fase F5 deste mesmo plano. Não há índice único case-insensitive no banco para esses 5 modelos (ao contrário de `tenants.name`, que tem `tenants_name_lower_key` — ver migração `20260811003000_add_tenants_name_unique_ci`); a checagem no repositório é a única barreira, então duas requisições concorrentes com variação de caixa ainda podem colidir sob corrida (mesma limitação estrutural descrita em "Checagem de unicidade nunca basta sozinha").
- **Isolamento de tenant em modelos globais**: `Users` é compartilhado entre igrejas, então buscas que alimentam escrita **precisam** filtrar por `tenant_users: { some: { tenant_id } }`. Ver `eventos.repository.findIntegranteById` e `integrantes.repository.findAll`. Sem o filtro, um usuário com `escalas.write` na igreja A consegue vincular à escala alguém que só pertence à igreja B.
- **Unificação users/integrantes (spec 018)**: A tabela `integrantes` foi removida. Os endpoints `/api/integrantes/*` operam sobre a tabela `Users`. Junction tables: `eventos_users` (antes `eventos_integrantes`), `users_funcoes` (antes `integrantes_funcoes`). O campo `name` do Users é mapeado para `nome` na resposta da API de integrantes.
- Migrações: toda alteração de schema vira um arquivo em `prisma/migrations/` (nunca SQL avulso fora do histórico de migrações). Ver "Procedimento manual de migração" abaixo — neste ambiente `npx prisma migrate dev` não funciona.
- Convenção de FK: `fk_nome_entidade` para 1:N, `[entidade]_id` para N:N.

### Procedimento manual de migração (ambiente de dev)

No banco de dev local, `npx prisma migrate dev` **aborta exigindo `migrate reset`** (que apagaria os dados): a tabela `_prisma_migrations` tem drift de checksum herdado da migração Windows→WSL, e o `migrate dev` recusa qualquer mismatch mesmo não relacionado à migração nova. Os arquivos `.sql` em git estão íntegros — o drift é só no registro do banco. Procedimento para criar uma migração **sem reset** (exemplos reais: `20260811140000_add_eventos_musicas_tonalidade`, `20260811140200_add_eventos_status`):

1. Editar `prisma/schema.prisma`.
2. Criar à mão `prisma/migrations/<YYYYMMDDHHMMSS>_<nome>/migration.sql` com o SQL que o `migrate dev` geraria.
3. `npx prisma generate` (regenera o client; não toca no banco) e **reiniciar o backend** (ver `dev-workflow.md` §2).
4. Aplicar o SQL: `./node_modules/.bin/prisma db execute --file <migration.sql> --schema prisma/schema.prisma`.
5. Registrar no histórico: `./node_modules/.bin/prisma migrate resolve --applied <nome_do_diretorio>`.

**Workaround do rtk**: o hook do rtk quebra `npx prisma db execute` e `npx prisma migrate resolve` (erro `[rtk: No such file or directory]`) — usar o binário direto `./node_modules/.bin/prisma`, ou aplicar o SQL via `docker exec -i louvorflow_db psql`. O arquivo de migração criado assim é o mesmo que o CI/staging aplica em ordem via `migrate deploy`.

## Manutenção de Documentação

- Após nova funcionalidade: atualizar `packages/backend/docs/openapi.json`.
- Após modificação de API (rotas, contratos): atualizar spec OpenAPI.
- Novas entidades/modelos: atualizar `packages/backend/prisma/schema.prisma` e documentar.

## Integração com Ferramentas

- Use `npm run typecheck` para verificação de tipos antes de commitar.
- Use `npm run test` para garantir que testes passam antes de submeter.
