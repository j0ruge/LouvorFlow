---

description: "Task list for feature 027-cifraclub-list-link"
---

# Tasks: Linkar lista pública do CifraClub por Evento

**Input**: Design documents from `specs/027-cifraclub-list-link/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/eventos-cifraclub-list-url.openapi.json, contracts/cifraclub-songbook-external.md, quickstart.md
**Stack** (per plan.md): TypeScript 5.9 backend (Express 5.1, Prisma 6.19, Zod) + React 18 frontend (Vite, TailwindCSS, shadcn/ui, React Query, sonner); Vitest 4. Monorepo `packages/backend` + `packages/frontend`.

**Tests**: Required per CLAUDE.md (dev-workflow §3 smoke test + project convention) e research.md §8.

**Docstrings (CLAUDE.md CRITICAL)**: TODA task que cria ou modifica arquivo de código TypeScript/TSX exige docstrings JSDoc em **português do Brasil** em funções, métodos, hooks, handlers, utilitários E callbacks de teste (`describe`, `test`, `it`). Sem exceção. Isso se aplica a T004–T040 mesmo quando a task não cita docstring explicitamente. Validação durante review: nenhum arquivo novo/modificado pode ter função pública sem JSDoc PT-BR.

**Organization**: Tarefas agrupadas por user story (US1 P1 = MVP de share; US2 P1 = CRUD pré-requisito do share; US3 P2 = botão direto na Escala; US4 P2 = aviso de desatualização). US2 vem antes de US1 no fluxo de implementação porque é precondição de cadastro.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: arquivos diferentes, sem dependências bloqueantes pendentes.
- **[Story]**: label da user story (US1, US2, US3, US4).
- File paths absolutos ou repo-root-relative.

---

## Phase 1: Setup (Pré-requisitos operacionais)

**Purpose**: pré-condições de ambiente. Não geram código, mas são gates.

- [ ] T001 Confirmar que a feature 025 (`cifraclub-playlist-integration`) está mergeada em master, verificando com `grep -E 'CifraclubPlaylistDialog' packages/frontend/src/components/CifraclubPlaylistDialog.tsx` (arquivo deve existir) e `grep -E 'cifraclub-playlist' packages/backend/src/routes/eventos.routes.ts` (rota deve existir). Se ausente, **PARAR** — 025 é dependência rígida para o botão extra do diálogo (FR-007).
- [ ] T002 [P] Pull do branch `develop` e rebase desta branch (`027-cifraclub-list-link`) sobre o último commit garantindo que 025 (e idealmente 026) estão incorporadas.
- [ ] T003 [P] Validar regex de URL CifraClub contra os 5 exemplos de listas reais documentados em `specs/027-cifraclub-list-link/research.md` §1 (3 listas custom + 1 system + 1 com query string) usando regex tester (regex101.com ou similar) — confirmar 5 matches e zero false-positives em ~10 URLs negativas (cifras.com.br, youtube, http://, sem `www.`, etc.). Documentar resultado breve no PR description.

**Checkpoint**: T001 verde (025 mergeada). T002 garante base atualizada. T003 elimina retrabalho em case de regex bugada. Avançar para Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: backend de persistência. Foundational porque tanto US1 (share) quanto US2 (CRUD frontend) dependem da coluna existir e do endpoint aceitar o campo.

- [ ] T004 Criar migração Prisma `<ts>_add_cifraclub_list_url_to_eventos` em `packages/backend/prisma/migrations/<ts>_add_cifraclub_list_url_to_eventos/migration.sql` com SQL: `ALTER TABLE "eventos" ADD COLUMN "cifraclub_list_url" TEXT, ADD COLUMN "cifraclub_list_url_updated_at" TIMESTAMPTZ;`. Atualizar `packages/backend/prisma/schema.prisma` model `Eventos` adicionando `cifraclub_list_url String? @db.Text` e `cifraclub_list_url_updated_at DateTime? @db.Timestamptz(6)`. Rodar `npx prisma migrate dev` em terminal interativo OU `npx prisma db push --accept-data-loss` em ambiente CI. Validar `psql -d louvorflow -c "\d eventos"` mostra as 2 colunas. Rodar `npx prisma generate`.
- [ ] T005 [P] Criar `packages/backend/src/lib/cifraclub-list-url.ts` exportando: constante `CIFRACLUB_LIST_URL_REGEX = /^https:\/\/www\.cifraclub\.com\.br\/musico\/(\d+)\/repertorio\/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)\/?(\?.*)?$/i` e função `validateCifraclubListUrl(url: string | null | undefined): { valid: boolean; userId?: string; listId?: string; isSystemList: boolean }`. Função pura, nunca lança. Docstring JSDoc PT-BR.
- [ ] T006 [P] Criar `packages/backend/tests/lib/cifraclub-list-url.test.ts` cobrindo: (a) URLs custom válidas (3 exemplos de research.md §1), (b) 3 listas-sistema (`favoritas`, `consegui-tocar`, `ainda-vou-tocar`) — verificar `isSystemList: true`, (c) com query string (`?utm=x`) — verificar `valid: true` e preserva, (d) casing variado (`https://WWW.CifraCLUB.COM.BR/...`), (e) inválidos: cifras.com.br, youtube.com, http://, sem `www.`, com `m.`, path extra, `null`, `undefined`, `""`, espaços. Rodar `npm test -- cifraclub-list-url` e confirmar verde (T005 já implementada).
- [ ] T007 Atualizar `packages/backend/src/types/index.ts`: estender o tipo `Evento` (e variantes `EventoShow`, `EventoCreate`, `EventoUpdate`) com `cifraclub_list_url: string | null` e `cifraclub_list_url_updated_at: Date | null`. Adicionar `cifraclub_list_url_stale: boolean` somente no tipo de resposta `EventoShow` (não persistido). Atualizar `EVENTO_SHOW_SELECT` para incluir as 2 colunas novas + relação `Eventos_Musicas { select: { updated_at: true }, orderBy: { updated_at: 'desc' }, take: 1 }` para o cálculo de `stale`. Docstring JSDoc PT-BR em cada campo novo.
- [ ] T008 Atualizar `packages/backend/src/validators/eventos.validators.ts`: criar `cifraclubListUrlSchema = z.string().regex(CIFRACLUB_LIST_URL_REGEX).nullable().optional()` (importar regex de `../lib/cifraclub-list-url`) com mensagem de erro PT-BR clara: "URL deve seguir o padrão https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/". Acrescentar o campo nos schemas existentes `createEventoBodySchema` e `updateEventoBodySchema`. Tratar string vazia como `null` (pré-processamento Zod com `.transform`).
- [ ] T009 Modificar `packages/backend/src/services/eventos.service.ts` método `update` (e equivalente em `create` se necessário): aplicar lógica do `research.md §3` — ler o valor atual de `cifraclub_list_url` antes do update; se o payload contém o campo E o valor difere do persistido, setar `cifraclub_list_url_updated_at = new Date()`; se o payload remove (null/empty), setar timestamp para null junto; se o payload omite o campo OU envia mesmo valor, não tocar no timestamp. Em `create`, setar timestamp = `new Date()` se URL vier preenchida. Docstring JSDoc PT-BR no método.
- [ ] T010 Modificar `packages/backend/src/repositories/eventos.repository.ts` métodos `create` e `update` para passar `cifraclub_list_url` e `cifraclub_list_url_updated_at` adiante quando recebidos do service (sem regras de negócio aqui — apenas propagação).
- [ ] T011 Estender `packages/backend/tests/services/eventos.service.test.ts` com 8 cenários (research.md §8 + findings da análise): (a) `create` com URL → persiste + timestamp set, (b) `update` com mesma URL → timestamp inalterado, (c) `update` com URL diferente → timestamp bumped, (d) `update` removendo URL (null) → timestamp set to null, (e) PATCH parcial sem o campo → timestamp inalterado, (f) URL inválida no payload → validator retorna 400 antes de chegar no service, (g) **RBAC**: requisição PUT/POST com `cifraclub_list_url` por usuário sem permissão `escalas.write` → middleware retorna 403 e nenhuma persistência ocorre (cobre FR-010), (h) **multi-tenant**: criar evento com URL em tenantA, depois ler/editar a mesma URL com contexto de tenantB → 404 do middleware `ensureTenantContext`, URL não vaza (cobre FR-011 e SC-005). Usar fakes existentes; para (g)/(h) mockar `req.user` com roles/tenantId distintos.
- [ ] T012 Atualizar `packages/backend/docs/openapi.json` aplicando o patch documentado em `specs/027-cifraclub-list-link/contracts/eventos-cifraclub-list-url.openapi.json` nos schemas `EventoCreateBody`, `EventoUpdateBody`, `EventoShow`, `EventoListItem`. Validar JSON via `Get-Content openapi.json | ConvertFrom-Json` (PowerShell) ou parser equivalente.

