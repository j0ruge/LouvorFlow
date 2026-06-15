---
description: "Task list for unified feature 025-cifraclub-integration"
---

# Tasks: Integração CifraClub — Playlist, Transposição e Lista por Evento

**Input**: Design documents from `specs/025-cifraclub-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Stack**: TypeScript 5.9 backend (Express 5.1, Prisma 6.19, Zod) + React 18 frontend (Vite, TailwindCSS, shadcn/ui, React Query, sonner); Vitest 4.

**Docstrings (CLAUDE.md CRITICAL)**: TODA task que cria ou modifica código TypeScript/TSX exige docstrings JSDoc em **português do Brasil**. Sem exceção.

**Organization**: Tasks agrupadas por user story. US2+US3+US4+US5 estão juntas porque compartilham o mesmo componente e endpoint.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: parallelizable (arquivos diferentes, sem dependências bloqueantes).
- **[Story]**: label da user story (US1, US2, US6, etc.).

---

## Phase 1: Setup

**Purpose**: Migrações e geração do Prisma Client.

- [x] T001 Criar migração `<ts>_add_cifraclub_url_to_artistas_musicas` em `packages/backend/prisma/migrations/` com SQL: `ALTER TABLE "artistas_musicas" ADD COLUMN "cifraclub_url" TEXT;`. Atualizar `packages/backend/prisma/schema.prisma` model `Artistas_Musicas` adicionando `cifraclub_url String? @db.Text`. Rodar `npx prisma db push` e `npx prisma generate`.
- [x] T002 Criar migração `<ts>_add_cifraclub_list_url_to_eventos` em `packages/backend/prisma/migrations/` com SQL: `ALTER TABLE "eventos" ADD COLUMN "cifraclub_list_url" TEXT, ADD COLUMN "cifraclub_list_url_updated_at" TIMESTAMPTZ;`. Atualizar `packages/backend/prisma/schema.prisma` model `Eventos` adicionando `cifraclub_list_url String? @db.Text` e `cifraclub_list_url_updated_at DateTime? @db.Timestamptz(6)`. Rodar `npx prisma db push` e `npx prisma generate`.

**Checkpoint**: Schema atualizado, 2 novas colunas confirmadas via `psql`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Libs utilitárias, tipos e validadores compartilhados por múltiplas user stories.

- [x] T003 [P] Criar `packages/backend/src/lib/cifraclub-key-mapping.ts` exportando: constante `CHROMATIC_MAP` (A=0..Ab=11), constante `ENHARMONIC_MAP` (A#→Bb, C#→Db, etc.), função `computeKeyFragment(tom: string | null): { N: number; tomFinal: string } | null` (normaliza Unicode ♭/♯, extrai nota raiz via regex, mapeia enarmônicos, lookup na tabela, retorna null se impossível), e função `applyKeyFragment(url: string, tom: string | null): { url: string; tomAjustado: boolean }` (verifica domínio `cifraclub.com.br`, separa query/fragment, aplica `#key=N` ou retorna original).
- [x] T004 [P] Criar `packages/backend/tests/lib/cifraclub-key-mapping.test.ts` cobrindo: (a) todos os 12 tons canônicos → N correto, (b) enarmônicos (A#→1, Gb→9, G#→11), (c) tons com sufixo modal (Am→0, C#m→4, F/A→8), (d) Unicode (E♭→6), (e) tom null/vazio/inválido → null, (f) `applyKeyFragment` com URL cifraclub → #key=N correto, (g) URL YouTube → sem fragmento + tomAjustado=false, (h) URL com fragmento pré-existente → substituído.
- [x] T005 [P] Criar `packages/backend/src/lib/cifraclub-list-url.ts` exportando: constante `CIFRACLUB_LIST_URL_REGEX = /^https:\/\/www\.cifraclub\.com\.br\/musico\/(\d+)\/repertorio\/(\d+|favoritas|consegui-tocar|ainda-vou-tocar)\/?(\\?[^#]*)?(#.*)?$/i` e função `validateCifraclubListUrl(url: string | null | undefined): { valid: boolean; userId?: string; listId?: string; isSystemList: boolean }`.
- [x] T006 [P] Criar `packages/backend/tests/lib/cifraclub-list-url.test.ts` cobrindo: URLs custom válidas, listas-sistema, query string, fragmento, casing variado, inválidos (cifras.com.br, youtube, http://, sem www, null, vazio).
- [x] T007 Atualizar `packages/backend/src/types/index.ts`: (a) tipo `VersaoRaw` e variantes ganham `cifraclub_url: string | null`; (b) `MUSICA_SELECT` e `EVENTO_SHOW_SELECT` incluem `cifraclub_url` nos selects de `Artistas_Musicas`; (c) tipo `EventoShowRaw` ganha `cifraclub_list_url`, `cifraclub_list_url_updated_at`; (d) `EVENTO_SHOW_SELECT` inclui as 2 novas colunas de Eventos; (e) novo tipo `CifraclubPlaylistItem` e `CifraclubPlaylistResponse` conforme data-model.md.
- [x] T008 Atualizar `packages/backend/src/validators/musicas.validators.ts`: adicionar `cifraclub_url: safeUrlSchema.optional()` nos schemas `addVersaoBodySchema`, `updateVersaoBodySchema`, `createMusicaCompleteBodySchema`, `updateMusicaCompleteBodySchema`. String vazia → undefined (padrão existente com preprocess).
- [x] T009 [P] Atualizar `packages/backend/src/validators/eventos.validators.ts`: criar `cifraclubListUrlSchema = z.string().regex(CIFRACLUB_LIST_URL_REGEX, { message: "URL deve seguir o padrão https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/" }).nullable().optional().transform(v => v === '' ? null : v)`. Acrescentar nos schemas `createEventoBodySchema` e `updateEventoBodySchema`.
- [x] T010 Modificar `packages/backend/src/repositories/musicas.repository.ts`: propagar `cifraclub_url` nos métodos `createVersao` e `updateVersao` (adicionar ao `data` do Prisma quando presente no input).
- [x] T011 Modificar `packages/backend/src/services/musicas.service.ts`: propagar `cifraclub_url` no payload passado ao repository. Incluir campo na resposta flatten (método `flattenVersao` ou equivalente).
- [x] T012 Modificar `packages/backend/src/repositories/eventos.repository.ts`: propagar `cifraclub_list_url` e `cifraclub_list_url_updated_at` nos métodos `create` e `update`.
- [x] T013 Modificar `packages/backend/src/services/eventos.service.ts` método `update`: se payload contém `cifraclub_list_url` E valor difere do persistido, setar `cifraclub_list_url_updated_at = new Date()`; se remove (null), setar timestamp null; se omite ou mesmo valor, não tocar. Em `create`, setar timestamp se URL preenchida. Incluir ambos campos na resposta flatten (`formatEventoShow`, `formatEventoIndex`).

**Checkpoint**: Backend aceita/retorna os campos novos em versões e eventos. Libs testadas.

---

## Phase 3: US1 — Cadastrar link CifraClub por versão (P0)

**Goal**: Líder cadastra/edita `cifraclub_url` no formulário de versão.
**Independent Test**: Criar/editar versão com URL CifraClub, salvar, recarregar, confirmar persistência.

- [x] T014 [P] [US1] Criar `packages/frontend/src/lib/cifraclub-key-mapping.ts` espelhando backend: `CHROMATIC_MAP`, `ENHARMONIC_MAP`, `computeKeyFragment`, `applyKeyFragment`. Cópia 1:1 da lógica pura.
- [x] T015 [P] [US1] Atualizar `packages/frontend/src/schemas/musica.ts`: adicionar `cifraclub_url: z.string().nullable().default(null)` ao schema de versão.
- [x] T016 [US1] Modificar `packages/frontend/src/components/VersaoForm.tsx`: adicionar input "Link CifraClub (opcional)" com placeholder `https://www.cifraclub.com.br/artista/musica/`, type="url", `w-full`. Vincular ao campo `cifraclub_url` do form. Posicionar após o campo "Link" existente (`link_versao`).
- [ ] T017 [US1] Smoke: criar versão com URL → salvar → recarregar → campo persiste; limpar → salvar → null; URL `javascript:` → 400.

**Checkpoint**: Líder consegue cadastrar cifra CifraClub por versão.

---

## Phase 4: US2+US3+US4+US5 — Playlist CifraClub com transposição (P0+P1)

**Goal**: Endpoint de playlist + diálogo com lista, copiar e WhatsApp share. URLs enriquecidas com `#key=N`.
**Independent Test**: Abrir escala com músicas com link, ver diálogo com #key=N aplicado, copiar, compartilhar via WhatsApp.

### Backend

- [x] T018 [US2] Criar método `getCifraclubPlaylist(eventoId: string)` em `packages/backend/src/services/eventos.service.ts`: (a) buscar evento com `EVENTO_SHOW_SELECT` via `getById`; (b) para cada música: resolver versão (selecionada → fallback primeira com `cifraclub_url`); (c) obter tom de `musicas.fk_tonalidade → tonalidades.tom`; (d) aplicar `applyKeyFragment(cifraclub_url, tom)`; (e) montar `CifraclubPlaylistItem[]`; (f) calcular stats; (g) incluir `cifraclub_list_url` do evento na resposta.
- [x] T019 [US2] Adicionar handler `getCifraclubPlaylist` em `packages/backend/src/controllers/eventos.controller.ts`: chamar service, retornar 200 com response ou 404.
- [x] T020 [US2] Adicionar rota `GET /:eventoId/cifraclub-playlist` em `packages/backend/src/routes/eventos.routes.ts` com middleware chain `ensureAuthenticated → ensureTenantContext → validateRequest({ params: eventoIdParamSchema }) → controller.getCifraclubPlaylist`.
- [ ] T021 [P] [US2] Estender `packages/backend/tests/services/eventos.service.test.ts`: (a) playlist com 3 músicas (2 com link cifraclub + 1 sem) → stats correto + URLs com #key=N; (b) tom null → url sem fragmento + tomAjustado=false; (c) URL YouTube → sem #key=N; (d) evento não encontrado → AppError 404; (e) tom enarmônico → normalizado.

### Frontend libs

- [x] T022 [P] [US2] Criar `packages/frontend/src/lib/cifraclub-playlist.ts` exportando `formatCifraclubPlaylist(evento, playlist, stats): string` conforme research.md §7. Formato: header bold, subtitle, lista numerada, músicas sem link como `_(sem cifra cadastrada)_`, microcopy final.
- [ ] T023 [P] [US2] Criar `packages/frontend/tests/lib/cifraclub-playlist.test.ts`: (a) formato completo com links, (b) música sem link → placeholder itálico, (c) encoding URL-safe, (d) idempotência.

### Frontend service + hook

- [x] T024 [US2] Adicionar `getCifraclubPlaylist(eventoId: string)` em `packages/frontend/src/services/eventos.ts`: `GET /api/eventos/${eventoId}/cifraclub-playlist`.
- [x] T025 [US2] Adicionar hook `useCifraclubPlaylist(eventoId: string)` em `packages/frontend/src/hooks/use-eventos.ts`: React Query com queryKey `['eventos', eventoId, 'cifraclub-playlist']`, enabled quando eventoId truthy.

### Frontend component

- [x] T026 [US2] Criar `packages/frontend/src/components/CifraclubPlaylistDialog.tsx`: (a) Dialog shadcn com DialogTrigger (botão Guitar icon + "CifraClub" label desktop, icon-only mobile); (b) Header: título "Playlist CifraClub" + subtitle evento.descricao + data formatada pt-BR; (c) Badge stats "X de Y músicas com cifra" (ou "Nenhuma música possui cifra" se 0); (d) Lista `<ol>` com cada item: `ordem · Nome (tom_final) — Artista` + botão "Abrir" (ExternalLink icon, `target="_blank"`, renderizado somente se `isSafeUrl(cifraclub_url)` — importar de `lib/utils.ts`) se URL; sem URL → texto cinza itálico "Sem link CifraClub" + badge "tom não ajustado" quando `tom_ajustado=false`; (e) Footer 4 botões: "Copiar links" (clipboard + Check icon 3s), "WhatsApp" (playlist), slot para "Lista no CifraClub" (implementado em Phase 5), "Fechar"; (f) "Copiar" usa `formatCifraclubPlaylist`→clipboard + toast sonner sucesso; (g) "WhatsApp" verifica `WHATSAPP_URL_SAFE_LIMIT` (importar de `EscalaShareActions` ou duplicar constante) → se excede: toast erro + clipboard fallback; senão: `window.open(wa.me/...)`. (h) Botões disabled quando `stats.com_link === 0`. **Mobile-first**: footer `flex-col sm:flex-row`, nomes com `truncate min-w-0`, diálogo `max-h-[80vh] overflow-y-auto`.
- [x] T027 [US2] Modificar `packages/frontend/src/components/EventoDetail.tsx`: adicionar `<CifraclubPlaylistDialog>` na barra de ações do header, entre `EscalaShareActions` e o botão "Excluir". Sempre visível (botão habilitado independente de ter links). Passar `eventoId` como prop.
- [ ] T028 [US2] Smoke: abrir escala com músicas com/sem link → diálogo mostra lista correta com #key=N → "Copiar" funciona → "WhatsApp" abre wa.me → ações disabled quando 0 links.

**Checkpoint**: MVP funcional — cadastro de links + playlist + share. Valor entregue ao usuário.

---

## Phase 5: US6+US7 — Lista pública por Evento + share dedicado (P1)

**Goal**: Líder cadastra URL de lista CifraClub no Evento + botão "Lista no CifraClub" no diálogo.
**Independent Test**: Cadastrar URL → preview aparece → salvar → botão "Lista no CifraClub" aparece no diálogo → share abre wa.me com link único.

### Frontend libs

- [x] T029 [P] [US6] Criar `packages/frontend/src/lib/cifraclub-list-url.ts` espelhando backend: `CIFRACLUB_LIST_URL_REGEX`, `validateCifraclubListUrl`, e nova função `fetchListPreview(url: string, signal: AbortSignal): Promise<ListPreview | null>` (fetch `api.cifraclub.com.br/v3/songbook/{listId}`, timeout 3s, qualquer erro → null, listas-sistema → null).
- [ ] T030 [P] [US6] Criar `packages/frontend/tests/lib/cifraclub-list-url.test.ts`: regex + fetch mock (200 → preview, 404 → null, timeout → null, sistema → null).
- [x] T031 [P] [US7] Criar `packages/frontend/src/lib/cifraclub-list-share.ts` exportando `formatCifraclubListShare(evento: { tipo_evento: string; data: string; cifraclub_list_url: string }): string` conforme research.md §8.
- [ ] T032 [P] [US7] Criar `packages/frontend/tests/lib/cifraclub-list-share.test.ts`: formato correto, encoding, idempotência.

### Frontend form + schema

- [x] T033 [US6] Atualizar `packages/frontend/src/schemas/evento.ts`: adicionar `cifraclub_list_url: z.string().nullable().default(null)`, `cifraclub_list_url_updated_at: z.string().nullable().default(null)`, `cifraclub_list_url_stale: z.boolean().default(false)`. Marcar `.optional()` defensivamente.
- [x] T034 [US6] Modificar `packages/frontend/src/services/eventos.ts`: passar `cifraclub_list_url` nos payloads create/update (string vazia → null antes de enviar).
- [x] T035 [US6] Modificar `packages/frontend/src/components/EventoForm.tsx`: (a) novo input "Lista no CifraClub (opcional)" com placeholder URL, type="url", `w-full`; (b) validação inline via `validateCifraclubListUrl` ao blur; (c) preview debounced (500ms) com `fetchListPreview` + AbortController cancelando anterior; (d) preview mostra "Lista: **{name}** · por {owner} · {totalSongs} músicas · pública/privada"; (e) quando `isSystemList`: texto fixo "Lista do sistema — preview indisponível"; (f) quando `preview.isPublic === false`: warning "⚠ Lista não marcada como pública"; (g) **RBAC guard**: `useCan('escalas.write')` → se false, `<Input disabled>` + tooltip "Sem permissão". **Mobile-first**: input `w-full`, preview empilha.

### Dialog integration

- [x] T036 [US7] Modificar `packages/frontend/src/components/CifraclubPlaylistDialog.tsx`: no footer, adicionar botão "Lista no CifraClub" (ícone ListMusic, visível somente quando `cifraclub_list_url` não-null no response da playlist). onClick: `formatCifraclubListShare` → verificar `WHATSAPP_URL_SAFE_LIMIT` → abrir wa.me ou toast+clipboard. Quando URL ausente: renderizar link discreto "Cadastrar URL da lista CifraClub" que fecha diálogo e foca no campo no EventoForm.
- [ ] T037 [US6] Smoke: cadastrar URL → preview → salvar → reload → persiste; editar para vazio → null; URL inválida → erro; sem permissão → disabled.

**Checkpoint**: Líder cadastra lista + compartilha link único.

---

## Phase 6: US8 — Botão "Abrir lista no CifraClub" no header (P2)

**Goal**: Atalho direto para abrir a lista sem abrir o diálogo.
**Independent Test**: Escala com URL cadastrada → botão visível no header → click abre em nova aba.

- [x] T038 [US8] Modificar `packages/frontend/src/components/EventoDetail.tsx`: adicionar botão "Abrir lista no CifraClub" no header, renderizado **somente** quando `evento.cifraclub_list_url` não-null. Desktop: ícone `ListMusic` + label; Mobile: icon-only com `aria-label`. `<a href={url} target="_blank" rel="noopener noreferrer">` wrapping Button. Posicionar após o botão CifraclubPlaylistDialog.
- [ ] T039 [P] [US8] Criar/estender `packages/frontend/tests/components/EventoDetail.test.tsx`: (a) botão aparece quando URL cadastrada, (b) botão NÃO aparece quando null, (c) atributos target/rel corretos.
- [ ] T040 [US8] Smoke: escala com URL → botão visível → click abre lista no CifraClub.

**Checkpoint**: Músico acessa lista direto do header.

---

## Phase 7: US9 — Aviso "Lista possivelmente desatualizada" (P2)

**Goal**: Detectar quando músicas foram editadas após o cadastro da URL e sinalizar.
**Independent Test**: Cadastrar URL → editar músicas → recarregar → aviso aparece.

- [x] T041 [US9] Modificar `packages/backend/src/services/eventos.service.ts` método `getById` (ou `formatEventoShow`): após montar o response, computar `cifraclub_list_url_stale` usando lógica: `cifraclub_list_url != null && cifraclub_list_url_updated_at != null && latestMusicaUpdatedAt > cifraclub_list_url_updated_at`. Obter `latestMusicaUpdatedAt` do `Eventos_Musicas` já incluído no select (adicionar `orderBy: { updated_at: 'desc' }, take: 1` se não estiver). Mesclar boolean na resposta.
- [ ] T042 [P] [US9] Estender `packages/backend/tests/services/eventos.service.test.ts`: (a) sem URL → stale=false, (b) URL + sem músicas → stale=false, (c) URL em T0 + música editada em T0+1h → stale=true, (d) URL em T0 + música editada em T0-1h → stale=false.
- [x] T043 [US9] Modificar `packages/frontend/src/components/EventoDetail.tsx`: quando `evento.cifraclub_list_url_stale === true`, renderizar Alert shadcn: ícone ⚠, texto "Lista possivelmente desatualizada — última edição de músicas em {data pt-BR}", link "Atualizar no CifraClub" com `<a href={cifraclub_list_url} target="_blank">`. **Mobile-first**: alert full-width, texto quebra.
- [ ] T044 [US9] Smoke: cadastrar URL → editar músicas → reload → aviso aparece → re-salvar URL → aviso some.

**Checkpoint**: Todas as 9 user stories implementadas.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, regressão, housekeeping.

- [x] T045 [P] Atualizar `packages/backend/docs/openapi.json` aplicando o patch em `specs/025-cifraclub-integration/contracts/cifraclub-playlist.openapi.json`. Adicionar: cifraclub_url em versão, novo endpoint cifraclub-playlist, cifraclub_list_url em eventos. Validar JSON parsing.
- [x] T046 [P] Atualizar `README.md`: na seção de Funcionalidades, mencionar "Integração CifraClub: playlist exportável com transposição automática, link de lista pública por escala".
- [x] T047 Rodar `cd packages/backend && npm test` — confirmar 100% verde + novos testes.
- [x] T048 Rodar `cd packages/frontend && npm test` — confirmar 100% verde + novos testes.
- [x] T049 Rodar typechecks: `packages/backend npm run typecheck` e `packages/frontend npm run typecheck` — zero erros.
- [ ] T050 [P] Executar quickstart.md Cenários 1–7 como gate final. Documentar resultado.
- [ ] T051 Revisar `git diff --stat origin/master...HEAD` e confirmar delta esperado: 2 migrações + ~6 arquivos novos backend + ~8 arquivos novos frontend + ~10 arquivos modificados.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001 e T002 devem completar antes de Phase 2.
- **Phase 2 (Foundational)**: T003-T006 (libs) são paralelos. T007-T013 (types→validators→repos→services) são sequenciais.
- **Phase 3 (US1)**: depende de Phase 2 completa. T014/T015 paralelos. T016 → T017 sequencial.
- **Phase 4 (US2+US3+US4+US5)**: depende de Phase 2 + Phase 3 (precisa do campo existir para a playlist funcionar). T018-T020 sequenciais (service→controller→route). T021-T023 paralelos (testes+libs). T24-T28 sequenciais.
- **Phase 5 (US6+US7)**: depende de Phase 2 (precisa da regex + timestamp). Pode rodar em paralelo com Phase 4 se houver 2 devs. T029-T032 paralelos. T033-T037 sequenciais.
- **Phase 6 (US8)**: depende de Phase 5 (precisa do campo `cifraclub_list_url` no response).
- **Phase 7 (US9)**: depende de Phase 5 (precisa do timestamp).
- **Phase 8 (Polish)**: depende de todas as fases anteriores.

### Parallel Opportunities

- T003 / T004 / T005 / T006 [P] — 4 libs+testes em arquivos distintos
- T014 / T015 [P] — frontend lib + schema
- T021 / T022 / T023 [P] — testes backend + libs frontend
- T029 / T030 / T031 / T032 [P] — 4 libs+testes frontend
- T045 / T046 [P] — docs em arquivos distintos
- T047 / T048 [P] — test suites em terminais paralelos

---

## Implementation Strategy

### MVP First (Phase 1–4)

1. Phase 1 (Setup) — migrações.
2. Phase 2 (Foundational) — backend completo.
3. Phase 3 (US1) — cadastro de cifra por versão.
4. Phase 4 (US2+US3+US4+US5) — playlist + share + transposição.
**MVP completo**: líder cadastra links, gera playlist com transposição, compartilha.

### Incremental Delivery

1. MVP (Phases 1-4) → valor principal entregue.
2. + Phase 5 (US6+US7) → link único de lista.
3. + Phase 6+7 (US8+US9) → atalho + staleness.
4. + Phase 8 (Polish) → docs, merge.

### Estimate

Solo dev: ~15h efetivas (Setup ~1h, Foundational ~3h, US1 ~1.5h, US2-5 ~4h, US6-7 ~3h, US8-9 ~1.5h, Polish ~1h).
