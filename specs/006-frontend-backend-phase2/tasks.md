# Tasks: Integração Frontend-Backend (Fase 2)

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Implementation Strategy

- **MVP**: US4/US5 (Configurações) → US1 (Músicas) — Configurações desbloqueia gestão de versões de músicas
- **Incremental Delivery**: Cada fase é independentemente testável via Playwright MCP
- **Parallel Opportunities**: Schemas, services e hooks podem ser criados em paralelo dentro de cada fase

---

## Phase 1: Setup (Infrastructure)

**Goal**: Criar schemas, componentes reutilizáveis e rotas base necessários para todas as user stories.

- [ ] T001 [P] Criar schema de Artista com tipos `Artista`, `ArtistaResponse`, `CreateArtistaForm`, `UpdateArtistaForm` em `src/frontend/src/schemas/artista.ts`
- [ ] T002 [P] Adicionar schemas `UpdateMusicaForm`, `CreateVersaoForm`, `UpdateVersaoForm` ao arquivo `src/frontend/src/schemas/musica.ts`
- [ ] T003 [P] Adicionar schema `UpdateEventoForm` ao arquivo `src/frontend/src/schemas/evento.ts`
- [ ] T004 [P] Adicionar schemas de CRUD para entidades auxiliares (`CreateTagForm`, `UpdateTagForm`, `CreateFuncaoForm`, `UpdateFuncaoForm`, `CreateTonalidade`, `UpdateTonalidade`, `CreateTipoEvento`, `UpdateTipoEvento`, `CrudResponse`) ao arquivo `src/frontend/src/schemas/shared.ts`
- [ ] T005 Criar componente `DeleteConfirmDialog` reutilizável usando `AlertDialog` do shadcn/ui com props `title`, `description`, `onConfirm`, `isLoading` em `src/frontend/src/components/DeleteConfirmDialog.tsx`
- [ ] T006 Criar componente genérico `ConfigCrudSection<T>` que recebe configuração de entidade (label, campo de nome, hooks CRUD) e renderiza lista + formulário inline de criar/editar/excluir em `src/frontend/src/components/ConfigCrudSection.tsx`
- [ ] T007 Adicionar rotas `/musicas/:id` (SongDetail) e `/configuracoes` (Settings) ao router em `src/frontend/src/App.tsx`
- [ ] T008 Adicionar item de navegação "Configurações" com ícone `Settings` do lucide-react ao menu lateral em `src/frontend/src/components/AppSidebar.tsx`

---

## Phase 2: Foundational (Services + Hooks)

**Goal**: Implementar toda a camada de serviços e hooks necessária para as user stories. DEVE ser concluída antes das fases de UI.

- [ ] T009 [P] Criar service `artistas.ts` com funções `getArtistas`, `getArtista`, `createArtista`, `updateArtista`, `deleteArtista` e criar hook `use-artistas.ts` com `useArtistas`, `useCreateArtista`, `useUpdateArtista`, `useDeleteArtista` em `src/frontend/src/services/artistas.ts` e `src/frontend/src/hooks/use-artistas.ts`
- [ ] T010 [P] Estender service `support.ts` com CRUD para Tags (`createTag`, `updateTag`, `deleteTag`), Funções (`createFuncao`, `updateFuncao`, `deleteFuncao`), Tonalidades (`createTonalidade`, `updateTonalidade`, `deleteTonalidade`), Tipos de Evento (`createTipoEvento`, `updateTipoEvento`, `deleteTipoEvento`) e adicionar `getTags`, `getArtistas` ao service. Estender hooks em `use-support.ts` com mutations correspondentes e queries `useTags`, `useArtistas` em `src/frontend/src/services/support.ts` e `src/frontend/src/hooks/use-support.ts`
- [ ] T011 [P] Estender service `musicas.ts` com `updateMusica`, `deleteMusica`, `getVersoes`, `addVersao`, `updateVersao`, `removeVersao`, `getTagsMusica`, `addTagMusica`, `removeTagMusica`, `getFuncoesMusica`, `addFuncaoMusica`, `removeFuncaoMusica` em `src/frontend/src/services/musicas.ts`
- [ ] T012 [P] Estender hooks `use-musicas.ts` com `useMusica(id)`, `useUpdateMusica`, `useDeleteMusica`, `useAddVersao`, `useUpdateVersao`, `useRemoveVersao`, `useAddTagMusica`, `useRemoveTagMusica`, `useAddFuncaoMusica`, `useRemoveFuncaoMusica` com invalidação de cache conforme estratégia em contracts/frontend-services.md em `src/frontend/src/hooks/use-musicas.ts`
- [ ] T013 [P] Estender service `eventos.ts` com `updateEvento`, `deleteEvento` e hooks `use-eventos.ts` com `useUpdateEvento`, `useDeleteEvento` em `src/frontend/src/services/eventos.ts` e `src/frontend/src/hooks/use-eventos.ts`
- [ ] T014 [P] Estender service `integrantes.ts` com `getFuncoesIntegrante`, `addFuncaoIntegrante`, `removeFuncaoIntegrante` e hooks `use-integrantes.ts` com `useAddFuncaoIntegrante`, `useRemoveFuncaoIntegrante` em `src/frontend/src/services/integrantes.ts` e `src/frontend/src/hooks/use-integrantes.ts`

