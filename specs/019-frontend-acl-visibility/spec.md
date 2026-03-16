# Feature Specification: Visibilidade ACL no Frontend

**Feature Branch**: `019-frontend-acl-visibility`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Implementar controle de visibilidade ACL no frontend — ocultar botões CRUD (criar, editar, excluir) para usuários sem permissão adequada em todas as páginas de domínio"

## Clarifications

### Session 2026-03-15

- Q: O backend deve migrar de `ensureHasRole` para `can(['<recurso>.write'])` nos endpoints de domínio? → A: Sim, migrar para proteção granular end-to-end.
- Q: As permissões granulares devem ser criadas via seed script ou via admin UI? → A: Via seed script, criadas automaticamente no bootstrap (como `admin_full_access`).
- Q: Configurações deve ter uma permissão única ou uma por sub-recurso? → A: Uma única permissão `configuracoes.write` para todos os 5 sub-recursos.
- Q: O botão "Contatar" em Integrantes deve ter restrição de permissão? → A: Não, visível para todos os autenticados.
- Q: Como o frontend deve reagir ao receber 403 do backend? → A: Exibir toast de "Permissão negada" e manter o usuário na página atual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Permissões granulares propagadas ao frontend (Priority: P1)

Como administrador do sistema, preciso que o frontend receba as permissões do usuário logado (roles e permissions) para que a interface possa decidir o que exibir ou ocultar sem depender apenas do flag `isAdmin`.

Atualmente o frontend só conhece `isAdmin` (boolean). Para ocultar botões de forma granular, o frontend precisa saber **quais permissões** o usuário possui — seja diretamente ou via roles.

**Why this priority**: Sem as permissões disponíveis no frontend, nenhuma das demais stories pode funcionar. Esta é a fundação de todo o controle de visibilidade.

**Independent Test**: Pode ser testada isoladamente verificando que, após login, o objeto `user` no contexto de autenticação contém a lista de permissões efetivas (diretas + herdadas via roles).

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com role "lider_louvor" que possui permissão "musicas.write", **When** o frontend carrega o perfil do usuário, **Then** o contexto de autenticação inclui "musicas.write" na lista de permissões efetivas.
2. **Given** um usuário autenticado sem nenhuma role, **When** o frontend carrega o perfil, **Then** a lista de permissões efetivas está vazia e nenhum botão de escrita é exibido.
3. **Given** um usuário admin, **When** o frontend carrega o perfil, **Then** o admin possui a permissão "admin_full_access" que concede acesso a tudo.

---

### User Story 2 — Ocultar ações CRUD em Configurações (Priority: P1)

Como membro comum da equipe de louvor, ao acessar a página de Configurações (Artistas, Categorias, Funções, Tonalidades, Tipos de Eventos), não devo ver botões de criar (+), editar (lápis) ou excluir (lixeira) se não tiver permissão de escrita para configurações.

**Why this priority**: Configurações é usada por todos mas editada por poucos. A exposição de botões CRUD para quem não tem permissão gera confusão e tentativas frustradas.

**Independent Test**: Logar com usuário sem permissão "configuracoes.write" e verificar que a página de configurações mostra apenas a listagem, sem campos de input, botões de criar, ícones de editar ou lixeira.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão "configuracoes.write", **When** acessa /configuracoes, **Then** vê apenas a lista de itens sem ações de criação, edição ou exclusão.
2. **Given** um usuário com permissão "configuracoes.write", **When** acessa /configuracoes, **Then** vê o campo de input para criar, ícones de editar e excluir em cada item.
3. **Given** um usuário admin, **When** acessa /configuracoes, **Then** vê todas as ações CRUD (admin tem acesso total).

---

### User Story 3 — Ocultar ações CRUD em Integrantes (Priority: P1)

Como membro da equipe, ao acessar a página de Integrantes, não devo ver o botão "Novo Integrante" nem o botão "Editar" de outros membros se não tiver permissão. Porém, devo sempre poder editar meu próprio perfil.

**Why this priority**: Integrantes é uma área sensível — criar e editar membros deve ser restrito, mas cada pessoa deve poder atualizar seus próprios dados.

**Independent Test**: Logar com usuário comum, verificar que "Novo Integrante" não aparece, que o botão "Editar" não aparece nos cards de outros membros, mas aparece no próprio card do usuário.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão "integrantes.write", **When** acessa /integrantes, **Then** não vê o botão "Novo Integrante".
2. **Given** um usuário sem permissão "integrantes.write", **When** visualiza a lista de membros, **Then** não vê botões "Editar" ou lixeira nos cards de **outros** membros.
3. **Given** qualquer usuário autenticado, **When** visualiza seu próprio card na lista, **Then** vê o botão "Editar" no seu card (auto-edição sempre permitida).
4. **Given** um usuário com permissão "integrantes.write", **When** acessa /integrantes, **Then** vê "Novo Integrante" e botões de editar/excluir em todos os cards.