**Checkpoint**: backend completo de persistência. Endpoint REST aceita/retorna os campos. Frontend (US2) pode começar imediatamente após.

---

## Phase 3: User Story 2 — Líder cadastra/edita a URL da lista (Priority: P1, precondição de US1) 📝

**Goal**: UI de cadastro + edição + remoção da URL no formulário de Escala, com preview opcional via API pública do CifraClub.

**Independent Test**: editar uma Escala existente, colar uma URL válida no campo "Lista no CifraClub", aguardar preview aparecer (~500ms), salvar, recarregar e confirmar que a URL persiste. Em seguida editar para vazio e confirmar remoção.

### Tests for User Story 2

- [ ] T013 [P] [US2] Criar `packages/frontend/src/lib/cifraclub-list-url.ts` espelhando o backend: `CIFRACLUB_LIST_URL_REGEX` (mesma string), `validateCifraclubListUrl` (mesma assinatura), e nova função assíncrona `fetchListPreview(url: string, signal: AbortSignal): Promise<ListPreview | null>` conforme research.md §2. Docstring JSDoc PT-BR.
- [ ] T014 [P] [US2] Criar `packages/frontend/tests/lib/cifraclub-list-url.test.ts` cobrindo (a) mesmos casos da regex do T006 (cópia adaptada), (b) `fetchListPreview` com fetch mock — sucesso 200 → retorna ListPreview, 404 → null, timeout (AbortController) → null, JSON inválido → null, CORS error → null. Rodar com `vitest --run`. Confirmar verde após T013.
- [ ] T015 [P] [US2] Atualizar `packages/frontend/src/schemas/evento.ts` (Zod): adicionar `cifraclub_list_url: z.string().nullable().default(null)` e `cifraclub_list_url_updated_at: z.string().nullable().default(null)` (ISO date string) ao schema do Evento. Marcar como `.optional()` defensivamente para tolerar respostas backend pré-027 durante rollout (research.md §6).

