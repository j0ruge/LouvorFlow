# Feature Specification: Migração para Multi-Tenant

**Feature Branch**: `020-multi-tenant`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Migração para Multi-Tenant (Shared Database, Shared Schema) — isolamento lógico por tenantId, Prisma Client Extensions, usuários N:N com tenants, login com seleção de igreja"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acesso isolado por igreja (Priority: P1)

Um membro de uma igreja acessa o sistema e visualiza apenas os dados (músicas, artistas, escalas/eventos, integrantes, categorias, funções, tonalidades, tipos de eventos) pertencentes à sua igreja. Nenhum dado de outra igreja é visível em nenhum momento, independente da operação realizada.

**Why this priority**: Sem isolamento de dados, o sistema não pode operar com múltiplos tenants. É o requisito fundacional de toda a feature — tudo depende dele.

**Independent Test**: Criar dois tenants com dados distintos. Autenticar como usuário de cada tenant e verificar que os dados retornados pertencem exclusivamente ao tenant correto. Tentar acessar dados do outro tenant via manipulação de IDs e confirmar que o sistema retorna "não encontrado".

**Acceptance Scenarios**:

1. **Given** um usuário autenticado no Tenant A, **When** ele lista músicas, **Then** apenas músicas do Tenant A são retornadas.
2. **Given** um usuário autenticado no Tenant A, **When** ele tenta acessar uma música do Tenant B pelo ID direto, **Then** o sistema retorna "não encontrado" (não "proibido").
3. **Given** um usuário autenticado no Tenant A, **When** ele cria um novo evento, **Then** o evento é automaticamente vinculado ao Tenant A sem que o usuário precise informar o tenant.
4. **Given** um usuário autenticado no Tenant A, **When** ele tenta atualizar ou excluir um recurso do Tenant B, **Then** o sistema retorna "não encontrado".

---

### User Story 2 - Login com seleção de igreja (Priority: P1)

Um usuário que pertence a mais de uma igreja faz login e escolhe em qual igreja deseja operar. Um usuário que pertence a apenas uma igreja faz login normalmente sem etapa adicional.

**Why this priority**: Sem o fluxo de login multi-tenant, não há como estabelecer o contexto de tenant para a sessão. É co-dependente do isolamento de dados.

**Independent Test**: Criar um usuário vinculado a dois tenants. Fazer login e verificar que o sistema retorna a lista de igrejas para seleção. Após selecionar, verificar que o token contém o tenant selecionado.

**Acceptance Scenarios**:

1. **Given** um usuário vinculado a apenas um tenant, **When** ele faz login com credenciais válidas, **Then** o sistema autentica normalmente e inclui o tenant no contexto da sessão, sem etapa adicional.
2. **Given** um usuário vinculado a múltiplos tenants, **When** ele faz login com credenciais válidas, **Then** o sistema retorna um status intermediário com a lista de tenants disponíveis para seleção.
3. **Given** um usuário no estado de seleção de tenant, **When** ele escolhe um tenant da lista, **Then** o sistema gera o token final com o tenant selecionado e completa o login.
4. **Given** um usuário no estado de seleção de tenant, **When** ele tenta selecionar um tenant ao qual não pertence, **Then** o sistema rejeita a operação.

---

### User Story 3 - Cadastro e gestão de igrejas (tenants) (Priority: P2)

Um administrador do sistema (super-admin) pode criar novas igrejas (tenants) e vincular usuários a elas. Dentro de cada igreja, o administrador local pode gerenciar os membros vinculados.

**Why this priority**: Necessário para operacionalizar o multi-tenant, mas pode ser feito de forma simplificada (seed/script) na primeira versão.

**Independent Test**: Criar um tenant via endpoint administrativo, vincular um usuário ao tenant e verificar que o usuário consegue fazer login e acessar dados daquele tenant.

**Acceptance Scenarios**:

1. **Given** um super-admin autenticado, **When** ele cria um novo tenant informando o nome da igreja, **Then** o tenant é criado e fica disponível para vincular usuários.
2. **Given** um super-admin autenticado, **When** ele vincula um usuário existente a um tenant, **Then** o usuário passa a ter acesso ao tenant no próximo login.
3. **Given** um super-admin autenticado, **When** ele remove o vínculo de um usuário com um tenant, **Then** o usuário perde acesso ao tenant.

