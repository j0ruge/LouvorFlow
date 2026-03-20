# Feature Specification: Frontend Auth & RBAC

**Feature Branch**: `017-frontend-auth-rbac`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Implementar no frontend a parte de login e RBAC que fora implementado no backend baseado na spec 013-portable-auth-rbac"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login e Acesso Autenticado (Priority: P1)

Um usuário do LouvorFlow acessa a aplicação e é apresentado a uma tela de login. Ele informa e-mail e senha, e ao autenticar-se com sucesso, é redirecionado ao Dashboard com acesso a todas as funcionalidades para as quais possui permissão. O token de acesso é armazenado de forma segura e enviado automaticamente em todas as requisições à API. Se o token expirar, o sistema tenta renová-lo silenciosamente via refresh token, sem interromper a experiência do usuário.

**Why this priority**: Sem autenticação, nenhuma outra funcionalidade é acessível. É o pré-requisito de todas as demais histórias.

**Independent Test**: Pode ser testado acessando a aplicação, fazendo login com credenciais válidas, navegando entre páginas e verificando que as requisições à API incluem o token de autorização.

**Acceptance Scenarios**:

1. **Given** o usuário não está autenticado, **When** acessa qualquer página da aplicação, **Then** é redirecionado para a tela de login.
2. **Given** o usuário está na tela de login, **When** informa e-mail e senha válidos e submete o formulário, **Then** é redirecionado ao Dashboard e vê seu nome na interface.
3. **Given** o usuário está na tela de login, **When** informa credenciais inválidas, **Then** vê uma mensagem de erro genérica ("E-mail ou senha incorretos") sem revelar qual campo está errado.
4. **Given** o usuário está autenticado e o access token expira, **When** faz uma requisição à API, **Then** o sistema renova o token via refresh token automaticamente e a requisição é retransmitida com sucesso.
5. **Given** o refresh token também expirou ou foi revogado, **When** o sistema tenta renovar, **Then** o usuário é deslogado e redirecionado à tela de login com mensagem informativa.

---

### User Story 2 - Logout e Gerenciamento de Sessão (Priority: P1)

O usuário autenticado pode encerrar sua sessão a qualquer momento através de um botão de logout acessível no menu do usuário. Ao fazer logout, todos os tokens são revogados no backend e os dados locais são limpos.

**Why this priority**: Logout é complementar ao login e essencial para segurança — sem ele, o usuário não tem como encerrar sua sessão em dispositivos compartilhados.

**Independent Test**: Após fazer login, clicar em "Sair", verificar que o usuário é redirecionado ao login e que requisições subsequentes são rejeitadas.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado, **When** clica no avatar no header e seleciona "Sair" no dropdown, **Then** a sessão é encerrada no backend, tokens locais são removidos e o usuário é redirecionado à tela de login.
2. **Given** o usuário fez logout, **When** tenta acessar uma página protegida via URL direta, **Then** é redirecionado à tela de login.

---

### User Story 3 - Proteção de Rotas por Permissões (Priority: P1)

Todas as páginas de domínio (Dashboard, Músicas, Escalas, Integrantes, Configurações, Relatórios, Histórico) são acessíveis a qualquer usuário autenticado. A seção "Administração" no sidebar (Usuários, Roles, Permissões) é visível apenas para usuários com role "admin". Se um usuário não-admin tenta acessar diretamente uma rota administrativa, vê uma página de acesso negado.

**Why this priority**: RBAC no frontend garante que o usuário só veja e acesse funcionalidades autorizadas, proporcionando uma experiência limpa e segura.

**Independent Test**: Login com dois usuários de roles diferentes (admin e não-admin) e verificar que o admin vê a seção "Administração" e o não-admin não vê.

**Acceptance Scenarios**:

1. **Given** o usuário autenticado (qualquer role), **When** acessa o menu lateral, **Then** vê todos os itens de domínio (Dashboard, Músicas, Escalas, Integrantes, Configurações, Relatórios, Histórico).
2. **Given** o usuário autenticado possui permissão administrativa, **When** acessa o menu lateral, **Then** vê a seção de administração (Usuários, Roles, Permissões) além dos itens de domínio.
3. **Given** o usuário autenticado NÃO possui permissão administrativa, **When** acessa o menu lateral, **Then** NÃO vê a seção de administração.
4. **Given** o usuário autenticado NÃO possui permissão administrativa, **When** acessa a URL de uma página admin diretamente, **Then** vê uma página de "Acesso Negado" (403).

---

### User Story 4 - Perfil do Usuário (Priority: P2)

O usuário autenticado pode visualizar e editar seu perfil (nome, e-mail e avatar). As alterações são salvas via API e refletidas imediatamente na interface (nome no header/sidebar).

**Why this priority**: Permite personalização básica da conta, mas não bloqueia o uso do sistema.

**Independent Test**: Fazer login, navegar ao perfil, alterar o nome, salvar e verificar que o novo nome aparece no sidebar.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado, **When** clica no avatar no header e seleciona "Meu Perfil" no dropdown, **Then** vê seus dados atuais (nome, e-mail, avatar).
2. **Given** o usuário está na página de perfil, **When** altera o nome e salva, **Then** o nome atualizado aparece no sidebar e na API de perfil.
3. **Given** o usuário tenta salvar um e-mail inválido, **When** submete o formulário, **Then** vê uma mensagem de erro de validação.

