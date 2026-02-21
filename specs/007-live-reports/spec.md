# Feature Specification: Relatórios com Dados Reais

**Feature Branch**: `007-live-reports`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "No frontend que está em src/frontend/src a página de relatórios em http://localhost:8080/relatorios atualmente tem dados hardcoded, quero transformar em relatórios vivos com dados reais do sistema."

## Clarifications

### Session 2026-02-18

- Q: Como os dados agregados dos relatórios devem ser obtidos — novo endpoint backend de agregação, frontend agregando de endpoints existentes, ou abordagem híbrida? → A: Novo endpoint backend de agregação — o servidor calcula e retorna os dados prontos (ex: `GET /api/relatorios/resumo`).
- Q: Eventos com data futura devem ser contabilizados nas estatísticas de relatórios? → A: Apenas eventos passados (data ≤ hoje) — relatório reflete atividade realizada, não planejada.
- Q: O que a página deve exibir quando a API de relatórios retorna erro? → A: Mensagem de erro genérica com botão "Tentar novamente".
- Q: Como desempatar músicas com a mesma frequência no ranking? → A: Ordem alfabética pelo nome da música.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visualizar estatísticas resumidas do ministério (Priority: P1)

Como líder de ministério, quero ver estatísticas resumidas reais (total de músicas cadastradas, total de cultos realizados, média de músicas por culto) para acompanhar o nível de atividade do ministério.

**Why this priority**: As estatísticas resumidas são o indicador principal de saúde do ministério e a funcionalidade mais visualizada da página. Sem elas, a página não tem valor.

**Independent Test**: Pode ser testado adicionando eventos e músicas ao sistema e verificando se os cards de resumo exibem valores calculados a partir dos dados reais.

**Acceptance Scenarios**:

1. **Given** existem 50 músicas cadastradas no sistema, **When** o usuário acessa /relatorios, **Then** o card "Total de Músicas" exibe "50"
2. **Given** existem 20 eventos cadastrados, **When** o usuário acessa /relatorios, **Then** o card "Cultos Realizados" exibe "20"
3. **Given** existem 20 eventos com 100 associações evento-música ao total, **When** o usuário acessa /relatorios, **Then** o card "Média por Culto" exibe "5.0"
4. **Given** não existem músicas nem eventos cadastrados, **When** o usuário acessa /relatorios, **Then** os cards exibem "0" com uma mensagem indicando ausência de dados

---

### User Story 2 — Visualizar ranking de músicas mais tocadas (Priority: P2)

Como líder de louvor, quero ver quais músicas são tocadas com mais frequência nos cultos para planejar diversidade no repertório e evitar repetição excessiva.

**Why this priority**: O ranking de músicas é a informação mais acionável — permite decisões diretas sobre repertório. Depende da existência de eventos e músicas (P1 garante que há dados).

**Independent Test**: Pode ser testado associando músicas a eventos múltiplas vezes e verificando se o ranking ordena corretamente por frequência.

**Acceptance Scenarios**:

1. **Given** a música "Way Maker" está associada a 10 eventos e "Oceans" a 7 eventos, **When** o usuário acessa /relatorios, **Then** "Way Maker" aparece acima de "Oceans" no ranking com "10 vezes" e "7 vezes" respectivamente
2. **Given** existem mais de 5 músicas com associações, **When** o ranking é exibido, **Then** apenas as 5 mais tocadas são mostradas
3. **Given** nenhuma música está associada a nenhum evento, **When** o usuário acessa /relatorios, **Then** a seção exibe uma mensagem de estado vazio indicando que não há dados de músicas tocadas

---

### User Story 3 — Visualizar atividade mensal (Priority: P3)

Como coordenador do ministério, quero ver a atividade mensal (número de cultos e músicas tocadas por mês) para acompanhar tendências ao longo do tempo.

**Why this priority**: A visão mensal é importante para análise de tendências, mas é menos acionável imediatamente que os dados das stories P1 e P2.

**Independent Test**: Pode ser testado criando eventos em meses diferentes com músicas associadas e verificando se os dados mensais são calculados corretamente.

**Acceptance Scenarios**:

1. **Given** existem 8 eventos em janeiro/2026 com 48 associações evento-música, **When** o usuário acessa /relatorios, **Then** a linha de janeiro mostra "8 cultos" e "48 músicas"
2. **Given** existem dados dos últimos 6 meses, **When** a atividade mensal é exibida, **Then** os meses são listados em ordem cronológica ascendente (mais antigo primeiro)
3. **Given** não existem eventos em nenhum mês recente, **When** o usuário acessa /relatorios, **Then** a seção exibe uma mensagem de estado vazio

### Edge Cases

- O que acontece quando o sistema não tem nenhum dado (banco vazio)? → Exibir estados vazios claros em cada seção
- O que acontece quando existem eventos mas sem músicas associadas? → "Cultos Realizados" mostra valor > 0, "Total de Músicas" e ranking ficam zerados/vazios
- O que acontece quando há apenas 1 mês de dados? → Atividade mensal mostra apenas esse mês
- O que acontece quando há menos de 5 músicas com associações? → Ranking mostra apenas as que existem
- O que acontece se a média por culto for um número com muitas casas decimais? → Arredondar para 1 casa decimal
- O que acontece quando existem eventos com data futura (agendados)? → São excluídos de todas as métricas; relatório reflete apenas atividade realizada
- O que acontece quando a API está indisponível ou retorna erro? → Exibir mensagem de erro genérica com botão "Tentar novamente" para recarregar os dados sem recarregar a página
- O que acontece quando duas músicas têm a mesma contagem de vezes tocadas? → Desempate por ordem alfabética do nome da música

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir o total real de músicas cadastradas no sistema
- **FR-002**: O sistema DEVE exibir o total real de eventos/cultos registrados
- **FR-003**: O sistema DEVE calcular e exibir a média de músicas por evento (arredondada a 1 casa decimal)
- **FR-004**: O sistema DEVE exibir um ranking das 5 músicas mais frequentemente associadas a eventos, ordenado por frequência decrescente e, em caso de empate, por ordem alfabética do nome da música
- **FR-005**: O sistema DEVE exibir o nome da música e a contagem de vezes que foi tocada no ranking
- **FR-006**: O sistema DEVE exibir a atividade mensal mostrando quantidade de eventos e de músicas tocadas por mês, para os últimos 6 meses
- **FR-007**: O sistema DEVE ordenar a atividade mensal cronologicamente em ordem ascendente (mais antigo primeiro)
- **FR-008**: O sistema DEVE exibir estados vazios claros e informativos quando não houver dados disponíveis em qualquer seção
- **FR-009**: O sistema DEVE carregar e exibir os dados automaticamente ao acessar a página (sem necessidade de ação manual)
- **FR-010**: O sistema DEVE exibir indicadores de carregamento enquanto os dados são buscados
- **FR-011**: O sistema DEVE exibir uma mensagem de erro genérica com botão "Tentar novamente" quando a chamada à API falhar (erro de rede, servidor indisponível, erro 500)

### Key Entities

- **Resumo de Relatório**: Estatísticas agregadas — total de músicas, total de eventos, média de músicas por evento
- **Ranking de Músicas**: Nome da música com contagem de aparições em eventos, ordenado por frequência
- **Atividade Mensal**: Identificador do mês (ex: "Jan"), quantidade de eventos no mês, quantidade de músicas tocadas no mês

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos dados exibidos na página de relatórios refletem dados reais do sistema, sem nenhum valor hardcoded
- **SC-002**: A página de relatórios carrega e exibe os dados em até 3 segundos
- **SC-003**: Quando novos eventos ou músicas são adicionados, os relatórios refletem as atualizações na próxima visita à página
- **SC-004**: Todas as seções exibem feedback visual claro quando não há dados disponíveis (estados vazios)
- **SC-005**: 100% das métricas calculadas (média, contagens, ranking) são matematicamente corretas quando verificadas contra os dados do banco

## Assumptions

- O período de atividade mensal padrão será os últimos 6 meses (baseado no layout atual)
- O ranking exibirá no máximo 5 músicas (mantendo o layout visual atual)
- "Cultos Realizados" contabiliza todos os eventos com data ≤ hoje (eventos passados), não apenas os últimos 6 meses. Eventos futuros são excluídos de todas as métricas
- O card "Total de Músicas" mostra o total geral de músicas cadastradas (não apenas as tocadas)
- A contagem de "vezes tocadas" de uma música é derivada da quantidade de associações na tabela `Eventos_Musicas`
- Os dados agregados serão fornecidos por endpoint(s) dedicado(s) no backend, com lógica de agregação no servidor (não no cliente)