---

### User Story 4 - Migração de dados existentes (Priority: P1)

Todos os dados existentes no sistema devem ser preservados e migrados para um "tenant padrão" durante a migração, sem perda de dados ou interrupção de funcionalidade.

**Why this priority**: Sem migração segura dos dados existentes, a feature quebraria toda a base de usuários atual. É um pré-requisito de implantação.

**Independent Test**: Executar a migração em uma cópia do banco de produção. Verificar que todos os registros existentes recebem o tenant padrão. Confirmar que todas as funcionalidades continuam operando normalmente após a migração.

**Acceptance Scenarios**:

1. **Given** um banco de dados single-tenant com dados existentes (músicas, artistas, escalas/eventos, integrantes, categorias, funções, tonalidades, tipos de eventos e todas as junções), **When** a migração é executada, **Then** todos os registros de domínio recebem o tenant padrão automaticamente.
2. **Given** a migração concluída, **When** um usuário existente faz login, **Then** ele acessa seus dados normalmente no tenant padrão (músicas, escalas, integrantes, etc.), sem perceber mudança.
3. **Given** a migração concluída, **When** se consulta o total de registros por entidade (artistas, músicas, eventos, categorias, funções, tonalidades, tipos_eventos, e todas as junction tables), **Then** os totais são idênticos ao pré-migração (zero perda de dados).

---

### User Story 5 - Troca de tenant sem re-login (Priority: P3)

Um usuário que pertence a múltiplas igrejas pode trocar de igreja durante a sessão sem precisar fazer logout e login novamente.

**Why this priority**: Melhora a experiência do usuário multi-tenant, mas não é bloqueante para o MVP. O usuário pode fazer logout/login como alternativa.

**Independent Test**: Autenticar um usuário multi-tenant no Tenant A, usar o mecanismo de troca para Tenant B e verificar que os dados exibidos passam a ser do Tenant B.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado no Tenant A com acesso ao Tenant B, **When** ele solicita troca para o Tenant B, **Then** o sistema emite novo token com o Tenant B e os dados exibidos são do Tenant B.
2. **Given** um usuário autenticado no Tenant A, **When** ele troca para o Tenant B, **Then** o token anterior (Tenant A) é invalidado.

---

### Edge Cases