---

### User Story 5 - Recuperação de Senha (Priority: P2)

Um usuário que esqueceu sua senha pode solicitar um link de recuperação informando seu e-mail. Após receber o e-mail, acessa o link e define uma nova senha.

**Why this priority**: Importante para autonomia do usuário, mas pode ser contornada temporariamente por reset administrativo.

**Independent Test**: Na tela de login, clicar em "Esqueci minha senha", informar e-mail, verificar envio e redefinir a senha com sucesso.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de login, **When** clica em "Esqueci minha senha", **Then** é direcionado a um formulário para informar o e-mail.
2. **Given** o usuário informou um e-mail cadastrado, **When** submete o formulário de recuperação, **Then** vê uma mensagem de sucesso genérica (sem confirmar se o e-mail existe no sistema).
3. **Given** o usuário recebeu o link de recuperação, **When** acessa o link e informa a nova senha (mínimo 6 caracteres), **Then** a senha é redefinida e ele é redirecionado ao login.
4. **Given** o token de recuperação expirou (mais de 2 horas), **When** o usuário tenta usá-lo, **Then** vê mensagem informando que o link expirou e deve solicitar novamente.

---

### User Story 6 - Gerenciamento de Usuários (Priority: P3)

Um administrador pode visualizar a lista de usuários do sistema, criar novos usuários e atribuir roles e permissões a cada um deles.

**Why this priority**: Funcionalidade administrativa — necessária para operação completa do RBAC, mas pode ser feita inicialmente via seed/API.

**Independent Test**: Login como admin, acessar painel de usuários, criar um novo usuário com role específica, verificar que o novo usuário consegue logar com as permissões atribuídas.

**Acceptance Scenarios**:

1. **Given** o admin está autenticado, **When** acessa a seção "Administração" no sidebar e clica em "Usuários", **Then** vê a lista de todos os usuários com seus nomes, e-mails e roles.
2. **Given** o admin está na página de usuários, **When** clica em "Novo Usuário" e preenche nome, e-mail e senha, **Then** o usuário é criado e aparece na lista.
3. **Given** o admin está visualizando um usuário, **When** atribui roles e/ou permissões diretas, **Then** as alterações são salvas e refletidas no ACL do usuário.

---

### User Story 7 - Gerenciamento de Roles e Permissões (Priority: P3)

Um administrador pode visualizar, criar e configurar roles (papéis) e suas permissões associadas. Pode também visualizar a lista de permissões disponíveis no sistema.

**Why this priority**: Completa o ciclo administrativo do RBAC, mas roles e permissões podem ser criados via seed inicialmente.

**Independent Test**: Login como admin, criar uma nova role, associar permissões, atribuir a um usuário e verificar que o acesso funciona conforme esperado.

**Acceptance Scenarios**:

1. **Given** o admin está autenticado, **When** acessa "Roles" na seção "Administração" do sidebar, **Then** vê a lista de roles com descrições.
2. **Given** o admin está na página de roles, **When** cria uma nova role com nome e descrição, **Then** a role aparece na lista.
3. **Given** o admin está editando uma role, **When** associa ou remove permissões, **Then** as mudanças são refletidas na role e nos usuários que a possuem.
4. **Given** o admin acessa a lista de permissões, **When** a página carrega, **Then** vê todas as permissões disponíveis com nomes e descrições.

---

### Edge Cases

- O que acontece se o usuário tenta fazer login com um e-mail não cadastrado? Mensagem genérica sem revelar que o e-mail não existe.
- O que acontece se duas abas estão abertas e uma faz logout? A outra aba deve detectar a invalidação do token e redirecionar ao login na próxima requisição.
- O que acontece se o backend está indisponível durante o login? A tela de login deve exibir mensagem de erro amigável informando falha de comunicação (ex: "Não foi possível conectar ao servidor. Tente novamente.").
- O que acontece se o usuário admin tenta remover seu próprio role "admin"? O sistema deve impedir auto-remoção de privilégios administrativos.
- O que acontece se o token de refresh é renovado simultaneamente por duas requisições? O frontend deve serializar tentativas de refresh para evitar race conditions com token rotation.

## Clarifications

### Session 2026-03-14

