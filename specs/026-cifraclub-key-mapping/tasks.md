---

description: "Task list for feature 026-cifraclub-key-mapping"
---

# Tasks: Mapeamento de Tom LouvorFlow → Fragmento `#key=N` do CifraClub

**Input**: Design documents from `specs/026-cifraclub-key-mapping/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cifraclub-playlist.openapi.json, quickstart.md
**Stack** (per plan.md): TypeScript 5.9 backend (Express 5.1, Prisma 6.19, Zod) + React 18 frontend (Vite, TailwindCSS, shadcn/ui, React Query); Vitest 4. Monorepo `packages/backend` + `packages/frontend`.

**Tests**: Required per CLAUDE.md (dev-workflow §3 smoke test + project convention) and research.md §8. Tests are written before/alongside implementation within each story.

**Organization**: Tasks grouped by user story (US1 P1 = MVP, US2 P2, US3 P2). Each story is independently testable per spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependencies)
- **[Story]**: User story label (US1, US2, US3)
- File paths are absolute or repo-root-relative

---

## Phase 1: Setup (Pré-requisitos operacionais)

**Purpose**: Validar pré-condições antes de qualquer código. Estas tasks NÃO geram código, mas são bloqueantes.

- [ ] T001 Confirmar que a feature 025 (`cifraclub-playlist-integration`) está implementada e mergeada em master. Verificar com `grep -E 'cifraclub_url' packages/backend/prisma/schema.prisma` (deve retornar a coluna) e `grep -E 'cifraclub-playlist' packages/backend/src/routes/eventos.routes.ts` (deve retornar a rota). Se ausente, **PARAR** — implementar 025 primeiro num PR separado conforme decisão em `specs/026-cifraclub-key-mapping/research.md` §1, depois rebasear esta branch.
- [ ] T002 [P] Check confirmatório rápido (~5 min) — validar 3 URLs `#key=N` no navegador conforme `specs/026-cifraclub-key-mapping/quickstart.md` §1. **A tabela H2 (A=0..Ab=11) já está empiricamente validada** pelos dados públicos do próprio CifraClub (`api.cifraclub.com.br/v3/songbook/{id}`: `C→key=3`, `G→key=10`, `Am→key=0`) durante a investigação Playwright de 2026-05-17 (referência: `specs/025-cifraclub-playlist-integration/prd.md` §16.2.7 e §16.6). Esta task é **não-bloqueante** e serve apenas como verificação visual final antes do merge — pode rodar em paralelo com a implementação.
- [ ] T003 [P] Pull do branch develop e rebase desta branch (`026-cifraclub-key-mapping`) sobre o último commit, garantindo que 025 está incorporada.

**Checkpoint**: T001 verde (025 mergeada). T002 já não bloqueia — H2 está pré-confirmada via API pública do CifraClub. T003 garante base atualizada. Avançar para Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Setup compartilhado entre todas as user stories desta feature.

**Nota**: Como toda a "fundação" desta feature está na 025 (já consumida via T001), esta fase é minimalista — apenas a função pura de transformação que servirá tanto à backend (US1) quanto, indiretamente, ao frontend (US2 lê o resultado dela via API).

- [ ] T004 [P] Criar `packages/backend/src/lib/cifraclub-key.ts` com a estrutura inicial (sem implementação ainda): exportar tipos `CifraclubKeyResult = { key: number | null; canonical: string | null }` e assinaturas vazias de `toCifraclubKey(tom: string | null | undefined): CifraclubKeyResult` e `applyKeyFragment(url: string | null, tom: string | null | undefined): { url: string | null; tom_final: string | null; tom_ajustado: boolean }`. Adicionar docstrings JSDoc em PT-BR conforme CLAUDE.md.

**Checkpoint**: arquivo de lib criado vazio, importável de outros módulos. User stories podem agora começar.

---

## Phase 3: User Story 1 — Músico abre cifra já no tom da escala (Priority: P1) 🎯 MVP

**Goal**: Backend gera `cifraclub_url` final contendo `#key=N` calculado a partir do tom da Música; campo `tom_final` e `tom_ajustado` expostos no JSON.

**Independent Test**: cadastrar uma versão com `cifraclub_url`, definir `Musicas.fk_tonalidade` para um tom conhecido (ex: "A"), chamar `GET /api/eventos/:id/cifraclub-playlist` e confirmar que o item retorna `cifraclub_url` terminando em `#key=0`, `tom_final="A"`, `tom_ajustado=true`. Confirmação visual da cifra abrindo no tom certo no celular fecha o ciclo (spec US-1 AC-1).