### Implementation for User Story 2

- [ ] T016 [US2] Modificar `packages/frontend/src/services/eventos.ts` métodos `create` e `update`: passar `cifraclub_list_url` no payload quando presente (tratar string vazia como `null` no client antes de enviar).
- [ ] T017 [US2] Modificar `packages/frontend/src/components/EventoForm.tsx` adicionando: (a) novo input `<Input>` rotulado "Lista no CifraClub (opcional)" com placeholder `https://www.cifraclub.com.br/musico/.../repertorio/.../`, (b) validação inline via `validateCifraclubListUrl` ao blur ou submit — erro PT-BR claro abaixo do input, (c) preview component embaixo do input que mostra "Lista: **{name}** · por {userName} · {totalSongs} músicas · {pública/privada}" ou skeleton durante loading, (d) debounce de 500ms (`useDebounce` ou setTimeout custom) antes de disparar `fetchListPreview`, (e) `AbortController` cancelando fetch anterior em re-input, **(f) quando `preview.isPublic === false` (EC-3): renderizar warning textual sutil abaixo do preview — "⚠ Esta lista não está marcada como pública no CifraClub. Os músicos podem cair em uma tela de login ao tocar o link. Considere marcar como pública." Salvar continua habilitado, (g) quando `validateCifraclubListUrl(url).isSystemList === true` (EC-2): pular o fetch e exibir texto fixo "Lista do sistema do CifraClub — preview indisponível" em vez de skeleton de loading infinito.** **Mobile-first**: input `w-full sm:w-auto`; preview empilha em coluna em viewport 360px. Docstring JSDoc PT-BR no componente novo de preview.
- [ ] T018 [US2] Modificar `packages/frontend/src/hooks/use-eventos.ts`: nada novo necessário (mutations existentes já invalidam queries de `['eventos']`). Apenas verificar que `queryKey` cobre o detalhe (`['eventos', id]`) para refletir mudanças após save.
- [ ] T019 [US2] Smoke manual rápido: cadastrar URL conhecida → preview aparece → salvar → reload → URL persiste; depois apagar e salvar → URL removida (vide quickstart.md Cenário 2 passos 1-5).

