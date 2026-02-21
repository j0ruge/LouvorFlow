# Tasks: Relatórios com Dados Reais

**Branch**: `007-live-reports` | **Date**: 2026-02-18
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Implementation Strategy

- **MVP**: US1 (Estatísticas Resumidas) — cards com total de músicas, cultos realizados e média por culto, conectados ao endpoint backend
- **Incremental Delivery**: Cada user story adiciona uma seção da página de relatórios; todas são independentemente testáveis
- **Parallel Opportunities**: Backend (repository, service, controller) pode ser construído em paralelo com frontend (schema, service, hook). Dentro do backend, tipos e repository são paralelizáveis.
- **Nota sobre testes**: Testes unitários com fake repository são incluídos conforme especificado na Fase E do plan.md

---

## Phase 1: Setup (Backend Types + Route Registration)

**Goal**: Definir as interfaces TypeScript no backend e registrar a rota `/api/relatorios` na aplicação Express.

- [x] T001 [P] Adicionar interfaces `MusicaRanking`, `AtividadeMensal` e `RelatorioResumo` ao arquivo `src/backend/src/types/index.ts` conforme definições em data-model.md
- [x] T002 [P] Criar arquivo de rotas `src/backend/src/routes/relatorios.routes.ts` com `GET /resumo` mapeado para o controller (placeholder — controller será criado em T006)
- [x] T003 Registrar rota `'/api/relatorios'` importando `relatoriosRoutes` em `src/backend/src/app.ts` seguindo o padrão das rotas existentes

---

## Phase 2: Foundational (Backend Repository + Service + Controller)

**Goal**: Implementar toda a camada backend de agregação — repository com queries Prisma, service com lógica de negócio, e controller HTTP. DEVE ser concluída antes do frontend.

**⚠️ CRITICAL**: O frontend depende do endpoint `GET /api/relatorios/resumo` estar funcional.

- [x] T004 Criar `src/backend/src/repositories/relatorios.repository.ts` com métodos: `countMusicas()` usando `prisma.musicas.count()`; `countEventosRealizados()` usando `prisma.eventos.count()` com filtro `data <= new Date()`; `countAssociacoesEventoMusica()` contando registros em `eventos_musicas` cujo evento tem `data <= new Date()`; `getTopMusicas(limit)` agrupando `eventos_musicas` por `musicas_id` (apenas eventos com data ≤ hoje), fazendo join com `musicas.nome`, ordenando por contagem DESC e nome ASC, limitando a `limit` resultados; `getAtividadeMensal(meses)` agrupando eventos com data ≤ hoje por ano/mês nos últimos N meses, contando eventos e associações `eventos_musicas` por mês, ordenado cronologicamente em ordem ascendente (mais antigo primeiro)
- [x] T005 Criar `src/backend/src/services/relatorios.service.ts` com método `getResumo()` que: chama os 5 métodos do repository, calcula `mediaPorEvento` como `countAssociacoes / countEventos` arredondado a 1 casa decimal (retorna 0 se `countEventos === 0`), formata `topMusicas` com campos `id`, `nome`, `vezes`, e retorna objeto `RelatorioResumo` conforme contrato em contracts/api-endpoints.md
- [x] T006 Criar `src/backend/src/controllers/relatorios.controller.ts` com método `resumo()` que chama `relatoriosService.getResumo()`, retorna `200` com o resultado JSON, trata `AppError` e erros genéricos com `{ erro: "Erro ao buscar relatórios", codigo: 500 }` seguindo o padrão dos controllers existentes
- [x] T007 Atualizar `src/backend/src/routes/relatorios.routes.ts` para importar o controller real e mapear `GET /resumo` para `relatoriosController.resumo`

**Checkpoint**: `curl http://localhost:3000/api/relatorios/resumo` retorna JSON válido com dados reais do banco

---

## Phase 3: US1 — Estatísticas Resumidas do Ministério (Priority: P1) 🎯 MVP

**Goal**: Exibir cards com total de músicas, cultos realizados e média por culto com dados reais do endpoint backend.

**Independent Test**: Adicionar eventos e músicas ao sistema via interface existente, acessar `/relatorios`, verificar que os cards exibem valores calculados a partir dos dados reais. Testar com banco vazio para verificar estado vazio.

### Implementation for User Story 1