- O que acontece quando um usuário é removido de todos os tenants? O login deve informar que o usuário não tem acesso a nenhuma igreja.
- O que acontece quando um tenant é desativado/excluído? Os dados ficam preservados mas inacessíveis (soft-delete no tenant).
- O que acontece quando um usuário tenta criar dados sem contexto de tenant (token sem tenantId)? O sistema deve rejeitar a operação com erro claro.
- O que acontece com unique constraints que atualmente são globais (ex: nome de artista)? Devem se tornar únicas por tenant (um artista "Hillsong" pode existir em múltiplas igrejas).
- O que acontece com tabelas de referência (Roles, Permissions)? Permanecem globais — não são dados de domínio específicos de uma igreja.
- O que acontece com o refresh token quando o usuário troca de tenant? O token anterior deve ser invalidado e um novo par (access + refresh) emitido para o novo contexto.
- O que acontece com o admin existente (seed) durante a migração? Deve ser elevado a `super-admin` (nível sistema, atribuído via tenant sentinela "Sistema") e também atribuído como `admin` no tenant padrão.
- O que acontece com o refresh token quando o tenant é desativado? O `RefreshTokenService` DEVE verificar `tenant.status === 'active'` antes de emitir novos tokens — rejeitar com 401 se inativo.
- O que acontece quando `signIn()` retorna `requires_tenant_selection`? A função DEVE retornar `false` para sinalizar ao caller que o login não completou. O componente de login NÃO deve navegar para o dashboard — a navegação para `/selecionar-igreja` é responsabilidade do `signIn`.
- O que acontece com `forTenant()` sob carga? A factory DEVE usar cache (`Map<tenantId, ExtendedClient>`) para evitar criação de nova instância `$extends` a cada request (memory leak).
- O que acontece com o seed executado múltiplas vezes? DEVE ser idempotente: não re-hashear senha do admin existente. Verificar se o usuário já existe antes de atualizar o campo `password`.
- O que acontece quando um admin tenta atribuir role super-admin via ACL? O sistema DEVE rejeitar com 403. O endpoint GET /api/roles NÃO deve listar roles protegidas para admins regulares.
- O que acontece quando um admin tenta editar suas próprias permissões? O sistema DEVE rejeitar com 403 (anti-self-elevation). O frontend deve desabilitar o formulário e exibir mensagem informativa.
- O que acontece quando super-admin está logado em tenant onde não tem role admin? DEVE funcionar normalmente — `is(['admin', 'super-admin'])` garante acesso. `getUserRoles/getUserPermissions` incluem SYSTEM_TENANT_ID.
- O que acontece quando controller chama save() de ACL sem tenantId? DEVE lançar erro explícito ("tenant_id é obrigatório") — nunca inserir string vazia no banco.
- O que acontece quando um repository de domínio faz `create` sem tenant_id explícito? DEVE falhar em compile-time (parâmetro obrigatório `tenantId: string`). Nunca usar placeholder `'' as any`.
- O que acontece quando uma nova variável de ambiente obrigatória é adicionada ao código? DEVE ser adicionada simultaneamente aos workflows de CD, `.env.example` (dev e deploy), e como GitHub Secret nos environments. Caso contrário, o container crasha no startup em produção.
- O que acontece quando admin de um tenant lista usuários? DEVE ver apenas as roles atribuídas naquele tenant, não roles de outros tenants. Roles do SYSTEM_TENANT_ID (super-admin) NÃO devem aparecer para admins regulares.
- O que acontece quando controller usa `req.user.tenantId!` sem `!` em `user`? TypeScript falha com TS18048 porque `req.user` é `optional`. DEVE usar `req.user!.tenantId!`.

## Clarifications

### Session 2026-03-21

- Q: Como funciona RBAC por tenant se as tabelas de auth são globais? → A: Definições de Roles/Permissions permanecem globais; as tabelas de atribuição (UsersRoles, UsersPermissions) ganham coluna `tenantId` para que o vínculo user↔role seja por tenant.
- Q: Quem pode gerenciar tenants — admin existente ou novo papel? → A: Nova role `super-admin` de nível sistema (sem contexto de tenant). A role `admin` existente continua como administrador dentro de um tenant.
- Q: Como armazenar a role `super-admin` se `users_roles.tenant_id` é NOT NULL (composite PK)? → A: Usar um tenant sentinela "Sistema" com UUID fixo `00000000-0000-0000-0000-000000000000` e `status: 'system'`. Atribuições de nível plataforma usam esse tenant_id. O tenant "Sistema" nunca aparece em listagens de igrejas nem é selecionável no login.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE isolar logicamente todos os dados de domínio por tenant, impedindo que um tenant acesse dados de outro.
- **FR-002**: O sistema DEVE interceptar automaticamente todas as operações de banco de dados em entidades de domínio para injetar o filtro de tenant, sem depender de código manual nos controllers/services.
- **FR-003**: O sistema DEVE suportar a relação N:N entre usuários e tenants — um usuário pode pertencer a múltiplas igrejas.
- **FR-004**: O sistema DEVE apresentar seleção de igreja no fluxo de login quando o usuário pertence a mais de um tenant.
- **FR-005**: O sistema DEVE fazer login direto (sem seleção) quando o usuário pertence a apenas um tenant.
- **FR-006**: O sistema DEVE incluir o identificador do tenant no token de sessão para que todas as requisições subsequentes operem no contexto correto.
- **FR-007**: O sistema DEVE permitir que um usuário tenha roles/permissões diferentes em cada tenant (ex: admin em uma igreja, músico em outra). As definições de Roles e Permissions são globais; as atribuições (UsersRoles, UsersPermissions) são escopadas por tenant. **Regra crítica**: ao carregar roles/permissions durante autenticação, o filtro DEVE incluir `tenant_id IN (selectedTenantId, SYSTEM_TENANT_ID)` para garantir que roles de nível plataforma (ex: `super-admin`) sejam sempre visíveis independente do tenant selecionado.
- **FR-008**: O sistema DEVE migrar todos os dados existentes para um tenant padrão, preservando 100% dos registros.
- **FR-009**: O sistema DEVE converter unique constraints globais de entidades de domínio para unique constraints por tenant (ex: nome de artista único por igreja, não globalmente).
- **FR-010**: O sistema DEVE manter tabelas de definição de autenticação globais (Users, Roles, Permissions). As tabelas de atribuição (UsersRoles, UsersPermissions) são escopadas por tenant via coluna tenantId. Atribuições de nível plataforma (ex: `super-admin`) usam o tenant sentinela "Sistema" (`SYSTEM_TENANT_ID`).
- **FR-011**: O sistema DEVE fornecer endpoints de gestão de igrejas (criar, listar, vincular/desvincular usuários) via `/api/igrejas`, restritos à role `super-admin` (nível sistema, sem contexto de tenant). A role `admin` existente opera dentro de um tenant específico.
- **FR-012**: O sistema DEVE rejeitar qualquer operação de escrita que não possua contexto de tenant válido, retornando erro claro.
- **FR-013**: O sistema DEVE permitir troca de tenant sem novo login completo — o usuário seleciona outra igreja e recebe novo token.
- **FR-014**: O sistema DEVE prevenir escalação de privilégios — admins regulares NÃO podem ver, atribuir ou auto-atribuir roles/permissions protegidas (super-admin, super_admin_access). Apenas super-admins podem gerenciar essas atribuições.
- **FR-015**: O sistema DEVE impedir que admins regulares editem suas próprias ACLs (anti-self-elevation). Super-admins podem editar suas próprias ACLs.
- **FR-016**: Toda rota protegida por `is(['admin'])` DEVE aceitar também `super-admin` para garantir que super-admins tenham acesso administrativo em qualquer tenant.