**Checkpoint**: líder consegue cadastrar/editar/remover. Próximo passo (US1) pode usar o campo persistido.

---

## Phase 4: User Story 1 — Líder compartilha link único oficial do CifraClub (Priority: P1) 🎯 MVP completo

**Goal**: botão "Compartilhar lista no CifraClub" no diálogo da Playlist CifraClub (criado pela 025) com mensagem WhatsApp formatada contendo apenas a URL única.

**Independent Test**: em uma Escala com URL cadastrada via US2, abrir o diálogo da Playlist CifraClub, clicar "Lista no CifraClub", confirmar abertura de `wa.me/?text=...` com mensagem no formato definido em FR-008.

### Tests for User Story 1

- [ ] T020 [P] [US1] Criar `packages/frontend/src/lib/cifraclub-list-share.ts` exportando função `formatCifraclubListShare(evento: { tipo_evento, data, cifraclub_list_url }): string` que retorna a mensagem WhatsApp no formato exato de research.md §5 (header bold com tipo+data PT-BR, linha `🎸 *Lista no CifraClub*: {url}`, microcopy itálico). Função pura. Docstring JSDoc PT-BR.
- [ ] T021 [P] [US1] Criar `packages/frontend/tests/lib/cifraclub-list-share.test.ts` cobrindo: (a) mensagem completa com URL válida + data formatada pt-BR, (b) `tipo_evento` vazio → fallback "Escala" ou similar, (c) encoding URL-safe para `wa.me` (espaços, acentos), (d) idempotência (mesma entrada → mesma saída byte-idêntica).

### Implementation for User Story 1

- [ ] T022 [US1] Modificar `packages/frontend/src/components/CifraclubPlaylistDialog.tsx`: (a) ler `evento.cifraclub_list_url` (já vem no payload da 025 após T015), (b) renderizar condicionalmente um novo botão no footer entre "WhatsApp" e "Fechar" — desktop label "Lista no CifraClub" + ícone `ListMusic` lucide; mobile icon-only com `aria-label="Compartilhar lista no CifraClub via WhatsApp"`, (c) onClick: chamar `formatCifraclubListShare(evento)`, encodeURIComponent, abrir `wa.me/?text=...` via `window.open(..., '_blank', 'noopener,noreferrer')`, (d) quando `cifraclub_list_url` é null/empty, no lugar do botão renderizar link discreto `<Button variant="link" size="sm">Cadastrar URL da lista CifraClub</Button>` que fecha o diálogo e abre o `EventoForm` em modo edição. **Mobile-first**: footer já é `flex-col sm:flex-row` (herdado 025); validar overflow em 360px.
- [ ] T023 [US1] Smoke manual conforme quickstart.md Cenário 1 passos 6-13 (botão aparece no diálogo, abre wa.me, app CifraClub abre lista em celular real).

**Checkpoint**: MVP completo. Líder cadastra (US2) → compartilha (US1) → músicos têm link único. Já entrega valor isolado, pode ser merged como PR `feat/027-mvp-share` se a equipe preferir releases menores.

---

## Phase 5: User Story 3 — Botão "Abrir lista no CifraClub" no header da Escala (Priority: P2)