---

## Phase 3: US4/US5 — Configurações + Artistas (P2, desbloqueia US1)

**Goal**: Criar página de Configurações com abas horizontais para gerenciar Artistas, Tags, Funções, Tonalidades e Tipos de Evento.

**Independent Test**: Navegar para `/configuracoes`, alternar abas, criar/editar/excluir entidade em cada aba, testar erro de duplicidade.

- [ ] T015 [US5] Criar página `Settings.tsx` com componente `Tabs` do shadcn/ui contendo 5 abas (Artistas, Tags, Funções, Tonalidades, Tipos de Evento), cada aba renderizando `ConfigCrudSection` com hooks e configuração específicos da entidade em `src/frontend/src/pages/Settings.tsx`
- [ ] T016 [US4] Garantir que aba Artistas usa `useArtistas`, `useCreateArtista`, `useUpdateArtista`, `useDeleteArtista` do hook dedicado `use-artistas.ts` e que artistas criados ficam disponíveis para seleção no `VersaoForm` (validar integração) em `src/frontend/src/pages/Settings.tsx`
- [ ] T017 [US5] **Playwright MCP**: Navegar para `/configuracoes` → verificar 5 abas → criar/editar/excluir em cada aba → testar duplicidade → alternar abas → verificar console sem erros

---

## Phase 4: US1 — Gerenciamento Completo de Músicas (P1)

**Goal**: Implementar página de detalhes, edição, exclusão, e gestão de versões/tags/funções de músicas.

**Independent Test**: Clicar em música na listagem → navegar para `/musicas/:id` → editar nome/tonalidade → adicionar/remover versão → adicionar/remover tag → adicionar/remover função → excluir música → verificar redirecionamento.

- [ ] T018 [US1] Criar componente `VersaoForm` como dialog para criar/editar versão de música com campos: artista (select de artistas existentes), BPM (number opcional), cifras (textarea opcional), letras (textarea opcional), link (url opcional) — validação Zod com `CreateVersaoForm`/`UpdateVersaoForm` em `src/frontend/src/components/VersaoForm.tsx`
- [ ] T019 [US1] Criar componente `MusicaDetail` com seções: info básica (nome, tonalidade com edição inline), lista de versões (com add/remove/edit via VersaoForm), lista de tags (select + badges removíveis), lista de funções requeridas (select + badges removíveis), botão excluir com `DeleteConfirmDialog` em `src/frontend/src/components/MusicaDetail.tsx`
- [ ] T020 [US1] Criar página `SongDetail.tsx` com rota `/musicas/:id` que carrega dados via `useMusica(id)`, exibe `MusicaDetail`, trata estados de loading/error, e redireciona para `/musicas` após exclusão em `src/frontend/src/pages/SongDetail.tsx`
- [ ] T021 [US1] Atualizar `MusicaForm` para suportar modo edição: receber prop `musica` opcional, preencher campos, usar `useUpdateMusica` no submit quando em modo edição em `src/frontend/src/components/MusicaForm.tsx`
- [ ] T022 [US1] Atualizar `Songs.tsx` para: tornar cada item da lista clicável com `useNavigate` para `/musicas/:id`, e manter a paginação funcional em `src/frontend/src/pages/Songs.tsx`
- [ ] T023 [US1] **Playwright MCP**: Navegar para `/musicas` → clicar em música → verificar `/musicas/:id` → editar nome → adicionar versão com artista → remover versão → adicionar tag → remover tag → adicionar função → remover função → excluir música → verificar retorno à lista → verificar console sem erros

---

## Phase 5: US2 — Gerenciamento Completo de Escalas/Eventos (P1)

**Goal**: Habilitar edição e exclusão de escalas/eventos existentes.

**Independent Test**: Clicar "Editar" em escala → verificar formulário preenchido → alterar dados → salvar → verificar persistência → excluir com confirmação → verificar remoção.