### Key Entities

- **Tenant (Igreja)**: Representa uma igreja/comunidade. Atributos: identificador, nome, status (ativo/inativo/system), datas de criação/atualização. O status `system` é reservado para o tenant sentinela.
- **TenantUser (Vínculo Usuário-Igreja)**: Associação N:N entre usuários e tenants. Roles e permissions por tenant são gerenciadas via UsersRoles/UsersPermissions com coluna tenantId (não no TenantUser).
- **Entidades de domínio com tenant**: Artistas, Músicas, Escalas (Eventos), Categorias, Funções, Tipos de Eventos, Tonalidades — e todas as suas tabelas de junção — passam a ter vínculo obrigatório com um tenant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos registros existentes são migrados para o tenant padrão sem perda de dados.
- **SC-002**: Nenhuma operação de leitura ou escrita retorna ou modifica dados de um tenant diferente do contexto ativo do usuário — taxa de vazamento de dados entre tenants é 0%.
- **SC-003**: Usuários com um único tenant completam o login em tempo equivalente ao fluxo atual (sem etapa adicional perceptível).
- **SC-004**: Usuários com múltiplos tenants completam o login (incluindo seleção de igreja) em menos de 10 segundos.
- **SC-005**: A troca de tenant (sem re-login) completa em menos de 3 segundos.
- **SC-006**: Todas as funcionalidades existentes continuam operando normalmente após a migração — zero regressão funcional.
- **SC-007**: Unique constraints de domínio operam por tenant — duas igrejas podem ter um artista com o mesmo nome sem conflito.

## Assumptions

