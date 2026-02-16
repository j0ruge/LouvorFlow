# Feature Specification: Integração Frontend-Backend (Fase 1)

**Feature Branch**: `005-frontend-backend-integration`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "Realizar o wiring (conexão) entre o frontend estático e o backend funcional, substituindo dados hardcoded por chamadas reais à API nos módulos de Integrantes, Músicas e Escalas."

## Clarifications

### Session 2026-02-16

- Q: O fluxo de criação de escalas é em etapa única (formulário completo) ou múltiplas etapas? → A: Duas etapas — criar evento (data, tipo, descrição) primeiro, depois associar músicas e integrantes na tela de detalhes do evento criado.
- Q: Qual a distinção entre "Escala" e "Evento"? → A: São conceitos distintos. "Evento" é a ocasião (culto, celebração, casamento). "Escala" é o agendamento de músicos e músicas para um evento. Na interface o usuário vê "Escalas" (foco no agendamento); no código/API a entidade base é "Evento".
- Q: Como tratar mensagens de erro do backend na interface? → A: Exibir a mensagem do campo `erro` da resposta do backend diretamente ao usuário. Para erros de rede ou erros 500 sem mensagem legível, usar uma mensagem padrão genérica do frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerenciar Integrantes com Dados Reais (Priority: P1)

Como administrador do sistema, quero visualizar a lista real de integrantes cadastrados e poder criar novos integrantes através da interface, para que eu possa gerenciar a equipe do ministério sem depender de dados fictícios.

**Why this priority**: Integrantes são a entidade central do sistema — escalas e músicas dependem de membros cadastrados. Sem integrantes reais, nenhum outro módulo funciona de forma completa. Além disso, o fluxo de criação de integrantes valida toda a cadeia de comunicação (interface → serviço → servidor → banco de dados).

**Independent Test**: Pode ser testado de forma independente acessando a página de Integrantes — a lista deve carregar dados do servidor e o formulário deve criar registros que persistem ao recarregar a página.

**Acceptance Scenarios**:

1. **Given** o servidor está em execução e existem integrantes cadastrados no banco, **When** o administrador acessa a página de Integrantes, **Then** o sistema exibe a lista de integrantes com nome, e-mail, telefone e funções carregados do servidor.
2. **Given** o administrador está na página de Integrantes, **When** ele preenche o formulário de novo integrante com dados válidos (nome, documento, e-mail, senha) e confirma, **Then** o sistema cria o integrante, exibe uma mensagem de sucesso e atualiza a lista automaticamente.
3. **Given** o administrador preenche o formulário com um e-mail já cadastrado, **When** ele confirma a criação, **Then** o sistema exibe uma mensagem de erro clara indicando o conflito, sem perder os dados preenchidos.
4. **Given** o servidor está fora do ar ou inalcançável, **When** o administrador acessa a página de Integrantes, **Then** o sistema exibe uma mensagem informativa de erro com opção de tentar novamente, sem apresentar tela em branco.

---

### User Story 2 - Gerenciar Catálogo de Músicas com Dados Reais (Priority: P2)

Como líder de ministério, quero navegar pelo catálogo real de músicas e cadastrar novas músicas com suas informações (tonalidade, versões, tags), para montar um repertório organizado e acessível.

**Why this priority**: O catálogo de músicas é a segunda dependência mais importante para montar escalas. A listagem paginada e o cadastro com relações (tonalidade, versões por artista, tags, funções requeridas) validam cenários de dados mais complexos.

**Independent Test**: Pode ser testado acessando a página de Músicas — a lista deve exibir músicas reais do servidor com tonalidade, tags e versões; o formulário deve criar músicas que aparecem na lista ao recarregar.

**Acceptance Scenarios**:

1. **Given** existem músicas cadastradas no banco, **When** o líder acessa a página de Músicas, **Then** o sistema exibe o catálogo com nome, tonalidade, artistas/versões e tags de cada música, carregados do servidor.
2. **Given** o líder está na página de Músicas com muitos registros, **When** a lista excede a quantidade padrão por página, **Then** o sistema exibe paginação funcional, carregando apenas os registros da página atual.
3. **Given** o líder está no formulário de nova música, **When** ele preenche nome e tonalidade e confirma, **Then** o sistema cria a música, exibe mensagem de sucesso e atualiza o catálogo.
4. **Given** uma requisição de listagem ou cadastro falha, **When** o sistema detecta o erro, **Then** exibe uma notificação de erro amigável ao usuário com orientação para tentar novamente.

---

### User Story 3 - Gerenciar Escalas de Serviço com Dados Reais (Priority: P3)

Como líder de ministério, quero criar e visualizar escalas de serviço conectadas a dados reais de integrantes e músicas, para organizar os cultos de forma prática e confiável.

**Why this priority**: Escalas são o módulo que integra integrantes e músicas em um contexto de evento. É a funcionalidade mais rica, pois combina dados de múltiplas entidades, mas depende de P1 e P2 estarem funcionais.