**Goal**: atalho de acesso direto à lista a partir do detalhe da Escala (sem precisar abrir o diálogo da Playlist).

**Independent Test**: visualizar uma Escala com URL cadastrada e confirmar que o botão "Abrir lista no CifraClub" aparece próximo ao título e abre a URL ao clicar.

### Implementation for User Story 3

- [ ] T024 [US3] Modificar `packages/frontend/src/components/EventoDetail.tsx`: adicionar botão no header próximo aos botões "Editar/Excluir" existentes. (a) Renderizar somente quando `evento.cifraclub_list_url` não-null. (b) Desktop: "Abrir lista no CifraClub" + ícone `ListMusic`. (c) Mobile (`<sm`): icon-only com `aria-label="Abrir lista no CifraClub"`. (d) `<a href={cifraclub_list_url} target="_blank" rel="noopener noreferrer">` envolvendo o botão (ou Button como child de `<a>`), garantindo Universal/App Link no mobile. **Mobile-first**: validar que o header não dá overflow em 360px (uso de `flex-wrap` se necessário).
- [ ] T025 [P] [US3] Adicionar caso de teste em `packages/frontend/tests/components/EventoDetail.test.tsx` (criar arquivo se não existir): (a) botão aparece quando `cifraclub_list_url` cadastrada, (b) botão NÃO aparece quando null, (c) atributos `target="_blank"` e `rel="noopener noreferrer"` presentes. Usar Vitest + Testing Library (já em uso pelo projeto).
- [ ] T026 [US3] Smoke manual conforme quickstart.md Cenário 3 passos 3-7 (botão visível para usuário sem `escalas.write`; click abre Universal Link em celular).

**Checkpoint**: caminho alternativo para músicos dentro do LouvorFlow.

---

## Phase 6: User Story 4 — Aviso de "Lista possivelmente desatualizada" (Priority: P2)

**Goal**: detectar quando músicas da escala foram editadas após o cadastro/última edição da URL e sinalizar visualmente o usuário.

**Independent Test**: cadastrar URL em T0, editar `Eventos_Musicas` em T1 > T0, recarregar Escala e confirmar aviso visual + CTA "Atualizar no CifraClub".

### Tests for User Story 4

- [ ] T027 [P] [US4] Estender `packages/backend/tests/services/eventos.service.test.ts` com testes do método `isListUrlStale` (research.md §4): (a) sem URL cadastrada → false, (b) com URL + sem eventos_musicas → false, (c) com URL cadastrada em T0 + última edição de música em T0-1h → false, (d) com URL cadastrada em T0 + última edição em T0+1h → true.

### Implementation for User Story 4

- [ ] T028 [US4] Criar método `isListUrlStale(eventoId: string): Promise<boolean>` em `packages/backend/src/services/eventos.service.ts` conforme research.md §4 (query única com `take: 1` na relação `Eventos_Musicas` ordenado por `updated_at desc`). Docstring JSDoc PT-BR.
- [ ] T029 [US4] Modificar o método `show` (ou equivalente em `controllers/eventos.controller.ts` que monta a resposta de `GET /api/eventos/:id`): chamar `isListUrlStale` e mesclar `cifraclub_list_url_stale: boolean` na resposta. Atualizar o tipo `EventoShow` se necessário (já feito em T007). Confirmar T027 verde.
- [ ] T030 [US4] Modificar `packages/frontend/src/components/EventoDetail.tsx`: quando `evento.cifraclub_list_url_stale === true`, renderizar aviso visual (Alert component shadcn ou Banner inline) próximo ao campo "Lista no CifraClub" com texto "⚠ Lista possivelmente desatualizada — última edição de músicas em {data formatada pt-BR}" e link "Atualizar no CifraClub" que reusa o mesmo `target="_blank"` da US3. **Mobile-first**: alert empilha e quebra texto em 360px.
- [ ] T031 [P] [US4] Adicionar caso de teste em `packages/frontend/tests/components/EventoDetail.test.tsx`: (a) aviso aparece quando `cifraclub_list_url_stale: true`, (b) aviso NÃO aparece quando `false`, (c) link "Atualizar no CifraClub" tem href correto.
- [ ] T032 [US4] Smoke manual conforme quickstart.md Cenário 4 (cadastrar URL → editar música → aviso aparece; salvar nova URL → aviso some).