- Q: Modelo de acesso para páginas existentes (Dashboard, Músicas, Escalas, Integrantes, Configurações, Relatórios, Histórico) — abertas a todos autenticados ou restritas por permissão? → A: Páginas existentes abertas a todos os usuários autenticados; apenas páginas administrativas (Usuários, Roles, Permissões) são restritas por permissão.
- Q: Onde as páginas administrativas (Usuários, Roles, Permissões) devem ficar na navegação? → A: Seção separada "Administração" no sidebar, abaixo das demais, visível apenas para admins.
- Q: Como o usuário acessa perfil e logout? → A: Avatar no header (canto superior direito) que abre dropdown estilo GitHub com "Meu Perfil", "Sair" e informações do usuário (nome, e-mail).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar uma tela de login com campos de e-mail e senha quando o usuário não estiver autenticado.
- **FR-002**: O sistema DEVE armazenar o access token e refresh token de forma segura no cliente após login bem-sucedido.
- **FR-003**: O sistema DEVE incluir o access token automaticamente no header `Authorization: Bearer <token>` de todas as requisições à API.
- **FR-004**: O sistema DEVE renovar o access token automaticamente usando o refresh token quando receber resposta 401, sem intervenção do usuário.
- **FR-005**: O sistema DEVE serializar requisições de refresh token para evitar race conditions com token rotation.
- **FR-006**: O sistema DEVE redirecionar o usuário para a tela de login quando o refresh token também for inválido/expirado.
- **FR-007**: O sistema DEVE fornecer funcionalidade de logout que revoga a sessão no backend e limpa tokens locais.
- **FR-008**: O sistema DEVE exibir todos os itens de domínio (Dashboard, Músicas, Escalas, Integrantes, Configurações, Relatórios, Histórico) no menu lateral para qualquer usuário autenticado, e restringir a seção de administração (Usuários, Roles, Permissões) apenas a usuários com permissão administrativa.
- **FR-009**: O sistema DEVE exibir uma página de "Acesso Negado" quando o usuário acessar uma rota administrativa para a qual não possui permissão.
- **FR-010**: O sistema DEVE permitir que o usuário visualize e edite seu perfil (nome, e-mail, avatar).
- **FR-011**: O sistema DEVE fornecer fluxo de "Esqueci minha senha" com envio de link de recuperação por e-mail.
- **FR-012**: O sistema DEVE fornecer página de redefinição de senha acessível via link com token.
- **FR-013**: O sistema DEVE fornecer painel administrativo para listar, criar e gerenciar usuários (apenas para admins).
- **FR-014**: O sistema DEVE fornecer interface para gerenciar roles e suas permissões associadas (apenas para admins).
- **FR-015**: O sistema DEVE validar formulários no cliente antes de enviar ao backend (e-mail válido, senha com mínimo 6 caracteres).
- **FR-016**: O sistema DEVE exibir o avatar do usuário autenticado no header (canto superior direito), que ao ser clicado abre um dropdown estilo GitHub contendo nome, e-mail, link para "Meu Perfil" e botão "Sair".
- **FR-017**: O sistema DEVE preservar a URL de destino original quando redirecionar ao login, retornando a ela após autenticação bem-sucedida.

### Key Entities

- **Sessão (Session)**: Representa a autenticação ativa do usuário — composta por access token (curta duração) e refresh token (longa duração). O access token é usado nas requisições e o refresh token para renovação silenciosa.
- **Usuário Autenticado (AuthUser)**: Dados do usuário logado incluindo id, nome, e-mail, avatar, roles e permissões. Serve como contexto global para decisões de autorização na interface.
- **Role (Papel)**: Agrupamento nomeado de permissões que pode ser atribuído a usuários. Exemplos: "admin", "líder", "músico".
- **Permission (Permissão)**: Capacidade específica do sistema (ex: "manage_members", "manage_songs"). Pode ser atribuída via role ou diretamente ao usuário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem fazer login completo (do formulário ao Dashboard) em menos de 5 segundos em condições normais de rede.
- **SC-002**: 100% das páginas protegidas redirecionam corretamente ao login quando acessadas sem autenticação.
- **SC-003**: A renovação silenciosa de tokens funciona sem que o usuário perceba interrupção — nenhuma requisição legítima falha por token expirado se o refresh token ainda for válido.
- **SC-004**: Usuários com permissões restritas veem apenas os itens de menu e acessam apenas as páginas para as quais possuem autorização.
- **SC-005**: O fluxo completo de recuperação de senha (solicitar → receber e-mail → redefinir) é concluído em menos de 3 minutos pelo usuário.
- **SC-006**: Administradores conseguem criar um novo usuário e atribuir roles em menos de 2 minutos.
- **SC-007**: Após logout, nenhum dado sensível (tokens, dados do usuário) permanece armazenado no cliente.

## Assumptions

- O backend de autenticação e RBAC está implementado conforme a spec 013-portable-auth-rbac, incluindo endpoints de sessions, users (create/acl), roles (create/permissions), permissions (create), profile e password. Três endpoints de listagem (GET /api/users, GET /api/roles, GET /api/permissions) ainda não existem e serão implementados como parte desta feature.
- O sistema de permissões segue o modelo aditivo: um usuário possui as permissões de suas roles + permissões atribuídas diretamente.
- O access token tem curta duração (configurado no backend) e o refresh token é de longa duração com rotation.
- A aplicação frontend é uma SPA que roda no navegador — tokens serão armazenados em memória (access token) e localStorage (refresh token).
- O sidebar e header existentes (AppLayout, AppSidebar) serão adaptados para incluir informações do usuário e controle de visibilidade baseado em permissões.
- Não há necessidade de autenticação via SSO ou OAuth externo neste momento — apenas e-mail/senha.