- [x] T008 [P] [US1] Criar schema Zod `RelatorioResumoSchema` (com sub-schemas `MusicaRankingSchema` e `AtividadeMensalSchema`) e tipo inferido `RelatorioResumo` em `src/frontend/src/schemas/relatorio.ts` conforme definições em data-model.md
- [x] T009 [P] [US1] Criar service `getRelatorioResumo()` que chama `apiFetch<unknown>('/relatorios/resumo')` e valida com `RelatorioResumoSchema.parse()` em `src/frontend/src/services/relatorios.ts`
- [x] T010 [US1] Criar hook `useRelatorioResumo()` com `useQuery({ queryKey: ['relatorios', 'resumo'], queryFn: getRelatorioResumo })` em `src/frontend/src/hooks/use-relatorios.ts`
- [x] T011 [US1] Atualizar `src/frontend/src/pages/Reports.tsx`: remover constantes hardcoded (`topSongs`, `monthlyStats`, valores fixos 124/42/6.2), importar `useRelatorioResumo`, renderizar seção de cards de resumo (Total de Músicas, Cultos Realizados, Média por Culto) com dados reais de `data.totalMusicas`, `data.totalEventos`, `data.mediaPorEvento.toFixed(1)`, adicionar skeleton loaders para loading state nos 3 cards, adicionar `ErrorState` com `onRetry={() => refetch()}` quando `isError`, exibir "0" nos cards com mensagem de ausência de dados quando valores são zero (FR-008)

**Checkpoint**: Os 3 cards de resumo exibem dados reais. Loading skeleton aparece durante carregamento. ErrorState com retry aparece em caso de falha. Estado vazio claro quando não há dados.

---

## Phase 4: US2 — Ranking de Músicas Mais Tocadas (Priority: P2)

**Goal**: Exibir ranking das 5 músicas mais tocadas com dados reais do endpoint, substituindo a lista hardcoded.

**Independent Test**: Associar músicas a eventos via interface existente, acessar `/relatorios`, verificar que ranking exibe nomes corretos com contagens reais, ordenados por frequência DESC e nome ASC em caso de empate.

### Implementation for User Story 2

- [x] T012 [US2] Atualizar seção "Músicas Mais Tocadas" em `src/frontend/src/pages/Reports.tsx`: substituir array hardcoded `topSongs` por `data.topMusicas` do hook, renderizar cada item com posição (1–5), nome (`musica.nome`) e contagem (`musica.vezes` + " vezes"), manter barras de progresso proporcionais ao primeiro lugar (`musica.vezes / topMusicas[0].vezes * 100`), adicionar skeleton loaders para loading state da seção, exibir mensagem de estado vazio "Nenhuma música foi tocada em cultos ainda" quando `topMusicas` é array vazio

**Checkpoint**: Ranking exibe top 5 músicas reais com contagem. Empty state aparece quando não há dados. Barras de progresso proporcionais funcionam.

---

## Phase 5: US3 — Atividade Mensal (Priority: P3)

**Goal**: Exibir atividade mensal dos últimos 6 meses com dados reais, substituindo os meses hardcoded.

**Independent Test**: Criar eventos em meses diferentes com músicas associadas, acessar `/relatorios`, verificar que cada mês exibe contagem correta de cultos e músicas, ordenados cronologicamente.

### Implementation for User Story 3

- [x] T013 [US3] Atualizar seção "Atividade Mensal" em `src/frontend/src/pages/Reports.tsx`: substituir array hardcoded `monthlyStats` por `data.atividadeMensal` do hook, renderizar cada item com nome do mês (`item.mes`), contagem de eventos (`item.eventos` + " cultos") e contagem de músicas (`item.musicas` + " músicas"), manter barras de progresso para visualização de tendência, garantir que meses estão em ordem cronológica ascendente (mais antigo primeiro, conforme FR-007), adicionar skeleton loaders para loading state da seção, exibir mensagem de estado vazio "Nenhuma atividade registrada nos últimos meses" quando `atividadeMensal` é array vazio

**Checkpoint**: Atividade mensal exibe dados reais dos últimos 6 meses. Empty state aparece quando não há dados. Ordem cronológica correta.

---

## Phase 6: Testes Unitários Backend

**Goal**: Garantir correção dos cálculos de agregação com testes unitários usando fake repository.