### Tests for User Story 1 (write first, ensure they fail)

- [ ] T005 [P] [US1] Criar `packages/backend/tests/lib/cifraclub-key.test.ts` cobrindo `toCifraclubKey`: (a) 12 tons base canônicos do CifraClub (`A` … `Ab` → 0..11), (b) enarmônicos (`A#`/`Bb` → 1; `Gb`/`F#` → 9; `C#`/`Db` → 4; `D#`/`Eb` → 6; `G#`/`Ab` → 11), (c) modal (`Am` → 0, `Bbm` → 1, `F#m7` → 9), (d) baixo invertido (`C/G` → 3), (e) Unicode (`F♯` → 9, `B♭` → 1), (f) whitespace + case (`"  e  "` → 7), (g) inválidos (`""`, `null`, `undefined`, `"X"`, `"123"` → `{ key: null, canonical: null }`). Tabela exaustiva; cada caso com docstring JSDoc PT-BR. **Rodar e confirmar que todos falham** (lib ainda vazia).
- [ ] T006 [P] [US1] Estender `packages/backend/tests/lib/cifraclub-key.test.ts` (mesmo arquivo do T005, seção `describe('applyKeyFragment')`) cobrindo: (a) URL válida + tom válido → URL com `#key=N` substituindo qualquer fragmento existente, `tom_ajustado=true`; (b) URL válida + tom inválido → URL inalterada, `tom_ajustado=false`; (c) URL `null` + tom válido → `{ url: null, tom_final: "A", tom_ajustado: false }`; (d) URL com query string (`?utm=x`) → query preservada, fragmento substituído (Q2); (e) URL com fragmento original (`#letras`, `#key=3`) → substituído; (f) URL malformada (`"://broken"`) → URL devolvida sem alteração + `tom_ajustado=false`, sem throw; (g) idempotência: 2 chamadas com mesmo input → output byte-idêntico. **Rodar e confirmar falha.**
- [ ] T007 [US1] Estender `packages/backend/tests/services/eventos.service.test.ts` (arquivo já criado pela 025) com novos cenários para `getCifraclubPlaylist`: (a) escala com música tom="A" + cifraclub_url cadastrado → item com `tom_ajustado=true` e URL+`#key=0`; (b) escala com música tom=null + URL cadastrada → item com `tom_ajustado=false`, URL original; (c) escala com música tom="Em" + sem URL → item com `tom_final="E"`, `tom_ajustado=false`, `cifraclub_url=null`; (d) escala com música tom="A#m" + URL → `tom_final="Bb"` (canonicalização Q4), `#key=1`. Usar fakes existentes da 025. **Rodar e confirmar falha** nos cenários que checam os novos campos.

### Implementation for User Story 1

- [ ] T008 [US1] Implementar `toCifraclubKey` em `packages/backend/src/lib/cifraclub-key.ts` conforme `specs/026-cifraclub-key-mapping/research.md` §3 e §4: constante `CIFRACLUB_KEY_MAP` (Record<string, number>), constante `CIFRACLUB_KEY_LABEL` (readonly string[12]), pipeline de normalização (trim → Unicode → uppercase letra raiz → regex `^([A-G])([#b])?` → lookup → label canônico). Função pura, nunca lança. Docstring JSDoc PT-BR. Rodar T005 e confirmar verde.
- [ ] T009 [US1] Implementar `applyKeyFragment` em `packages/backend/src/lib/cifraclub-key.ts`: usa `new URL(...)` nativa do Node 18+, try/catch para URL malformada → retorna original. Substitui `.hash` por `#key=${N}` apenas quando `N !== null`. Devolve `{ url, tom_final, tom_ajustado }`. Docstring JSDoc PT-BR. Rodar T006 e confirmar verde.
- [ ] T010 [US1] Atualizar `packages/backend/src/types/index.ts`: estender o tipo de item da playlist (introduzido pela 025) com `tom_final: string | null` e `tom_ajustado: boolean`. Manter ordenação de campos consistente com a 025. Docstring JSDoc PT-BR atualizada para cada novo campo.
- [ ] T011 [US1] Modificar `packages/backend/src/services/eventos.service.ts` método `getCifraclubPlaylist`: para cada item da playlist, importar `applyKeyFragment` de `../lib/cifraclub-key`, chamar com `(item.cifraclub_url, item.musica.tonalidade?.tom)`, mesclar o resultado no objeto retornado. Não mexer em outros métodos. Docstring JSDoc PT-BR no método atualizada. Rodar T007 e confirmar verde.
- [ ] T012 [US1] Atualizar `packages/backend/docs/openapi.json`: aplicar o patch documentado em `specs/026-cifraclub-key-mapping/contracts/cifraclub-playlist.openapi.json` no schema `CifraclubPlaylistItem` (adicionar `tom_final` e `tom_ajustado` com enums e descrições). Validar JSON com `npx --no-install ajv validate -s docs/openapi.json -d docs/openapi.json` (ou equivalente) ou apenas `Get-Content openapi.json | ConvertFrom-Json`.
- [ ] T013 [US1] Rodar smoke test via API descrito em `specs/026-cifraclub-key-mapping/quickstart.md` §2 passos 1–5 (backend rodando, dados de teste populados, hit no endpoint, verificar JSON). Documentar resultado no PR description. Reiniciar o processo `tsx watch` se necessário per `.claude/rules/dev-workflow.md` §1.