- A abordagem é "Shared Database, Shared Schema" — um único banco de dados PostgreSQL com isolamento lógico via coluna tenantId.
- Tabelas de definição de autenticação (Users, Roles, Permissions, PermissionsRoles) são globais e não recebem tenantId. Tabelas de atribuição (UsersRoles, UsersPermissions) são escopadas por tenant via coluna tenantId.
- O tenant padrão criado na migração será a igreja que atualmente usa o sistema.
- A interceptação automática de queries é a camada primária de isolamento — não se depende de código manual nos endpoints.
- A gestão de tenants (CRUD de igrejas) na primeira versão pode ser restrita a super-admins, sem interface pública de auto-cadastro.
- Performance: o filtro adicional por tenantId terá impacto negligível desde que as colunas tenham índice adequado. O middleware `ensureAuthenticated` DEVE usar cache em memória (TTL 60s) para evitar query de status de tenant a cada request. A factory `forTenant()` DEVE cachear instâncias `$extends` por tenantId (Map simples, sem TTL — número de tenants é finito e pequeno).
- A gestão de tenants é feita via interface admin em `/admin/igrejas` (super-admin only). Frontend implementado com React Query + shadcn/ui.

## Research Notes: Best Practices (Prisma Multi-Tenant)

A pesquisa no Context7 (documentação oficial Prisma) revelou duas abordagens principais para multi-tenancy:

1. **Application-level filtering via `$extends`**: Intercepta queries com `$allModels` + `$allOperations` para injetar `where.tenantId` automaticamente. Mais simples, isolamento na camada da aplicação.
2. **PostgreSQL Row-Level Security (RLS) via `$extends`**: Usa `set_config('app.current_tenant_id', tenantId)` por transação + policies RLS no PostgreSQL. Isolamento na camada do banco — mais robusto contra bugs na aplicação, pois mesmo queries raw ou diretas são filtradas.

Ambas usam `$extends` do Prisma Client. A documentação oficial recomenda RLS como a abordagem mais segura para produção. Decisão: app-level filtering via `$extends` (KISS).

## Lessons Learned (Post-Implementação)

Bugs encontrados e regras derivadas para prevenir regressões:

### RBAC e Tenant Sentinela

- **Regra**: Toda query de roles/permissions no fluxo de autenticação DEVE usar `WHERE tenant_id IN (selectedTenantId, SYSTEM_TENANT_ID)`, nunca filtrar apenas pelo tenant selecionado. Caso contrário, roles de nível plataforma (super-admin) ficam invisíveis.
- **Motivo**: Bug #1 — super-admin não aparecia no frontend após login porque roles do tenant sentinela eram excluídas.

### Contratos de API (Backend ↔ Frontend)

- **Regra**: Todo endpoint DEVE ter o formato de resposta documentado com exemplo JSON completo, incluindo wrappers (`{ msg, entity }` vs. entidade direta) e campos computados (`_count.tenant_users` vs. `user_count`).
- **Regra**: Endpoints de listagem retornam array direto `[...]`. Endpoints de criação/atualização retornam `{ msg, entity }`. Endpoints de exclusão retornam 204 sem body.
- **Regra**: Respostas com relações nested (ex: `{ user: { id, name } }`) DEVEM ser documentadas explicitamente. O frontend DEVE usar `z.transform()` para achatar quando necessário.
- **Motivo**: Bugs #3 e #4 — CRUD de igrejas e listagem de usuários falhavam por desalinhamento de formato.

### Fluxo de Login Multi-Tenant

- **Regra**: O `signIn()` do AuthContext DEVE retornar `boolean` — `true` se login completou (single-tenant), `false` se requer seleção de tenant. O componente Login NÃO deve navegar após `signIn()` retornar `false`.
- **Motivo**: Bug #2 — navegação do Login.tsx sobrescrevia a navegação para `/selecionar-igreja`.

### Performance e Caching

- **Regra**: `forTenant(tenantId)` DEVE cachear instâncias `$extends` por tenantId. Criar nova instância a cada request causa memory leak.
- **Regra**: Validação de status de tenant no middleware DEVE usar cache em memória com TTL (60s). Desativação de tenant é operação rara.
- **Motivo**: Bugs #5 e #8 — performance degradada e memory leak sob carga.

### Idempotência de Seeds

- **Regra**: Seeds DEVEM ser idempotentes. Campos sensíveis (password) NÃO devem ser re-processados em upserts subsequentes. Verificar existência antes de alterar.
- **Motivo**: Bug #6 — seed re-hasheava senha a cada execução.

### SYSTEM_TENANT_ID em TODA query de roles/permissions (Princípio Universal)