**Checkpoint**: todas as 4 user stories independentemente verificáveis.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: documentação, regressão final e housekeeping conforme CLAUDE.md "Finalização de Tasks".

- [ ] T033 [P] Atualizar `README.md` na raiz: na seção de Funcionalidades / Escalas, mencionar que "a Escala agora pode ter uma lista do CifraClub associada (`cifraclub_list_url`) — botão direto para abrir e share dedicado via WhatsApp". Frase curta sem detalhe técnico.
- [ ] T034 [P] Atualizar `.claude/rules/backend-api.md` se a feature introduz padrão novo de "campo de URL externa validada por regex em `src/lib/`" — adicionar bullet referenciando `cifraclub-list-url.ts` como exemplo. Se a regra já existir (introduzida pela 026), só estender com este caso.
- [ ] T035 [P] Atualizar `MEMORY.md` em `C:\Users\pc_admin\.claude\projects\C--Users-pc-admin-source-repos-LouvorFlow\memory\`: no bloco "Key Patterns" adicionar bullet sobre 027 — "Eventos.cifraclub_list_url + cifraclub_list_url_updated_at (timestamp manual no service). Detecção de staleness: `MAX(eventos_musicas.updated_at) > cifraclub_list_url_updated_at`. Preview no frontend direto via `api.cifraclub.com.br/v3/songbook/{id}` (CORS aberto, sem proxy backend)."
- [ ] T036 Rodar `cd packages/backend; npm test` — confirmar **100% dos testes anteriores (incluindo 025/026 se mergeadas) passam** (SC-006 da spec) + novos testes da 027 verdes. Em particular, confirmar que os cenários (g) e (h) de T011 (RBAC 403 e cross-tenant 404) estão verdes — eles materializam SC-005 e FR-010/FR-011 em CI. Sem regressões.
- [ ] T037 Rodar `cd packages/frontend; npm test` — idem, sem regressões.
- [ ] T038 Rodar `cd packages/backend; npm run typecheck` (ou `npx tsc --noEmit` se Sucrase) e `cd packages/frontend; npm run typecheck` — confirmar zero erros.
- [ ] T039 [P] Executar `specs/027-cifraclub-list-link/quickstart.md` Cenários 1–7 completos como gate final de PR. Anexar resultado ao PR description.
- [ ] T040 Revisar arquivos modificados/criados com `git diff --stat origin/master...HEAD` e confirmar que coincidem com a Source Code section do `plan.md` (delta esperado: 1 migration + ~4 arquivos novos + ~7 arquivos modificados backend + ~5 arquivos modificados/criados frontend + 1 doc atualizada). Confirmar **sem alteração não-prevista no schema** além das 2 colunas planejadas.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 é gate rígido (025 mergeada). T002/T003 são paralelos. Sem T001 verde, todo o resto está bloqueado.
- **Foundational (Phase 2)**: depende de Phase 1. T004 (migration) precisa rodar antes de T005-T012. T005/T006 são paralelos (lib + test). T007/T008/T009/T010 são sequenciais (types → validator → service → repository). T011 (integration test) depende de T009/T010. T012 (OpenAPI) é independente de tests.
- **US2 (Phase 3)**: depende de Phase 2 completa. T013/T014/T015 paralelos. T016 → T017 → T018 → T019 sequenciais.
- **US1 (Phase 4)**: depende de US2 completa (precisa do campo existir e ser cadastrável). T020/T021 paralelos. T022 → T023 sequencial.
- **US3 (Phase 5)**: depende de Phase 2 (precisa do campo existir no response). NÃO depende de US1/US2 (pode rodar em paralelo com elas se houver capacidade — botão lê dados, não escreve).
- **US4 (Phase 6)**: depende de Phase 2 (precisa do timestamp existir) e idealmente de US2 (precisa de cadastros reais para testar). T027/T028/T029 sequenciais; T030/T031 podem rodar em paralelo após T029.
- **Polish (Phase 7)**: depende de todas as US fechadas.

### User Story Dependencies

- **US2**: independente, mas precondição lógica de US1 (sem cadastro, share não tem o que mostrar).
- **US1**: depende lógica de US2.
- **US3**: independente das outras US (pode entregar imediatamente após Phase 2).
- **US4**: depende lógica de US2 (sem URL cadastrada, staleness sempre false).

### Parallel Opportunities

- T002 / T003 [P] — pull + regex validation.
- T005 / T006 [P] — backend lib + test (escritas em paralelo, validadas juntas).
- T013 / T014 / T015 [P] — frontend lib + test + Zod (3 arquivos distintos).
- T020 / T021 [P] — share lib + test.
- T025, T031, T039 [P] — testes/smoke em arquivos distintos.
- T033 / T034 / T035 [P] — docs em arquivos distintos.
- T036 / T037 podem rodar em terminais paralelos.

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Janela 1 — Lib + tests da regex
Task: "T005 — implementar cifraclub-list-url.ts"
Task: "T006 — escrever cifraclub-list-url.test.ts"
# Rodar T006 → confirmar verde

# Janela 2 (sequencial, após T004) — Tipos + Validator
Task: "T007 — atualizar types/index.ts"
Task: "T008 — atualizar validators/eventos.validators.ts" # depois de T007

# Janela 3 (sequencial) — Service + Repository
Task: "T009 — modificar eventos.service.ts" # depois de T007/T008
Task: "T010 — modificar eventos.repository.ts" # depois de T009
Task: "T011 — escrever testes de service" # depois de T009/T010
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Phase 1 (Setup) — gate T001 (025 mergeada).
2. Phase 2 (Foundational) completa — backend cadastra/lê o campo.
3. Phase 3 (US2) — frontend cadastro funcional.
4. Phase 4 (US1) — botão de share no diálogo. **MVP completo de valor entregue**: líder cadastra, compartilha link único, músicos abrem direto no app CifraClub.
5. **STOP & VALIDATE**: rodar quickstart.md Cenários 1+2. Se passar, MVP pronto para merge.

### Incremental Delivery

1. Setup + Foundational + US2 + US1 → MVP de cadastro+share.
2. + US3 → atalho no header da Escala.
3. + US4 → aviso de staleness.
4. + Polish → docs, regressão, merge final.

### Recommended Team Strategy

Solo dev (caso provável): sequencial Phase 1 → 2 → 3 → 4 → 5 → 6 → 7. Estimativa: ~10h efetivas (foundational ~3h, US2 ~2.5h, US1 ~1.5h, US3 ~1h, US4 ~1.5h, polish ~0.5h).

Dual dev: enquanto Dev A faz Phase 2 (backend), Dev B prepara T013/T014/T015 (frontend lib + Zod) mockando a resposta. Sincronizam após T012. Depois Dev A faz US4 (backend + frontend) e Dev B faz US1+US3 (puramente frontend).

---

## Notes

- **Migração Prisma**: T004 muda schema — único ponto onde existe risco real. Backup do banco local antes (`pg_dump`) se for ambiente compartilhado.
- **Função pura compartilhada**: `cifraclub-list-url.ts` é copiada entre backend e frontend (Princípio V — sem criar lib compartilhada por 1 regex). Manter ambos em sincronia ao editar.
- **TDD-ish**: testes escritos antes ou junto com implementação da mesma US.
- **Commits**: 1 por task ou grupo lógico pequeno. Mensagens PT-BR seguindo padrão `feat(escalas): cadastro de cifraclub_list_url + share dedicado` ou `test(cifraclub-list-url): ...`.
- **Stop at any checkpoint** para validar independentemente.
- **Avoid**: criar lib compartilhada para a regex (overengineering); adicionar índice em `cifraclub_list_url` (sem necessidade — busca sempre por id); criar nova rota REST (estende as existentes); proxy backend para o preview da API CifraClub (Q1 explícitamente descartou).