**Checkpoint**: backend de US1 completo. Endpoint retorna URL final transposta + tom_final + tom_ajustado. UI ainda mostra apenas o comportamento da 025 (sem badge), mas o link compartilhado por WhatsApp/Copiar já abre no tom certo (US-1 funcional fim-a-fim, validado).

---

## Phase 4: User Story 2 — Líder vê o tom que será entregue (Priority: P2)

**Goal**: UI da Playlist CifraClub expõe `tom_final` por item (badge) e sinaliza visualmente os itens onde `tom_ajustado=false`. Auto-recompute ao trocar o tom da música no escala (via React Query cache invalidation).

**Independent Test**: abrir o diálogo da Playlist CifraClub para uma escala com mix de itens (tom válido + URL, tom válido sem URL, tom inválido com URL); cada item mostra badge `tom_final` quando aplicável e indicador "tom não ajustado" quando flag é `false`. Ao mudar o tom da música em outra aba/refresh, o diálogo reflete sem reload manual (spec US-2 AC-3).

### Tests for User Story 2

- [ ] T014 [P] [US2] Atualizar `packages/frontend/src/schemas/cifraclub.ts` (criado pela 025) — adicionar `tom_final: z.string().nullable()` e `tom_ajustado: z.boolean()` ao schema do item. Defensivamente aceitar ausência com `.default(null)` e `.default(false)` para compatibilidade com backend pré-026. Atualizar tipos derivados.
- [ ] T015 [P] [US2] Criar/estender `packages/frontend/src/tests/lib/cifraclub-playlist.test.ts` (criado pela 025) com casos: (a) formatter do WhatsApp usa `cifraclub_url` final do response (já com `#key=N`) tal como vem — não recalcula; (b) item com `tom_ajustado=false` aparece com sufixo " _(tom não ajustado)_" no texto; (c) badge text helper devolve `tom_final` quando não-null, vazio quando null. **Rodar e confirmar falha.**

### Implementation for User Story 2

- [ ] T016 [US2] Modificar `packages/frontend/src/components/CifraclubPlaylistDialog.tsx`: por item, adicionar badge inline `<Badge variant="secondary" className="ml-2">🎚 {tom_final}</Badge>` quando `tom_final` não-null. Quando `tom_ajustado === false` AND `cifraclub_url !== null`, adicionar pequeno texto cinza `tom não ajustado` com `<Tooltip>` explicando "Não foi possível ajustar o tom desta cifra automaticamente; abrirá no tom original do CifraClub". Manter o resto do layout intacto (princípio: aditivo, sem regressão). **Mobile-first**: garantir que o badge não cause overflow horizontal em viewport 360px (uso de `truncate min-w-0` no container do nome).
- [ ] T017 [US2] Modificar `packages/frontend/src/lib/cifraclub-playlist.ts` formatter de texto WhatsApp/clipboard: usar a `cifraclub_url` do response diretamente (não recalcular fragmento), e para itens com `tom_ajustado=false` mas com URL, adicionar `" _(tom não ajustado)_"` após a URL. Itens com `cifraclub_url=null` continuam mostrando `_(sem link CifraClub)_` (comportamento 025).
- [ ] T018 [US2] Rodar `cd packages/frontend; npm test -- cifraclub-playlist` e confirmar todos os testes verdes (T015).
- [ ] T019 [US2] Verificar visualmente a UI no navegador conforme `specs/026-cifraclub-key-mapping/quickstart.md` §2 passo 6 (resize para 360×740 e 1024×768 — Mobile-First regra do CLAUDE.md). Capturar screenshot mobile + desktop e anexar ao PR.