- [x] T014 [P] Criar fake repository `FakeRelatoriosRepository` com dados configuráveis para testes em `src/backend/tests/unit/relatorios.service.test.ts`
- [x] T015 Implementar testes unitários do `RelatoriosService.getResumo()` cobrindo os cenários: (1) totais corretos com dados populados; (2) média arredondada a 1 casa decimal; (3) banco vazio retorna zeros e arrays vazios; (4) ranking com empate desempata por ordem alfabética; (5) ranking limitado a 5 músicas; (6) apenas eventos passados (data ≤ hoje) são contabilizados — eventos futuros excluídos; (7) atividade mensal dos últimos 6 meses em ordem cronológica; (8) média retorna 0 quando não há eventos em `src/backend/tests/unit/relatorios.service.test.ts`

**Checkpoint**: `npx vitest run` passa todos os testes de relatórios.

---

## Phase 7: Polish & Validação Final

**Goal**: Limpeza de código, validação end-to-end e verificação de docstrings.

- [x] T016 Verificar que nenhum valor hardcoded (124, 42, 6.2, "Reckless Love", "Way Maker" hardcoded, "Jul", "Ago" etc.) permanece em `src/frontend/src/pages/Reports.tsx` — limpar qualquer resíduo de dados fictícios (SC-001)
- [x] T017 **Playwright MCP**: Validação end-to-end — acessar `/relatorios` → verificar loading skeletons → verificar cards com dados reais → verificar ranking com dados reais → verificar atividade mensal em ordem cronológica ascendente → parar backend → recarregar → verificar ErrorState com botão "Tentar novamente" → reiniciar backend → clicar retry → verificar dados carregam → verificar console sem erros → **SC-002**: medir tempo de carregamento da página (deve ser < 3 segundos desde navegação até dados visíveis) → **SC-003**: adicionar novo evento/música via interface, revisitar `/relatorios`, verificar que os dados atualizados são refletidos sem recarregar manualmente
- [x] T018 Executar checklist `specs/007-live-reports/quickstart.md` — verificar os 7 pontos de verificação rápida para confirmar que a feature está completa

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — pode iniciar imediatamente
- **Phase 2 (Foundational)**: Depende de T001 (tipos) e T002/T003 (rota registrada)
- **Phase 3 (US1)**: Depende de Phase 2 (endpoint funcional). Frontend schema/service (T008, T009) podem rodar em paralelo com Phase 2.
- **Phase 4 (US2)**: Depende de T011 (página já integrada com hook) — é uma extensão incremental da página
- **Phase 5 (US3)**: Depende de T012 (ranking implementado) — é a última seção a ser conectada
- **Phase 6 (Testes)**: Pode rodar em paralelo com Phase 3–5 (testa apenas o backend)
- **Phase 7 (Polish)**: Depende de todas as fases anteriores

### User Story Dependencies

- **US1 (P1)**: Requer backend funcional (Phase 2). Primeira story a ser integrada no frontend.
- **US2 (P2)**: Requer T011 completo (página integrada com hook). Os dados do ranking já vêm no mesmo endpoint — é apenas renderização.
- **US3 (P3)**: Requer T012 completo. Os dados mensais já vêm no mesmo endpoint — é apenas renderização.

### Within Each User Story

- Schema e service frontend são paralelizáveis ([P])
- Hook depende do service
- Página depende do hook

### Parallel Opportunities

- T001 e T002 podem rodar em paralelo (tipos e rota são arquivos diferentes)
- T008 e T009 podem rodar em paralelo (schema e service frontend)
- T014 (fake repository) pode rodar em paralelo com qualquer tarefa de frontend (Phase 3–5)
- Phase 6 (testes backend) pode rodar inteiramente em paralelo com Phases 3–5 (frontend)

---

## Parallel Example: Phase 2 + Phase 3

```text
# Backend (sequencial):
T004 → T005 → T006 → T007

# Frontend (em paralelo com backend após T001):
T008 (schema Zod) || T009 (service) → T010 (hook)

# Após backend + hook prontos:
T011 (página Reports.tsx com US1)

# Testes backend (em paralelo com frontend):
T014 → T015
```

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si
- [Story] label mapeia tarefa à user story específica para rastreabilidade
- O endpoint único `GET /api/relatorios/resumo` serve as 3 user stories — apenas a renderização muda
- US2 e US3 são extensões incrementais da página (mesma query, seções adicionais)
- Todas as docstrings devem ser em português do Brasil no formato JSDoc conforme CLAUDE.md
- Commit após cada tarefa ou grupo lógico
