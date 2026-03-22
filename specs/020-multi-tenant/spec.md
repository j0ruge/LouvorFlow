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
- **FR-007**: O sistema DEVE permitir que um usuário tenha roles/permissões diferentes em cada tenant (ex: admin em uma igreja, músico em outra). As definições de Roles e Permissions são globais; as atribuições (UsersRoles, UsersPermissions) são escopadas por tenant.
- **FR-008**: O sistema DEVE migrar todos os dados existentes para um tenant padrão, preservando 100% dos registros.
- **FR-009**: O sistema DEVE converter unique constraints globais de entidades de domínio para unique constraints por tenant (ex: nome de artista único por igreja, não globalmente).
- **FR-010**: O sistema DEVE manter tabelas de definição de autenticação globais (Users, Roles, Permissions). As tabelas de atribuição (UsersRoles, UsersPermissions) são escopadas por tenant via coluna tenantId. Atribuições de nível plataforma (ex: `super-admin`) usam o tenant sentinela "Sistema" (`SYSTEM_TENANT_ID`).
- **FR-011**: O sistema DEVE fornecer endpoints de gestão de igrejas (criar, listar, vincular/desvincular usuários) via `/api/igrejas`, restritos à role `super-admin` (nível sistema, sem contexto de tenant). A role `admin` existente opera dentro de um tenant específico.
- **FR-012**: O sistema DEVE rejeitar qualquer operação de escrita que não possua contexto de tenant válido, retornando erro claro.
- **FR-013**: O sistema DEVE permitir troca de tenant sem novo login completo — o usuário seleciona outra igreja e recebe novo token.

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
- Performance: o filtro adicional por tenantId terá impacto negligível desde que as colunas tenham índice adequado.
- A gestão de tenants na v1 é exclusivamente via API (curl/Postman). Interface administrativa frontend para igrejas será implementada em feature futura.

## Research Notes: Best Practices (Prisma Multi-Tenant)

A pesquisa no Context7 (documentação oficial Prisma) revelou duas abordagens principais para multi-tenancy:

1. **Application-level filtering via `$extends`**: Intercepta queries com `$allModels` + `$allOperations` para injetar `where.tenantId` automaticamente. Mais simples, isolamento na camada da aplicação.
2. **PostgreSQL Row-Level Security (RLS) via `$extends`**: Usa `set_config('app.current_tenant_id', tenantId)` por transação + policies RLS no PostgreSQL. Isolamento na camada do banco — mais robusto contra bugs na aplicação, pois mesmo queries raw ou diretas são filtradas.

Ambas usam `$extends` do Prisma Client. A documentação oficial recomenda RLS como a abordagem mais segura para produção. A decisão entre as duas será tomada na fase de planejamento técnico (`/speckit.plan`).