- [ ] T024 [US2] Atualizar `EventoForm` para suportar modo edição: receber prop `evento` opcional, preencher campos (data, tipo_evento, descrição), usar `useUpdateEvento` no submit quando em modo edição em `src/frontend/src/components/EventoForm.tsx`
- [ ] T025 [US2] Atualizar `EventoDetail` adicionando botão "Editar" que abre `EventoForm` em modo edição e botão "Excluir" que abre `DeleteConfirmDialog` com `useDeleteEvento`, redirecionando para `/escalas` após exclusão em `src/frontend/src/components/EventoDetail.tsx`
- [ ] T026 [US2] Atualizar `Scales.tsx` para: habilitar botão "Editar" (remover texto "em breve") que abre `EventoForm` em modo edição, e adicionar botão "Excluir" com `DeleteConfirmDialog` na listagem em `src/frontend/src/pages/Scales.tsx`
- [ ] T027 [US2] **Playwright MCP**: Navegar para `/escalas` → clicar "Editar" → verificar formulário preenchido → alterar descrição → salvar → verificar notificação → clicar "Excluir" → confirmar → verificar remoção da lista → verificar console sem erros

---

## Phase 6: US3 — Atribuição de Funções aos Integrantes (P1)

**Goal**: Adicionar gestão de funções (instrumentos/papéis) ao dialog de edição de integrantes.

**Independent Test**: Clicar "Editar" em integrante → verificar seção de funções com badges → adicionar função via seletor → remover função clicando no badge → verificar badges atualizadas no card.

- [ ] T028 [US3] Atualizar `IntegranteForm` adicionando seção de funções abaixo dos campos existentes: exibir funções atuais como badges removíveis (clique no X remove via `useRemoveFuncaoIntegrante`), seletor dropdown com funções disponíveis filtradas (excluindo já atribuídas) que adiciona via `useAddFuncaoIntegrante`, carregar dados via `useFuncoes` para lista disponível em `src/frontend/src/components/IntegranteForm.tsx`
- [ ] T029 [US3] **Playwright MCP**: Navegar para `/integrantes` → clicar "Editar" → verificar seção de funções → adicionar função via seletor → verificar badge → remover função → verificar remoção → fechar dialog → verificar badges no card → verificar console sem erros

---

## Phase 7: US6 — Dashboard com Dados Reais (P3)

**Goal**: Substituir dados fictícios por dados reais do servidor no painel principal.

**Independent Test**: Acessar Dashboard → verificar que cards exibem contagens reais (não 124, 8, 32, 15) → verificar próximas escalas com dados do servidor → criar registro em outro módulo → voltar ao Dashboard → verificar contagem atualizada.

- [ ] T030 [US6] Atualizar `Dashboard.tsx` para: usar `useMusicas(1, 1)` para total de músicas (via meta.total), `useEventos` para total e próximos eventos (filtrar por data futura, ordenar), `useIntegrantes` para total de integrantes — remover todas as constantes hardcoded e substituir por dados dos hooks com loading states em `src/frontend/src/pages/Dashboard.tsx`
- [ ] T031 [US6] **Playwright MCP**: Navegar para `/` → verificar cards com números reais → verificar "Próximas Escalas" com dados do servidor → navegar para `/integrantes` → criar integrante → voltar ao Dashboard → verificar contagem atualizada → verificar console sem erros

---

## Phase 8: US7 — Busca Funcional em Listagens (P3)

**Goal**: Ativar campos de busca já existentes nas páginas de Músicas e Integrantes para filtrar resultados por nome.

**Independent Test**: Digitar termo de busca → verificar filtragem instantânea → limpar campo → verificar lista completa restaurada → busca sem resultado → estado vazio com mensagem.

- [ ] T032 [P] [US7] Implementar filtragem client-side em `Songs.tsx`: adicionar estado para termo de busca, usar `useMemo` para filtrar músicas por nome (case-insensitive) com debounce de 300ms, conectar ao input de busca existente, exibir `EmptyState` com mensagem "Nenhum resultado encontrado" quando filtro não retorna itens em `src/frontend/src/pages/Songs.tsx`
- [ ] T033 [P] [US7] Implementar filtragem client-side em `Members.tsx`: adicionar estado para termo de busca, usar `useMemo` para filtrar integrantes por nome (case-insensitive) com debounce de 300ms, conectar ao input de busca existente, exibir `EmptyState` com mensagem "Nenhum resultado encontrado" quando filtro não retorna itens em `src/frontend/src/pages/Members.tsx`
- [ ] T034 [US7] **Playwright MCP**: Testar busca em `/musicas` (digitar termo → verificar filtragem → limpar → verificar restauração) e em `/integrantes` (mesmo fluxo) → testar busca sem resultado → verificar console sem erros

---

## Phase 9: Testes E2E Automatizados (Playwright)

**Goal**: Configurar Playwright e criar testes automatizados de regressão para navegabilidade e usabilidade.