---

### User Story 4 — Ocultar ações CRUD em Escalas (Priority: P1)

Como membro da equipe, ao acessar a página de Escalas, não devo ver "Nova Escala", "Editar" ou "Excluir" se não tiver permissão de escrita para escalas.

**Why this priority**: Escalas são o recurso principal do sistema. Apenas líderes ou responsáveis devem poder criá-las e modificá-las.

**Independent Test**: Logar com usuário sem permissão "escalas.write", verificar que apenas "Ver Detalhes" aparece nos cards de escalas.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão "escalas.write", **When** acessa /escalas, **Then** não vê o botão "Nova Escala" nem os botões "Editar" e "Excluir" nos cards.
2. **Given** um usuário sem permissão "escalas.write", **When** acessa /escalas/:id, **Then** vê os detalhes mas não vê "Editar", "Excluir" nem os controles de adicionar/remover músicas e integrantes.
3. **Given** um usuário com permissão "escalas.write", **When** acessa /escalas, **Then** vê todas as ações CRUD.

---

### User Story 5 — Ocultar ações CRUD em Músicas (Priority: P1)

Como membro da equipe, ao acessar a página de Músicas e os detalhes de uma música, não devo ver botões de criar, editar ou excluir se não tiver permissão.

**Why this priority**: O catálogo de músicas é compartilhado. Apenas quem tem permissão deve poder modificá-lo.

**Independent Test**: Logar com usuário sem permissão "musicas.write", verificar que "Nova Música" não aparece na listagem e que na página de detalhes não aparecem "Excluir", "Nova Versão", ícones de editar/excluir versões, nem controles de adicionar/remover categorias e funções.

**Acceptance Scenarios**:

1. **Given** um usuário sem permissão "musicas.write", **When** acessa /musicas, **Then** não vê o botão "Nova Música".
2. **Given** um usuário sem permissão "musicas.write", **When** acessa /musicas/:id, **Then** vê os detalhes da música (nome, versões, categorias, funções) em modo somente-leitura — sem botões de excluir, editar nome, nova versão, editar/remover versões, adicionar/remover categorias ou funções.
3. **Given** um usuário com permissão "musicas.write", **When** acessa /musicas/:id, **Then** vê todas as ações CRUD.

---

### User Story 6 — Componente utilitário de verificação de permissão (Priority: P2)

Como desenvolvedor do frontend, preciso de um mecanismo reutilizável (hook e/ou componente wrapper) para verificar permissões e condicionalmente renderizar elementos da interface, evitando lógica duplicada em cada página.

**Why this priority**: Sem um mecanismo centralizado, cada página reimplementaria a verificação, violando DRY e dificultando manutenção.

**Independent Test**: Usar o hook/componente em uma página e verificar que ele corretamente oculta/exibe elementos baseado nas permissões do usuário logado.

**Acceptance Scenarios**:

1. **Given** um componente wrapper que recebe a permissão requerida, **When** o usuário possui a permissão, **Then** o conteúdo filho é renderizado.
2. **Given** um componente wrapper que recebe a permissão requerida, **When** o usuário NÃO possui a permissão, **Then** o conteúdo filho NÃO é renderizado (nenhum elemento no DOM).
3. **Given** o hook de verificação de permissão, **When** chamado por um componente, **Then** retorna `true` se o usuário tem a permissão e `false` caso contrário.
4. **Given** um usuário admin, **When** qualquer verificação de permissão é feita, **Then** sempre retorna `true` (admin bypassa todas as verificações).

---

### Edge Cases