**Checkpoint**: UI completa. Líder visualiza tom efetivo por item e identifica itens problemáticos com 1 olhar.

---

## Phase 5: User Story 3 — Validação em dispositivo real (Priority: P2)

**Goal**: Confirmar que `#key=N` é honrado pelo app oficial CifraClub (iOS + Android) e pelo web reader; nenhum onboarding adicional para o músico.

**Independent Test**: tocar 3 links com `#key=N` diferente em um celular real (sem PRO, sem login no CifraClub) e confirmar que a cifra aparece já no tom esperado (spec US-3 AC-1 e AC-2). Esta task é puramente validação manual — sem código novo.

### Implementation for User Story 3

- [ ] T020 [US3] Executar `specs/026-cifraclub-key-mapping/quickstart.md` §2 passo 7 (WhatsApp share) em pelo menos 1 dispositivo Android com app CifraClub instalado E 1 dispositivo iOS com app CifraClub instalado. Para cada device, abrir 3 links da playlist via mensagem WhatsApp real e confirmar visualmente que a cifra abre no tom esperado. Documentar resultado (✅/❌ por device + screenshot ou nota textual) no PR description.
- [ ] T021 [US3] Adicional: abrir os mesmos links em navegador desktop (sem o app instalado/redirect bloqueado) e confirmar que o web reader respeita o fragmento. Documentar no PR.

**Checkpoint**: Todas as 3 user stories independentemente verificáveis.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: documentação, regressão final e housekeeping conforme CLAUDE.md "Finalização de Tasks".