- [ ] T035 Instalar Playwright e criar `playwright.config.ts` com baseURL `http://localhost:8080`, configurar script de test no `package.json` em `src/frontend/playwright.config.ts` e `src/frontend/package.json`
- [ ] T036 [P] Criar testes E2E de navegação: navegar por todas as páginas do menu, testar 404, alternar tema, navegar /musicas → /musicas/:id → voltar, alternar abas em /configuracoes em `src/frontend/tests/e2e/navigation.spec.ts`
- [ ] T037 [P] Criar testes E2E de músicas: listar, navegar detalhes, editar, excluir com confirmação, adicionar/remover versão, tag e função, busca com filtragem em `src/frontend/tests/e2e/musicas.spec.ts`
- [ ] T038 [P] Criar testes E2E de escalas: listar, editar escala, excluir com confirmação em `src/frontend/tests/e2e/escalas.spec.ts`
- [ ] T039 [P] Criar testes E2E de integrantes: adicionar/remover função, verificar badges, busca com filtragem em `src/frontend/tests/e2e/integrantes.spec.ts`
- [ ] T040 [P] Criar testes E2E de configurações: exibir 5 abas, alternar, CRUD em cada aba, testar duplicidade em `src/frontend/tests/e2e/configuracoes.spec.ts`
- [ ] T041 [P] Criar testes E2E de dashboard: verificar contagens reais, próximos eventos, ausência de dados hardcoded em `src/frontend/tests/e2e/dashboard.spec.ts`

---

## Phase 10: Polish & Cross-Cutting Concerns

**Goal**: Validação final de qualidade e consistência.

- [ ] T042 **Playwright MCP**: Navegação completa por todas as rotas verificando ausência de erros no console, estados de loading corretos, e feedback visual em todas as operações
- [ ] T043 Verificar todos os critérios de sucesso (SC-001 a SC-010): endpoints conectados, CRUD funcional, dados reais no Dashboard, busca funcional, confirmação de exclusão, notificações, sem tela em branco em erro

---

## Dependencies

```text
Phase 1 (Setup)
    ↓
Phase 2 (Foundational: Services + Hooks)
    ↓
    ├── Phase 3 (US4/US5: Configurações) ─── desbloqueia artistas para VersaoForm
    │       ↓
    ├── Phase 4 (US1: Músicas) ─── depende de artistas para versões
    ├── Phase 5 (US2: Escalas) ─── independente
    └── Phase 6 (US3: Integrantes) ─── independente
            ↓
    Phase 7 (US6: Dashboard) ─── depende de dados reais em outros módulos
    Phase 8 (US7: Busca) ─── independente, pode rodar em paralelo
            ↓
    Phase 9 (E2E Tests) ─── depende de todas as features implementadas
            ↓
    Phase 10 (Polish)
```

## Parallel Execution Opportunities

### Dentro de Phase 1 (Setup)
```text
T001 ║ T002 ║ T003 ║ T004  (schemas em arquivos diferentes)
         ↓
T005 ║ T006  (componentes reutilizáveis independentes)
         ↓
T007 ║ T008  (App.tsx e AppSidebar.tsx)
```

### Dentro de Phase 2 (Foundational)
```text
T009 ║ T010 ║ T011 ║ T012 ║ T013 ║ T014  (services+hooks em arquivos diferentes)
```

### Após Phase 2 (User Stories)
```text
Phase 3 (US4/US5) → Phase 4 (US1)  (sequencial: artistas desbloqueia versões)
Phase 5 (US2) ║ Phase 6 (US3)      (paralelo: independentes)
Phase 7 (US6) ║ Phase 8 (US7)      (paralelo: independentes)
```

### Dentro de Phase 9 (E2E Tests)
```text
T036 ║ T037 ║ T038 ║ T039 ║ T040 ║ T041  (arquivos de teste independentes)
```

## Summary

| Métrica | Valor |
|---------|-------|
| **Total de tasks** | 43 |
| **US1 (Músicas)** | 6 tasks |
| **US2 (Escalas)** | 4 tasks |
| **US3 (Integrantes)** | 2 tasks |
| **US4 (Artistas)** | 2 tasks |
| **US5 (Configurações)** | 3 tasks |
| **US6 (Dashboard)** | 2 tasks |
| **US7 (Busca)** | 3 tasks |
| **Setup + Foundational** | 14 tasks |
| **E2E Tests** | 7 tasks |
| **Polish** | 2 tasks |
| **Playwright MCP validations** | 9 (1 per module + navegação geral) |
| **Parallel opportunities** | 6 blocos de execução paralela |
| **MVP scope** | Phase 1-4 (Setup + Configurações + Músicas) |