- **Regra**: TODA query que busca roles ou permissions de um usuário — em qualquer camada (auth services, middlewares `is()`/`can()`, repositories `getUserRoles`/`getUserPermissions`) — DEVE incluir `SYSTEM_TENANT_ID` no filtro: `WHERE tenant_id IN (selectedTenantId, SYSTEM_TENANT_ID)`. Isso se aplica a:
  1. `authenticate-user.service.ts` (login single-tenant)
  2. `select-tenant.service.ts` (seleção de tenant)
  3. `switch-tenant.service.ts` (troca de tenant)
  4. `users.repository.ts → getUserRoles()` (chamado por `is()` e `can()`)
  5. `users.repository.ts → getUserPermissions()` (chamado por `can()`)
- **Motivo**: Bugs #1, #9 e #10 — o mesmo padrão ocorreu 3 vezes em camadas diferentes. A role `super-admin` (atribuída via SYSTEM_TENANT_ID) ficava invisível, bloqueando acesso a rotas admin e impedindo funcionalidades de super-admin.
- **Regra derivada**: Quando um bug de "role não encontrada" aparecer, o PRIMEIRO diagnóstico deve ser verificar se o filtro de `tenant_id` inclui `SYSTEM_TENANT_ID`.

### Rotas Admin devem aceitar super-admin

- **Regra**: Toda rota protegida por `is(['admin'])` DEVE aceitar também `super-admin`: `is(['admin', 'super-admin'])`. Super-admin é um nível acima de admin e DEVE ter acesso a todas as funcionalidades administrativas em qualquer tenant.
- **Motivo**: Bug #9 — super-admin logado em tenant onde não tinha role `admin` recebia 403 em rotas de users/roles/permissions.

### Controller DEVE passar tenantId ao Service/Repository

- **Regra**: Todo controller que chama `usersRepository.save()` com roles ou permissions DEVE passar `tenantId` explicitamente via `req.user!.tenantId!`. O repository NÃO deve aceitar `tenantId` vazio/undefined para operações de escrita em `usersRoles`/`usersPermissions` — DEVE lançar erro claro.
- **Motivo**: Bug #8 — controller de ACL não passava `tenantId`, causando `tenant_id: ''` (UUID inválido) no `createMany`.

### PROIBIDO: Placeholder `tenant_id: '' as any` em operações de criação

- **Regra**: Repositories de domínio NUNCA devem usar `tenant_id: '' as any` como placeholder em `create`/`createMany`. O `tenantId` DEVE ser passado explicitamente pelo controller → service → repository como parâmetro `tenantId: string`.
- **Motivo**: Bug #13 (CRÍTICO, afetou TODAS as rotas de criação de domínio) — Todos os repos de configuração (artistas, categorias, funções, tonalidades, tipos-eventos), eventos e músicas usavam `tenant_id: '' as any` esperando que o interceptor `$extends` substituísse por um UUID válido. A string vazia falhava na validação UUID do Prisma ANTES do interceptor atuar. O erro era engolido pelo try-catch dos controllers, retornando apenas "Erro ao criar X" sem diagnóstico.
- **Escopo do impacto**: 13 ocorrências em 3 repos (eventos: 4, músicas: 8, integrantes: 1) + 5 repos de configuração. Nenhum registro de domínio podia ser criado em qualquer tenant.
- **Padrão correto**: `async create(nome: string, tenantId: string) { return getPrisma().model.create({ data: { nome, tenant_id: tenantId } }) }`
- **Regra derivada**: O interceptor `$extends` é confiável para operações de LEITURA (where clauses). Para operações de ESCRITA (create/createMany), sempre passar `tenant_id` explícito.

### PROIBIDO: try-catch em controllers de domínio