- [ ] T022 [P] Atualizar `README.md` na raiz: na seção de Funcionalidades / Escalas, mencionar que "a Playlist CifraClub agora abre cada cifra já no tom selecionado para a escala via parâmetro `#key=N`". Frase única, sem detalhe técnico (target: usuário final / contribuidor novo).
- [ ] T023 [P] Atualizar `.claude/rules/backend-api.md` se a feature introduz padrão novo de "função pura sem I/O em `src/lib/`" — adicionar bullet curto referenciando `cifraclub-key.ts` como exemplo canônico. Se a regra já existir, não duplicar.
- [ ] T024 [P] Atualizar `MEMORY.md` (em `C:\Users\pc_admin\.claude\projects\C--Users-pc-admin-source-repos-LouvorFlow\memory\`): no bloco "Key Patterns", adicionar bullet sobre 026 — "`cifraclub-key.ts` gera `#key=N` (tabela cromática absoluta A=0..Ab=11) e é chamado dentro de `getCifraclubPlaylist` para enriquecer cada item com `tom_final` + `tom_ajustado`. Sem schema novo."
- [ ] T025 Rodar `cd packages/backend; npm test` — confirmar **100% dos testes anteriores da 025 passam** (SC-006 da spec) + os novos testes da 026 verdes. Sem regressões.
- [ ] T026 Rodar `cd packages/frontend; npm test` — idem, sem regressões.
- [ ] T027 Rodar `cd packages/backend; npm run typecheck` (ou equivalente Sucrase + tsc --noEmit) e `cd packages/frontend; npm run typecheck` — confirmar zero erros.
- [ ] T028 [P] Executar `specs/026-cifraclub-key-mapping/quickstart.md` §2 passos 1–8 completos (re-rodar como gate final de PR). Anexar resultado ao PR description.
- [ ] T029 Revisar arquivos modificados/criados com `git diff --stat origin/master...HEAD` e confirmar que coincidem com a Source Code section do `plan.md` (delta esperado: 1 arquivo novo backend + 1 teste novo backend + 3-4 arquivos modificados backend + 2-3 arquivos modificados frontend + 1 doc atualizada). Nenhuma migration Prisma. Nenhum schema change.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: nenhuma dependência. T001 é o único gate rígido — se 025 não estiver mergeada, o resto está bloqueado. T002 é check confirmatório paralelo (não bloqueia). T003 só roda após T001 verde.
- **Foundational (Phase 2)**: depende de Phase 1 completa. T004 só precisa do repo na branch correta.
- **User Stories (Phase 3+)**: dependem de Phase 2.
  - US1 (P1, MVP) é o coração e deve ser implementada primeiro.
  - US2 e US3 podem rodar em paralelo após US1, mas US2 depende dos campos `tom_final`/`tom_ajustado` existirem na resposta JSON (entregues por T010 + T011).
- **Polish (Phase 6)**: depende de todas as US fechadas.

### User Story Dependencies

- **US1**: independente. Entrega o MVP funcional (link já abre no tom certo via WhatsApp).
- **US2**: depende de US1 (precisa dos novos campos no response). Independentemente testável dentro do diálogo.
- **US3**: depende de US1 (precisa de URLs com `#key=N` para validar). Independentemente testável via celular real.

### Within Each User Story

- Tests escritos antes da implementação (T005/T006/T007 antes de T008/T009/T011; T015 antes de T016/T017).
- Lib pura antes do service (T008/T009 antes de T011).
- Service antes do controller (já existe da 025; só consome o service).
- Tipos antes do uso (T010 antes de T011).
- Docs depois da impl (T012 OpenAPI fica no fim da US1; T022/T023/T024 ficam em Phase 6).

### Parallel Opportunities

- T005 e T006 [P] — mesmo arquivo, mas suítes `describe` distintas; podem ser escritas em paralelo por 1 dev e revisadas juntas.
- T014 e T015 [P] — frontend Zod e teste em arquivos diferentes.
- T022 / T023 / T024 [P] — docs em arquivos diferentes (README, regras backend, MEMORY).
- T025 / T026 são independentes (backend e frontend); podem rodar em paralelo se 2 terminais.

---

## Parallel Example: User Story 1

```bash
# Janela 1 — Escrever testes em paralelo
Task: "T005 — escrever cifraclub-key.test.ts seção toCifraclubKey"
Task: "T006 — escrever cifraclub-key.test.ts seção applyKeyFragment"

# Após T005+T006, implementação sequencial
Task: "T008 — implementar toCifraclubKey"
Task: "T009 — implementar applyKeyFragment"
# Depois rodar T005+T006 → confirmar verde

# Em paralelo com T010-T011
Task: "T012 — atualizar OpenAPI"
```

---

## Implementation Strategy

### MVP First (US1 apenas)

1. Completar Phase 1 (Setup) — gates T001+T002.
2. Completar Phase 2 (Foundational) — T004.
3. Completar Phase 3 (US1) — backend completo, endpoint entregando URL com `#key=N`.
4. **STOP & VALIDATE**: rodar T013 (smoke via API). Se passar, o MVP já entrega valor isolado (WhatsApp leva o músico para o tom certo) — pode ser merged como PR `feat/026-mvp-backend` antes da UI ficar pronta, se a equipe preferir releases menores.

### Incremental Delivery

1. Setup + Foundational + US1 → MVP backend (URL com `#key=N` no WhatsApp).
2. + US2 → UI mostra badge + indicador (líder enxerga e confia).
3. + US3 → validação em celular real (consolida a confiança).
4. + Polish → docs, regressão, merge final.

### Recommended Team Strategy

Solo dev (caso provável): sequencial Phase 1 → 2 → 3 → 4 → 5 → 6. Estimativa: ~6h de trabalho efetivo (lib + tests ~2h, service+endpoint ~1h, UI ~1.5h, docs+QA ~1.5h).

Dual dev: enquanto Dev A faz US1 (backend), Dev B prepara T014/T015 (frontend tests) e mocka response para começar T016. Sincronizam após T010/T011.

---

## Notes

- **[P] tasks** = arquivos diferentes, sem dependências bloqueantes pendentes.
- **[US]** label rastreia traceabilidade até spec e atende princípio "uma user story = um increment testável".
- **TDD-ish**: testes da US escritos antes da impl daquela US (research.md §8 + dev-workflow §3).
- **Commits**: 1 commit por task ou por grupo lógico pequeno. Mensagens em PT-BR seguindo padrão `feat(escalas): ...` ou `test(cifraclub-key): ...` conforme convenção do repo.
- **Stop at any checkpoint** para validar independentemente.
- **Avoid**: mexer no schema Prisma (zero migrações nesta feature); criar nova rota (zero rotas novas — só enriquece o endpoint da 025); adicionar dependências npm (zero).
