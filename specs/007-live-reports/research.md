# Research: Relatórios com Dados Reais

**Branch**: `007-live-reports` | **Date**: 2026-02-18

## R-001: Estratégia de Agregação — Endpoint Backend Dedicado

**Decision**: Criar um endpoint dedicado `GET /api/relatorios/resumo` no backend que retorna todos os dados agregados em uma única resposta JSON. O servidor executa queries Prisma otimizadas e retorna os dados já calculados.

**Rationale**: A fase anterior (006) declarou explicitamente que "Página de Relatórios com dados reais (requer endpoints de agregação não existentes)" como fora de escopo. A agregação no servidor é mais eficiente (uma query SQL vs. múltiplas chamadas HTTP), mantém a lógica de negócio no backend conforme a arquitetura em camadas, e segue o princípio III da constituição (API como fonte única de verdade).

**Alternatives considered**:
- Frontend agregando a partir de endpoints de listagem: rejeitado por exigir múltiplas chamadas HTTP, transferir dados desnecessários ao cliente, e colocar lógica de negócio (cálculo de média, ranking) no frontend.
- Abordagem híbrida (contagens no backend, ranking no frontend): rejeitado por fragmentar a responsabilidade sem benefício claro.

---

## R-002: Filtragem Temporal — Apenas Eventos Passados

**Decision**: Todas as métricas de relatórios consideram apenas eventos com `data ≤ hoje`. Eventos futuros (agendados) são excluídos de contagens, médias, ranking e atividade mensal.

**Rationale**: Relatórios representam atividade realizada, não planejada. Incluir eventos futuros distorceria métricas como "Cultos Realizados" (que não foram realizados) e "Média por Culto" (que incluiria cultos sem músicas realmente tocadas). Conforme clarificação na spec: "relatório reflete atividade realizada, não planejada."

**Alternatives considered**:
- Incluir todos os eventos: rejeitado por distorcer métricas de atividade realizada.
- Eventos passados para métricas, todos para atividade mensal: rejeitado por inconsistência lógica.

---

## R-003: Desempate de Ranking — Ordem Alfabética

**Decision**: Quando duas ou mais músicas têm a mesma contagem de aparições em eventos, o desempate é por ordem alfabética ascendente do nome da música.

**Rationale**: Ordem alfabética é determinística, previsível para o usuário, e facilmente testável nos critérios de aceitação. Qualquer outro critério (data de criação, ID) seria opaco para o usuário.

**Alternatives considered**:
- Sem desempate (ordem arbitrária): rejeitado por ser não-determinístico e dificultar testes.
- Desempate por data de criação: opaco para o usuário — não há como prever a ordem.

---

## R-004: Resposta Única vs. Múltiplos Endpoints

**Decision**: Um único endpoint `GET /api/relatorios/resumo` retorna todo o payload de relatórios (estatísticas resumidas + ranking de músicas + atividade mensal) em uma resposta.

**Rationale**: A página de relatórios exibe todas as seções simultaneamente. Uma única chamada HTTP reduz latência (1 round-trip vs. 3), simplifica o código frontend (1 hook, 1 query key), e facilita o gerenciamento de loading/error states. O payload é pequeno (< 5 KB estimado) e não justifica fragmentação.

**Alternatives considered**:
- Três endpoints separados (`/resumo`, `/ranking`, `/atividade-mensal`): rejeitado por adicionar complexidade sem benefício. A página sempre precisa dos três dados juntos. Três chamadas paralelas adicionam latência de rede e complexidade de gerenciamento de estados independentes.

---

## R-005: Queries Prisma para Agregação

**Decision**: Usar Prisma queries nativas (`count`, `groupBy`, `findMany` com `_count`) para agregação. Evitar raw SQL exceto se Prisma não suportar a query necessária.

**Rationale**: O projeto usa Prisma como ORM exclusivo (constituição: "Database schema changes MUST be managed exclusively through Prisma migrations"). Usar queries Prisma mantém type-safety, consistência com o restante do codebase, e facilita manutenção. O Prisma 6 suporta `groupBy` e `_count` que atendem as necessidades de agregação.

**Alternatives considered**:
- Raw SQL via `prisma.$queryRaw`: evitado por perder type-safety e ser inconsistente com o padrão do projeto. Reservado apenas se Prisma não suportar a query.
- Views PostgreSQL: desnecessário para o volume e complexidade das queries.

---

## R-006: Tratamento de Erro na Página

**Decision**: Quando a API retorna erro, a página exibe o componente `ErrorState` existente com mensagem genérica e botão "Tentar novamente" que chama `refetch()` do React Query.

**Rationale**: O `ErrorState` já existe no projeto e segue o padrão visual do shadcn/ui. O React Query já possui retry automático (1 tentativa configurada globalmente). O botão "Tentar novamente" dá controle adicional ao usuário. Conforme clarificação na spec.

**Alternatives considered**:
- Exibir estados vazios no erro: rejeitado por ser enganoso — o usuário pensaria que não há dados quando na verdade houve falha.
- Redirecionamento automático: rejeitado por ser intrusivo e tirar o controle do usuário.