- **Regra**: Controllers de domínio NÃO devem usar try-catch. Express 5 propaga automaticamente erros de funções async para o error handler centralizado em `app.ts`. Try-catch em controllers engole erros reais (ex: Prisma validation) e retorna mensagens genéricas que impossibilitam diagnóstico.
- **Motivo**: Bug #14 — Todos os controllers de configuração e eventos usavam try-catch que capturava exceções Prisma (causadas pelo bug #13) e retornava `{ erro: "Erro ao criar tipo de evento", codigo: 500 }` sem logar o erro real. O diagnóstico da causa raiz foi impossível sem ver a mensagem do Prisma.
- **Padrão correto**: Controller delega ao service sem try-catch. AppError propagado pelo Express 5 é tratado pelo error handler centralizado. Erros não-AppError aparecem no log do servidor.

### Roles duplicadas cross-tenant em listagem de usuários

- **Regra**: `GET /api/users` (admin view) DEVE filtrar `roles` e `permissions` pelo tenant ativo do caller. Sem filtro, um usuário com role "admin" em 2 tenants aparece com "admin admin" na UI.
- **Motivo**: Bug #15 — `USER_PUBLIC_SELECT` carrega roles sem `where` de tenant. Quando admin de "IAP - Piedade" listava usuários, as roles do "Igreja Padrão" também apareciam.
- **Padrão correto**: Em `findAll()`, quando `tenantId` é fornecido, adicionar `where: { tenant_id: tenantId }` nas relações `roles` e `permissions` do select. Super-admin (sem tenantId) continua vendo todas.

### Variáveis de ambiente obrigatórias no pipeline CD

- **Regra**: Toda nova variável de ambiente obrigatória adicionada ao código (via `requireSecret()` em `config/auth.ts`) DEVE ser adicionada simultaneamente ao step "Generate .env" dos workflows de CD (`cd-staging-backend.yml` e `cd-production-backend.yml`). Caso contrário, o container crasha no startup em produção.
- **Regra**: DEVE ser adicionada também aos `.env.example` (dev e deploy) para que novos desenvolvedores saibam configurá-la.
- **Motivo**: Bug #16 — `APP_SECRET_SELECTION_TOKEN` foi adicionada ao código mas não ao workflow de CD. O container crashava imediatamente com "APP_SECRET_SELECTION_TOKEN é obrigatória em ambiente de produção", gerando 57+ restarts em loop e 502 Bad Gateway em staging.
- **Checklist pré-merge para novas env vars**:
  1. `src/config/auth.ts` — `requireSecret('VAR_NAME', 'dev-fallback')`
  2. `packages/backend/.env.example` — valor de desenvolvimento
  3. `infra/backend/.env.example` — placeholder de produção
  4. `.github/workflows/cd-staging-backend.yml` — `VAR_NAME=${{ secrets.VAR_NAME }}`
  5. `.github/workflows/cd-production-backend.yml` — idem
  6. GitHub Settings → Secrets → Environment `staging` → criar o secret
  7. GitHub Settings → Secrets → Environment `production` → criar o secret

### TypeScript: `req.user` é optional na declaração Express

- **Regra**: Ao acessar `req.user.tenantId` em controllers de domínio, SEMPRE usar `req.user!.tenantId!` (double non-null assertion). O `req.user` é declarado como `user?: { ... }` no tipo global do Express, então `req.user.tenantId` causa TS18048 no typecheck.
- **Motivo**: Bug #17 — O CI falhou no typecheck após o fix do bug #13. Todos os 8 controllers de domínio usavam `req.user.tenantId!` (sem `!` em `user`), causando 15 erros TS18048. O deploy não ocorreu e o staging continuou com 502.
- **Nota**: A segurança é garantida pelo middleware `ensureTenantContext` que rejeita requests sem `tenantId` antes do controller executar.

### Interceptor `$extends` e operações unique do Prisma (ATENÇÃO)

- **Regra**: O interceptor `forTenant()` injeta `tenant_id` em `args.where` para operações de leitura (`findMany`, `findFirst`, etc.) e em `args.data` para operações de escrita. Para operações que exigem `where` unique (`findUnique`, `update`, `delete`), o Prisma NÃO aceita campos arbitrários no `where` — apenas campos que fazem parte de uma constraint unique.
- **Situação atual**: Os repositórios usam `findUnique({ where: { id } })` para busca por PK, e o interceptor adiciona `tenant_id` ao `where`. Isso funciona porque o `$allOperations` intercepta ANTES da validação do Prisma e o spread `{ ...args.where, tenant_id }` é aceito pelo runtime (embora não pela tipagem strict).
- **Risco**: Se o Prisma mudar a validação de `where` unique em versões futuras, queries `findUnique`/`update`/`delete` com `tenant_id` injetado podem quebrar.
- **Mitigação**: Monitorar changelogs do Prisma em major updates. Alternativa: usar `findFirst` ao invés de `findUnique` em repos de domínio tenant-scoped.
- **Motivo**: Code review PR #49 — comentário identificando risco de runtime em `findUnique` com where não-unique.

