# Feature Specification: Histórico com Dados Reais

**Feature Branch**: `010-live-historico`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "No frontend a página de Histórico em /historico atualmente tem dados hardcoded, quero transformar em históricos vivos com dados reais do sistema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar escalas passadas com dados reais (Priority: P1)

O usuário acessa a página de Histórico (`/historico`) e vê a lista de escalas (eventos) que já aconteceram, obtidas em tempo real a partir da base de dados. Cada item exibe: nome do tipo de evento (ex.: "Culto de Celebração"), data formatada, quantidade de músicas vinculadas, quantidade de integrantes na equipe, e a descrição do evento.

**Why this priority**: Este é o valor central da feature — substituir dados fictícios por dados reais. Sem isso, a página não tem utilidade prática.

**Independent Test**: Pode ser testado criando eventos com datas passadas na página de Escalas, abrindo `/historico` e verificando que os eventos aparecem com os dados corretos.

**Acceptance Scenarios**:

1. **Given** existem eventos cadastrados com datas anteriores à data atual, **When** o usuário acessa `/historico`, **Then** os eventos passados são exibidos em ordem cronológica decrescente (mais recentes primeiro), mostrando tipo do evento, data, contagem de músicas e contagem de integrantes.
2. **Given** não existem eventos cadastrados com datas anteriores à data atual, **When** o usuário acessa `/historico`, **Then** o sistema exibe uma mensagem amigável indicando que não há histórico disponível (empty state).
3. **Given** a requisição ao servidor falha, **When** o usuário acessa `/historico`, **Then** o sistema exibe uma mensagem de erro com opção de tentar novamente.

---

### User Story 2 - Ver detalhes de uma escala passada (Priority: P2)

O usuário clica em "Ver Detalhes" em uma escala do histórico e visualiza as informações completas: lista de músicas (com tonalidade), lista de integrantes (com suas funções) e demais dados do evento.

**Why this priority**: Complementa a listagem com informações detalhadas. O botão "Ver Detalhes" já existe no layout atual mas não tem funcionalidade.

**Independent Test**: Pode ser testado clicando em "Ver Detalhes" de um evento listado no histórico e verificando que as músicas e integrantes corretos são exibidos.

**Acceptance Scenarios**:

1. **Given** o usuário está na página de Histórico e há escalas listadas, **When** clica em "Ver Detalhes" de uma escala, **Then** é exibido um painel ou página com a lista completa de músicas e integrantes daquele evento.
2. **Given** o evento detalhado não possui músicas ou integrantes vinculados, **When** o usuário visualiza os detalhes, **Then** o sistema indica que não há músicas ou integrantes para este evento.

---

### User Story 3 - Feedback visual de carregamento (Priority: P3)

Enquanto os dados do histórico são carregados do servidor, o usuário vê indicadores visuais de carregamento (skeletons ou spinners) que informam que a página está processando a requisição.

**Why this priority**: Melhora a experiência do usuário ao fornecer feedback visual durante o carregamento, seguindo o padrão já usado em outras páginas do sistema (ex.: Escalas, Músicas).

**Independent Test**: Pode ser testado simulando latência na requisição e verificando que os indicadores de carregamento aparecem antes dos dados.

**Acceptance Scenarios**:

1. **Given** o usuário acessa `/historico` e os dados estão sendo carregados, **When** a requisição está em andamento, **Then** são exibidos placeholders visuais (skeletons) no lugar dos cards de eventos.

---

### Edge Cases

- O que acontece quando existem eventos futuros e passados misturados? A página deve filtrar e exibir apenas eventos com data anterior ou igual à data atual.
- O que acontece se um evento não possui tipo de evento vinculado (tipoEvento nulo)? A interface deve tratar esse caso com um rótulo padrão (ex.: "Evento").
- O que acontece com eventos que têm 0 músicas e 0 integrantes? Os contadores devem exibir "0" normalmente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página de Histórico DEVE buscar os dados de eventos a partir do sistema, filtrando e exibindo apenas eventos com data anterior ou igual à data atual.
- **FR-002**: A lista de eventos DEVE ser exibida em ordem cronológica decrescente (mais recentes primeiro).
- **FR-003**: Cada item da lista DEVE exibir: nome do tipo de evento, data formatada em português (dia da semana, dia, mês e ano), quantidade de músicas vinculadas e quantidade de integrantes.
- **FR-004**: O botão "Ver Detalhes" DEVE permitir ao usuário consultar as informações completas de um evento, incluindo lista de músicas e lista de integrantes com suas funções.
- **FR-005**: A página DEVE exibir um estado vazio (empty state) quando não existirem eventos passados.
- **FR-006**: A página DEVE exibir uma mensagem de erro quando a requisição falhar, com opção de recarregar.
- **FR-007**: A página DEVE exibir indicadores de carregamento (skeletons) enquanto aguarda a resposta da API.
- **FR-008**: A descrição do evento (campo `descricao`) DEVE ser exibida no lugar do antigo rótulo "Ministro", refletindo os dados reais disponíveis no modelo de dados.

### Key Entities

- **Evento (Escala)**: Representa um culto/evento musical realizado. Possui data, tipo de evento, descrição, e associações com músicas e integrantes.
- **Tipo de Evento**: Categorização do evento (ex.: "Culto de Celebração", "Culto de Domingo"). Cada evento possui um tipo.
- **Música**: Canção vinculada ao evento via tabela de associação. Possui nome e tonalidade.
- **Integrante**: Membro da equipe vinculado ao evento via tabela de associação. Possui nome e funções.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao acessar `/historico`, os dados exibidos correspondem exatamente aos eventos cadastrados no sistema com data passada.
- **SC-002**: O tempo entre o acesso à página e a exibição dos dados (ou estado vazio) é percebido pelo usuário como instantâneo em condições normais de rede.
- **SC-003**: 100% dos campos exibidos (tipo de evento, data, contagem de músicas, contagem de integrantes, descrição) são derivados de dados reais, sem nenhum valor hardcoded.
- **SC-004**: O botão "Ver Detalhes" de cada evento exibe as informações completas da escala (músicas e integrantes).

## Assumptions

- O endpoint `GET /api/eventos` já retorna todos os eventos (passados e futuros). A filtragem de eventos passados será feita no frontend com base na data atual.
- O modelo de dados existente não possui um campo "ministro" dedicado. O campo `descricao` do evento será utilizado para exibir informações complementares (em substituição ao rótulo "Ministro" hardcoded).
- Os hooks de React Query para eventos (`useEventos`, `useEvento`) já existem e serão reutilizados.
- O layout visual atual (cards com ícone de calendário, contadores de músicas e equipe, badge e botão) será mantido — apenas as fontes de dados serão substituídas.