**Independent Test**: Pode ser testado acessando a página de Escalas — a lista de eventos deve vir do servidor, exibindo datas, tipos, membros escalados e músicas selecionadas; criar uma nova escala deve persistir no banco.

**Acceptance Scenarios**:

1. **Given** existem eventos cadastrados no banco com músicas e integrantes associados, **When** o líder acessa a página de Escalas, **Then** o sistema exibe a lista de escalas com data, tipo de evento, descrição, músicas e integrantes carregados do servidor.
2. **Given** o líder está no formulário de nova escala, **When** ele preenche data, tipo de evento e descrição e confirma, **Then** o sistema cria o evento, exibe mensagem de sucesso e redireciona para a tela de detalhes do evento, onde ele pode associar músicas e integrantes.
3. **Given** o líder está visualizando uma escala existente, **When** ele deseja ver os detalhes completos, **Then** o sistema exibe todas as músicas (com tonalidade) e integrantes (com suas funções) associados àquela escala.
4. **Given** o servidor retorna erro ao carregar ou salvar uma escala, **When** o sistema detecta a falha, **Then** exibe feedback visual de erro sem perder dados já preenchidos pelo usuário.

---

### User Story 4 - Experiência de Carregamento e Feedback Visual (Priority: P1)

Como qualquer usuário do sistema, quero ter indicação visual clara de que os dados estão sendo carregados e receber mensagens de sucesso ou erro após cada ação, para que eu entenda o que o sistema está fazendo a todo momento.

**Why this priority**: A experiência de carregamento e feedback afeta todas as funcionalidades. Sem ela, o sistema parece "travado" ou "quebrado" durante operações assíncronas, gerando desconfiança do usuário.

**Independent Test**: Pode ser testado em qualquer página — ao carregar dados deve aparecer indicador visual de progresso; ao criar/editar/excluir deve aparecer mensagem de confirmação ou erro.

**Acceptance Scenarios**:

1. **Given** o usuário acessa qualquer página que carrega dados do servidor, **When** os dados estão sendo buscados, **Then** o sistema exibe um indicador visual de carregamento (esqueleto ou spinner) no lugar dos dados.
2. **Given** o usuário realiza uma ação que envia dados ao servidor (criar, editar), **When** a ação é concluída com sucesso, **Then** o sistema exibe uma notificação de sucesso temporária.
3. **Given** o usuário realiza uma ação que falha no servidor, **When** o erro é retornado, **Then** o sistema exibe uma notificação de erro com mensagem compreensível (não técnica).
4. **Given** o usuário envia um formulário com dados inválidos, **When** a validação detecta o problema, **Then** o sistema exibe mensagens de validação nos campos específicos antes mesmo de enviar ao servidor.

---

### Edge Cases

- O que acontece quando o servidor demora mais de 10 segundos para responder? O sistema deve manter o indicador de carregamento visível e não exibir tela em branco.
- O que acontece quando a conexão de rede é perdida durante o envio de um formulário? O sistema deve exibir mensagem de erro de conectividade e preservar os dados preenchidos.
- O que acontece quando o usuário tenta criar um integrante com documento (CPF) já cadastrado? O sistema deve exibir mensagem de conflito clara.
- O que acontece quando o usuário tenta criar uma música sem tonalidade? O sistema deve bloquear o envio e indicar o campo obrigatório.
- O que acontece quando a lista de músicas está vazia (nenhum registro no banco)? O sistema deve exibir um estado vazio amigável com orientação para cadastrar a primeira música.
- O que acontece quando o usuário navega rapidamente entre páginas enquanto dados estão carregando? O sistema deve cancelar requisições anteriores e não exibir dados da página errada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE carregar a lista de integrantes do servidor ao acessar a página de Integrantes, exibindo nome, e-mail, telefone e funções de cada integrante.
- **FR-002**: O sistema DEVE permitir a criação de novos integrantes com os campos: nome, documento de identificação, e-mail, senha e telefone (opcional).
- **FR-003**: O sistema DEVE validar os campos do formulário de integrante antes do envio (campos obrigatórios, formato de e-mail) e exibir mensagens de erro por campo.
- **FR-004**: O sistema DEVE carregar o catálogo de músicas do servidor ao acessar a página de Músicas, exibindo nome, tonalidade, versões (artista, BPM), tags e funções requeridas.
- **FR-005**: O sistema DEVE suportar paginação na listagem de músicas, carregando dados sob demanda conforme o usuário navega entre páginas.
- **FR-006**: O sistema DEVE permitir a criação de novas músicas com os campos: nome e tonalidade (selecionada de uma lista pré-existente).
- **FR-007**: O sistema DEVE carregar a lista de escalas (eventos) do servidor ao acessar a página de Escalas, exibindo data, tipo de evento, descrição, músicas e integrantes associados.
- **FR-008**: O sistema DEVE permitir a criação de novos eventos em duas etapas: primeiro o formulário com data, tipo de evento (selecionado de uma lista pré-existente) e descrição; após a criação, a tela de detalhes do evento permite associar músicas e integrantes existentes.
- **FR-009**: O sistema DEVE exibir indicador visual de carregamento (esqueleto ou spinner) durante toda operação de busca de dados em qualquer página.
- **FR-010**: O sistema DEVE exibir notificações visuais de sucesso ao concluir operações de criação.
- **FR-011**: O sistema DEVE exibir notificações visuais de erro ao falhar em qualquer operação, utilizando a mensagem retornada pelo servidor (campo `erro`). Para erros de rede ou falhas sem mensagem legível (ex.: erro 500), o sistema deve exibir uma mensagem padrão genérica em português.
- **FR-012**: O sistema DEVE tratar erros de rede e de servidor sem apresentar tela em branco, oferecendo opção de tentar novamente.
- **FR-013**: O sistema DEVE preservar os dados preenchidos no formulário quando uma operação de envio falha, para que o usuário possa corrigir e reenviar.
- **FR-014**: O sistema DEVE exibir estado vazio amigável quando uma listagem não possui registros, orientando o usuário a criar o primeiro registro.
- **FR-015**: O sistema DEVE validar dados de entrada no lado do cliente antes de enviá-los ao servidor, garantindo conformidade com o contrato esperado.