### Paginação inconsistente ao filtrar roles/permissions protegidas (PENDENTE)

- **Problema**: Os controllers de `GET /api/roles` e `GET /api/permissions` filtram roles/permissions protegidas APÓS a paginação do repositório. O `total` retornado é sobrescrito com `filteredData.length` (tamanho do slice filtrado), resultando em `total` menor que o real quando há mais de uma página.
- **Solução correta**: Aplicar o filtro de roles/permissions protegidas NO REPOSITÓRIO (antes de `skip/take` e `count()`), para que paginação e contagem reflitam apenas os registros visíveis ao caller.
- **Status**: Conhecido (code review PR #49), fix pendente para futura iteração. Impacto baixo enquanto o número de roles/permissions for pequeno (cabe em uma página).

### OpenAPI incompleto — `/sessions/switch-tenant` não documentado (PENDENTE)

- **Problema**: O endpoint `POST /api/sessions/switch-tenant` existe no backend mas não está documentado no `openapi.json`. O `select-tenant` está documentado.
- **Status**: Pendente. Sugestão de schema no code review PR #49.

### Prevenção de Escalação de Privilégios (OBRIGATÓRIO)

- **Regra**: O sistema DEVE implementar 3 camadas de proteção contra escalação de privilégios:
  1. **Backend — Service**: Rejeitar atribuição de roles/permissions protegidas (`super-admin`, `super_admin_access`) por callers que não são super-admin. Rejeitar auto-edição de ACL por admins regulares (anti-self-elevation).
  2. **Backend — Controllers de listagem**: Filtrar roles/permissions protegidas da listagem para admins regulares. `GET /api/roles` NÃO deve retornar `super-admin` para não-super-admins. `GET /api/permissions` NÃO deve retornar `super_admin_access`.
  3. **Frontend**: Desabilitar formulário de ACL quando admin tenta editar próprio perfil. Exibir banner informativo.
- **Motivo**: Bug #11 (CRÍTICO) — admin de tenant conseguia ver e auto-atribuir role `super-admin`, ganhando controle total da plataforma. A falha ocorria porque:
  - O endpoint de listagem de roles não filtrava por nível de privilégio
  - O endpoint de ACL não validava se o caller tinha privilégio para atribuir a role solicitada
  - Nenhuma camada impedia auto-elevação de privilégios
- **Definição de roles/permissions protegidas**: `PROTECTED_ROLE_NAMES = ['super-admin']`, `PROTECTED_PERMISSION_NAMES = ['super_admin_access']`. Centralizadas em `src/config/rbac.ts` e importadas em services e controllers.

### Invalidação de Cache React Query em Operações com Efeito Colateral

- **Regra**: Toda mutation que altera contagem ou dados derivados em outra query DEVE invalidar TODAS as queries afetadas, não apenas a query direta. Exemplo: vincular/desvincular usuário de uma igreja invalida `["admin", "igrejas", igrejaId, "users"]` (lista de users) E `["admin", "igrejas"]` (lista de igrejas com `_count.tenant_users`).
- **Motivo**: Bug #12 — após desvincular um membro, a contagem de membros na lista de igrejas permanecia stale porque o `onSuccess` da mutation invalidava apenas a lista de users, não a lista de igrejas.
- **Padrão**: Ao implementar `useMutation` com `onSuccess`, listar explicitamente TODAS as queryKeys que podem ter dados derivados afetados. Em caso de dúvida, invalidar a queryKey pai (ex: `["admin", "igrejas"]` invalida todas as sub-queries de igrejas).