- **Usuário perde permissão durante sessão ativa**: O frontend deve atualizar as permissões quando o token é renovado (refresh). Se a API retornar 403, o frontend exibe um toast "Permissão negada" e mantém o usuário na página atual, sem redirecionamento ou quebra de UI.
- **Latência no carregamento das permissões**: Enquanto as permissões estão sendo carregadas (estado de loading), os botões de ação NÃO devem ser exibidos (fail-closed). Exibir e depois esconder causaria flicker visual.
- **Novo recurso de domínio adicionado no futuro**: O padrão de permissões deve seguir a convenção `<recurso>.write` para facilitar extensão.
- **Usuário com role mas sem permissão específica**: Um usuário pode ter uma role atribuída que não concede determinada permissão. O sistema deve verificar permissões efetivas (diretas + via roles), não apenas a existência de uma role.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar no contexto de autenticação do frontend a lista completa de permissões efetivas do usuário (permissões diretas + permissões herdadas via roles).
- **FR-002**: O sistema DEVE fornecer um hook de verificação de permissão que verifica se o usuário logado possui uma permissão específica, retornando boolean.
- **FR-003**: O sistema DEVE fornecer um componente declarativo wrapper que renderiza condicionalmente seus filhos baseado em permissões.
- **FR-004**: O admin (`admin_full_access`) DEVE ter bypass automático — todas as verificações de permissão retornam `true` para admin.
- **FR-005**: Enquanto as permissões estão em estado de carregamento, botões de ação DEVEM permanecer ocultos (fail-closed, sem flicker).
- **FR-006**: Na página de Configurações, os controles CRUD (input de criação, ícones de editar e excluir) DEVEM ser ocultos para usuários sem permissão "configuracoes.write".
- **FR-007**: Na página de Integrantes, o botão "Novo Integrante" e os botões de editar/excluir de outros membros DEVEM ser ocultos para usuários sem permissão "integrantes.write".
- **FR-008**: Na página de Integrantes, o botão "Editar" no card do próprio usuário DEVE ser sempre visível (auto-edição).
- **FR-009**: Na página de Escalas (listagem e detalhe), todos os controles de escrita DEVEM ser ocultos para usuários sem permissão "escalas.write".
- **FR-010**: Na página de Músicas (listagem e detalhe), todos os controles de escrita DEVEM ser ocultos para usuários sem permissão "musicas.write".
- **FR-011**: O backend DEVE definir permissões granulares por domínio seguindo a convenção `<recurso>.write` (ex: "configuracoes.write", "integrantes.write", "escalas.write", "musicas.write").
- **FR-012**: O endpoint de perfil/sessão do backend DEVE retornar as permissões efetivas do usuário para que o frontend as consuma.
- **FR-013**: A proteção de visibilidade no frontend é **complementar** à proteção do backend. O backend DEVE migrar de `ensureHasRole` para verificações granulares `can(['<recurso>.write'])` nos endpoints de escrita de domínio, garantindo proteção real end-to-end. O backend continua sendo a autoridade final.
- **FR-014**: As 4 permissões de domínio (`configuracoes.write`, `integrantes.write`, `escalas.write`, `musicas.write`) DEVEM ser criadas via seed script idempotente, seguindo o padrão existente de `admin_full_access`.
- **FR-015**: A permissão `configuracoes.write` é única e cobre todos os 5 sub-recursos de Configurações (Artistas, Categorias, Funções, Tonalidades, Tipos de Eventos).
- **FR-016**: O botão "Contatar" na página de Integrantes DEVE permanecer visível para todos os usuários autenticados, sem restrição de permissão.
- **FR-017**: Quando o backend retornar 403 em uma ação, o frontend DEVE exibir um toast de "Permissão negada" e manter o usuário na página atual, sem redirecionamento.

### Key Entities

- **Permission**: Representa uma capacidade específica no sistema (ex: "musicas.write"). Possui nome único e descrição.
- **Role**: Agrupamento de permissões (ex: "lider_louvor" contém "musicas.write", "escalas.write"). Um usuário pode ter múltiplas roles.
- **User Permissions (efetivas)**: A união de permissões diretas do usuário + permissões herdadas de todas as suas roles. É o que o frontend usa para decisões de visibilidade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhum botão de criação, edição ou exclusão é visível para um usuário sem a permissão correspondente, em 100% das páginas de domínio.
- **SC-002**: Um usuário admin vê todas as ações CRUD em todas as páginas, sem exceção.
- **SC-003**: Na página de Integrantes, o botão "Editar" do próprio card é sempre visível, independente das permissões do usuário.
- **SC-004**: A interface não apresenta flicker (botões aparecendo e sumindo) durante o carregamento das permissões.
- **SC-005**: Adicionar controle de visibilidade a uma nova página de domínio requer no máximo o uso do hook/componente de permissão sem criar nova lógica — reutilização do mecanismo existente.
- **SC-006**: A proteção do backend (middlewares de autorização) continua funcionando independentemente do frontend — um request direto à API sem permissão retorna 403.

## Assumptions

- As permissões granulares ("configuracoes.write", "integrantes.write", "escalas.write", "musicas.write") serão criadas via seed script idempotente no bootstrap do backend.
- O endpoint de perfil/sessão do backend já retorna roles com permissões aninhadas e permissões diretas (`GET /api/profile`). Nenhuma extensão é necessária — o frontend computa as permissões efetivas a partir dos dados existentes.
- O middleware `ensureHasRole` nos endpoints de escrita de domínio será **substituído** por `can(['<recurso>.write'])` para garantir proteção granular end-to-end alinhada com o frontend.
- A convenção `<recurso>.write` é suficiente por ora. Se no futuro for necessário separar "create" de "update" de "delete", a estrutura suporta extensão sem breaking changes.
- Páginas administrativas (`/admin/*`) já estão protegidas por `AdminRoute` e não são escopo desta feature.
- O botão "Contatar" em Integrantes é uma ação de leitura/comunicação e permanece visível para todos os autenticados.