### Key Entities

- **Integrante**: Membro do ministério de louvor. Possui nome, documento de identificação (único), e-mail (único), senha, telefone opcional e uma lista de funções/instrumentos que desempenha (ex.: vocal, guitarra, teclado).
- **Música**: Composição musical do repertório. Possui nome, tonalidade associada, e pode ter múltiplas versões de artistas diferentes (cada uma com BPM, cifras, letras e link), tags de classificação e funções instrumentais requeridas.
- **Evento**: A ocasião em si — um culto, celebração, casamento ou outro compromisso. Possui data, tipo de evento (culto de celebração, oração, etc.) e descrição.
- **Escala**: O agendamento de músicos e músicas para um evento específico. Representa a combinação de um evento com suas associações de integrantes escalados e músicas selecionadas. Na interface o usuário vê "Escalas" (foco no agendamento); no código/API a entidade base é "Evento".
- **Tonalidade**: Tom musical (Dó, Ré, Mi, etc.) usado como referência para as músicas.
- **Função**: Papel ou instrumento que um integrante pode desempenhar (vocal, guitarra, bateria, etc.).
- **Tipo de Evento**: Classificação do tipo de culto ou evento (celebração, oração, estudo, etc.).

## Assumptions

- O servidor backend já está funcional e documentado, com todos os endpoints CRUD implementados para os três módulos (Integrantes, Músicas e Eventos).
- Não há autenticação/autorização obrigatória nos endpoints nesta fase. Se o backend exigir autenticação, será necessário criar um mecanismo de desenvolvimento (token fixo) ou priorizar o fluxo de login.
- O servidor aceita requisições de origens diferentes (CORS habilitado) para permitir comunicação entre frontend e backend em portas diferentes durante o desenvolvimento.
- As entidades de suporte (Tonalidades, Funções, Tipos de Eventos) já possuem dados cadastrados no banco, necessários para popular listas de seleção nos formulários.
- A paginação é suportada apenas no módulo de Músicas; Integrantes e Eventos retornam listas completas.
- Nesta fase, o foco é listagem e criação. Edição e exclusão de registros podem ser contemplados se a estrutura existente já os suporte, mas não são obrigatórios.
- Nesta fase, a associação de músicas a eventos vincula a composição (Música), não uma versão específica do artista. O Princípio IV da constituição exige que o usuário selecione tanto a Música quanto a Versão ao montar repertório — isso requer alteração no endpoint `POST /eventos/:eventoId/musicas` do backend para aceitar `versao_id` além de `musicas_id`, e será endereçado em uma fase futura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma página dos módulos de Integrantes, Músicas ou Escalas contém dados estáticos ou fictícios — 100% dos dados exibidos vêm do servidor.
- **SC-002**: 100% das operações assíncronas (carregamento de listas, envio de formulários) exibem indicador visual de progresso durante a execução.
- **SC-003**: O sistema não apresenta tela em branco em nenhum cenário de erro (servidor indisponível, erro de rede, erro de validação, erro 500) — sempre exibe feedback visual ao usuário.
- **SC-004**: Usuários conseguem criar um novo integrante, uma nova música e uma nova escala através da interface em menos de 2 minutos cada operação.
- **SC-005**: Ao criar um registro com sucesso, a lista correspondente é atualizada automaticamente sem necessidade de recarregar a página manualmente.
- **SC-006**: Mensagens de erro de validação aparecem em menos de 1 segundo após o envio do formulário, sem necessidade de aguardar resposta do servidor para validações de campos obrigatórios e formato.
- **SC-007**: Após criação bem-sucedida, uma notificação visual de sucesso é exibida e desaparece automaticamente em até 5 segundos.
