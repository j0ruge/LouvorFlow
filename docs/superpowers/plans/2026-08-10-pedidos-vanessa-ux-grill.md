# Grill Report — 2026-08-10-pedidos-vanessa-ux

**Data:** 2026-08-10
**Revisor:** Claude Code (Fable, grill-with-docs + kaizen)
**Status:** APROVADO COM CORREÇÕES (correções já aplicadas ao plano)

## Resumo executivo

O plano está **sólido no mérito**: as duas causas raiz foram confirmadas linha a linha no código real, a decisão de ordenar no service (e não no `ORDER BY`) é bem fundamentada e testável com os fakes existentes, os trechos de código propostos batem com os exports/tipos reais do repo (imports, `Drawer`, `INTENSIDADE_OPTIONS`, `handleClickableKeyDown`, fakes, mock-data, openapi.json — tudo conferido), e a ordenação pt-BR esperada nos testes foi validada executando `Intl.Collator('pt-BR')` no Node deste ambiente, com resultado idêntico ao esperado pelo plano.

O que reprova a execução *como estava escrita* são os **gates de verificação**, não o design:

1. 🔴 O plano invoca `npm run typecheck` no frontend em 3 pontos — **esse script não existe** em `packages/frontend/package.json` (e o substituto natural, `npx tsc -p tsconfig.app.json --noEmit`, acusa erros pré-existentes de tipos do jest-dom nos testes). Os steps falhariam com "Missing script".
2. 🔴 A suíte unitária do frontend está **vermelha na baseline**: `tests/unit/components/MusicaDetail.cifraclub-edit.test.tsx` falha deterministicamente com `ReferenceError: React is not defined` (falta `import React`; arquivos sob `tests/unit/` ficam fora do `tsconfig.app.json`, e o esbuild usa o runtime clássico de JSX). Os gates "tudo PASS" das Tasks 2 e 6 eram inatingíveis.

Ambos foram corrigidos no plano (Task 0 nova + comandos ajustados), junto com 3 itens 🟡 (claim falso sobre o lint, precedente jsdom superestimado, expectativa de e2e desktop sem baseline) e 4 itens 🟢 de precisão. Com as correções aplicadas, o plano está **aprovado para execução**.

## Problemas encontrados

| Severidade | # | Item | Arquivo/Linha | Correção |
|---|---|---|---|---|
| 🔴 | 1 | `npm run typecheck` não existe no frontend (invocado em Task 1/S5, Task 2/S5, Task 6/S1) | `packages/frontend/package.json` (scripts: dev, build, lint, preview, test, test:watch, test:e2e) | Steps substituídos por `npm run lint` / `npm run test && npm run lint`; nota adicionada em Global Constraints. `npx tsc -p tsconfig.app.json --noEmit` também não serve de gate: acusa erros pré-existentes (`toBeInTheDocument`/`toHaveAttribute` sem augmentation do jest-dom em `IntensidadeSelector.test.tsx`, `ResponsiveFormDialog.test.tsx`) |
| 🔴 | 2 | Baseline da suíte frontend vermelha — gate "tudo PASS" (Tasks 2 e 6) inatingível | `packages/frontend/tests/unit/components/MusicaDetail.cifraclub-edit.test.tsx:96` — `ReferenceError: React is not defined` (193 passed / 1 failed, determinístico) | Task 0 adicionada ao plano: `import React from "react"` (mesmo padrão do peer que passa, `MusicaVersaoPicker.component.test.tsx:14`), com stop-condition se a falha persistir por outro motivo |
| 🟡 | 3 | Claim falso: "o lint acusaria `IntensityBars` importado sem uso" — não acusaria | `packages/frontend/eslint.config.js:23` (`@typescript-eslint/no-unused-vars: "off"`) + `tsconfig.json` (`noUnusedLocals: false`) | Claim removido do Task 2/S5; substituído por conferência explícita via `grep -n "IntensityBars" src/pages/Songs.tsx` (deve retornar vazio) |
| 🟡 | 4 | Precedente jsdom superestimado: `ResponsiveFormDialog.test.tsx` renderiza o Drawer com `open` controlado e `useIsMobile` mockado — **não** prova abertura via clique no `DrawerTrigger`, que é o que os testes da Task 1 fazem | `packages/frontend/src/components/__tests__/ResponsiveFormDialog.test.tsx:23-39` | Nota da Task 1 reescrita: precedente descrito com precisão + fallback definido (mover casos de abertura para o e2e mobile da Task 3; unitário mantém chips + rótulo/contador do gatilho; **nunca** alterar o componente para servir ao teste) |
| 🟡 | 5 | Expectativa "musicas.spec.ts PASS a 1280px" sem baseline: o spec desktop **não autentica** (nenhum `loginAsAdmin`/`beforeEach`, diferente de `configuracoes.spec.ts` e `admin-igrejas.spec.ts`) — com `ProtectedRoute`, pode estar vermelho hoje por razão alheia ao plano | `packages/frontend/tests/e2e/musicas.spec.ts` (sem login) | Task 3/S2 e Task 6/S4 agora exigem **baseline registrada antes da Task 2** e critério "nenhuma falha nova" (não "zero falhas absolutas"); bullet de baseline adicionado às Notas de Execução |
| 🟢 | 6 | Citação imprecisa: "regra nº 8 do design system" — a regra nº 8 vive em `.claude/rules/frontend-react.md` (Padrões obrigatórios); o design system tem a seção própria de Overlay Pattern | plano, seção Architecture; `system.md:224-232` | Citação corrigida na Architecture (aponta os dois documentos) |
| 🟢 | 7 | "16+ chips": o seed define **9** categorias (`DEFAULT_CATEGORIAS`), não 13 — 12 chips com intensidade no tenant padrão; "13" só vale para tenant com categorias extras | `packages/backend/seeds/domain-defaults.ts:97-107` | Texto ajustado: "3 de intensidade + todas as categorias do tenant (9 no seed padrão, mais as criadas pela igreja)" |
| 🟢 | 8 | Desvio da letra da regra nº 8 ("Detectar com `useIsMobile()`") sem justificativa registrada — o plano usa CSS (`sm:hidden`/`hidden sm:block`) | plano, Architecture + Task 2 | Justificativa explícita adicionada à Architecture (desktop não é overlay, logo não há troca Drawer↔Popover; CSS evita flash do hook; conteúdo do drawer só monta aberto — sem duplicação na árvore de acessibilidade). O desvio é **correto**, só precisava estar documentado para o executor não "corrigir" no meio do caminho |
| 🟢 | 9 | Duplicação conceitual: o frontend já tem comparador pt-BR (`compararNomes`, via `localeCompare`) | `packages/frontend/src/lib/whatsapp-share.ts:38-40` | Sem ação — packages distintos sem pacote shared; registrado aqui como candidato a util compartilhado num futuro pacote comum |

## Avaliação kaizen

### 1. Causa raiz — ✅ CONFIRMADA (verificação independente, linha a linha)

- **Problema 1**: `Songs.tsx:288-369` — o `CardHeader` renderiza incondicionalmente os dois grupos de chips (intensidade em 302-335, categorias em 337-368). Citação do plano (`302-368`) exata. A solução ataca a causa (apresentação sempre-visível), não o sintoma.
- **Problema 2**: `categorias.repository.ts:14-18` e `artistas.repository.ts:4-8` — `findMany` sem `orderBy`, confirmado. `musicas.repository.ts:40` já tem `orderBy: { nome: 'asc' }`, confirmado. A decisão de ordenar no **service** é a certa para este repo: os testes unitários usam fakes (`vi.mock` do repository), então ordenação em `orderBy` seria **invisível à suíte**; e o `Intl.Collator` é imune ao collation do banco. O plano usa `[...array].sort()` (não muta o retorno do fake) — detalhe correto.
- Linhas dos services (`categorias.service.ts:9-15`, `artistas.service.ts:5-7`, import após linha 2), dos testes (`describe('listAll')` em 22-30 e 19-25) e do openapi (`/artistas` linha 166, `/categorias` linha 2878, pares id/nome dos examples): **todas exatas**.

### 2. Incrementos pequenos e reversíveis — ✅ (com Task 0 adicionada)

Cada task tem escopo de 1 commit, critério de verificação e reversão limpa (reverter a Task 2 restaura o layout sem tocar backend; Tasks 4-5 são independentes do bloco frontend). A Task 0 nova (1 linha em arquivo de teste) mantém o padrão. Único senão original: os gates de verificação quebrados (itens 1-2) tornavam o "critério de verificação" de 3 steps inexecutável — corrigido.

### 3. Desperdício (muda) — ✅ enxuto

- **e2e Playwright é justificado, não muda**: `.claude/rules/frontend-react.md` **exige** um `*.mobile.spec.ts` com checagem de overflow para página com layout dual/overlay mobile — o spec da Task 3 é cumprimento de regra do repo, e o projeto `mobile` (Galaxy S8, 360×740) já existe no `playwright.config.ts`.
- **Drawer vs accordion vs scroll horizontal**: o Drawer é a única opção compatível com o design system — `system.md:224-232` lista "filtros" nominalmente no Overlay Pattern e veta conteúdo inline que desloca campos; scroll horizontal é vetado pelas regras mobile. Não é a opção mais barata em código, mas é a mais enxuta **dentro das regras invioláveis do repo**.
- **DRY**: chips existem uma vez (`MusicaFiltrosChips`), consumidos por inline e drawer. Custo residual aceitável: duas instâncias montadas (uma `display:none`) — justificado na Architecture corrigida.
- Nenhuma mudança em repositories, hooks ou schemas; toggles/URL intactos. Sem gold-plating detectado.

### 4. Verificabilidade — ⚠️→✅ (era o ponto fraco; corrigido)

Comandos executados neste grill (read-only):

- `npx vitest run tests/services/categorias.service.test.ts tests/services/artistas.service.test.ts` (backend): **32/32 PASS** — baseline verde; o FAIL esperado no Step 2 das Tasks 4-5 virá só do caso novo. ✅
- `node -e "Intl.Collator('pt-BR')..."`: produz **exatamente** `["Abertura","Adoração","Ágape","Celebração","Natal"]` e `["Aline Barros","Ávine Vinny","Davi Sacer","Fernandinho","Gabriela Rocha"]` — os arrays esperados pelos testes do plano estão corretos, incluindo acentos. ✅
- `npx vitest run` (frontend): **193 passed / 1 failed** — falha pré-existente determinística (item 🔴 2). ❌→ Task 0
- `npm run typecheck` (frontend): **script inexistente** (item 🔴 1). ❌→ comandos substituídos
- Fakes conferidos: `create` insere no mesmo array que `findAll` lê, `reset()` no `beforeEach` garante isolamento, `findByNome` não colide com os nomes novos dos testes (`Ágape`, `Abertura`, `Ávine Vinny`, `Davi Sacer` não existem em `MOCK_CATEGORIAS`/`MOCK_ARTISTAS`). ✅
- Smoke test da Task 6: rota `/api/sessions` confirmada (`app.ts:89`), resposta com `token` para usuário de 1 tenant ativo (admin do seed: o tenant sentinela tem status `system` e não conta como ativo — consistente com o `loginAsAdmin` do e2e, que usa as mesmas credenciais e espera redirect direto a `/`); `limit` de músicas aceita até 100 (`musicas.validators.ts:181`). ✅
- **Não executados** (exigem backend + frontend no ar): e2e Playwright e smoke via curl — anotado; a execução fica para as próprias tasks.

### 5. PDCA/Check — ✅

A Task 6 fecha o ciclo: suítes completas, smoke da API de ponta a ponta, verificação visual nas 3 telas que herdam a ordenação (com o aviso correto do `staleTime` de 5 min — confirmado em `use-categorias.ts`), e2e nos dois projetos, gate de documentação do CLAUDE.md e checagem de collation pós-deploy com **regra de decisão explícita** (`en_US.utf8`/`pt_BR.utf8` → ok; `C`/`POSIX` → follow-up de infra, nunca sort no frontend). Com as correções de baseline (itens 2 e 5), os checks agora são executáveis e o critério "nenhuma falha nova" é honesto.

### 6. Jidoka — ✅ (riscos conhecidos tratados; um estava invisível e foi coberto)

- **Collation/locale C**: tratado duas vezes (decisão de arquitetura da Task 4 + Step 6 pós-deploy da Task 6, com host do runner correto conforme memória do projeto).
- **vaul/Drawer no jsdom**: risco real, agora descrito com precisão e com fallback que não corrompe o componente (item 4).
- **Processo stale**: Task 6 referencia a regra do `dev-workflow.md` (reiniciar antes de mexer em código). ✅
- **Risco que estava invisível**: baseline vermelha (unitária e possivelmente e2e desktop) faria o executor "consertar" coisas fora do escopo no meio do plano — exatamente o anti-padrão que o jidoka evita. Task 0 + critério de baseline resolvem.

## Verificações técnicas adicionais (todas conferidas no repo)

- **Consistência entre tasks**: nomes de arquivos/componentes/props idênticos em todas as menções (`MusicaFiltros.tsx`, `MusicaFiltrosChips`, `MusicaFiltrosDrawer`, `MusicaFiltrosProps`/`MusicaFiltrosDrawerProps`, `compararNomesPtBr`, `ordenacao.ts`). ✅
- **Código real compila**: todos os imports existem com os nomes exatos — `Drawer*` (10 exports em `ui/drawer.tsx:76-87`, todos os 8 usados presentes), `vaul@^0.9.9` instalado, `INTENSIDADE_OPTIONS`/`type Intensidade` (`intensidade-options.ts:12,20`), `IntensityBars` (`IntensidadeSelector.tsx:25`, aceita `bars`/`className`, svg `aria-hidden` — logo os nomes acessíveis "Calma"/"Agitada" dos testes funcionam), `handleClickableKeyDown` (`lib/utils.ts:179`), `SlidersHorizontal` (lucide). Import `.js` e indentação de 4 espaços no backend seguem o padrão dos services existentes. ✅
- **Mobile-first**: classes corretas (`sm:hidden` para o drawer, `hidden sm:block` para chips inline, `w-full` no input, `flex-shrink-0` no botão de filtros, `gap-2 sm:gap-4`); nenhuma largura fixa sem breakpoint. ✅
- **Regras do CLAUDE.md**: docstrings JSDoc PT-BR presentes em 100% do código proposto (inclusive callbacks de teste); openapi.json com steps concretos e reordenação dos examples **verificada como alfabeticamente correta**; nenhum refactor fora do escopo; todos os fenced blocks do plano têm language identifier (MD040). ✅
- **Cobertura de telas**: `Settings`, `MusicaForm`, `VersaoForm`, `MusicaDetail` herdam a ordem via `use-categorias`/`use-artistas` — confirmado por grep que **nenhum** consumidor faz sort próprio de categorias/artistas no cliente (os únicos `.sort()` do frontend são de datas, ordem de grupos e do compartilhamento WhatsApp). A claim "sem mudança de frontend" do Problema 2 é verdadeira. ✅
- **Testes cobrem os cenários**: acentos (Ágape/Ávine, validados no Node), filtros ativos (contador no rótulo + `aria-pressed`), drawer mobile (abertura, limpar, disabled), overflow horizontal (checagem objetiva no e2e). ✅
- **README.md**: sem ocorrências de filtro/categoria como feature — claim do plano correta. ✅

## Open Questions

### 1. Task 0 (conserto do teste quebrado) entra neste pool ou em PR separado?

- O conserto é 1 linha em arquivo de teste, mas é pré-requisito dos gates das Tasks 2 e 6. O plano corrigido o inclui como Task 0 com stop-condition (se a falha persistir após o import, pode ser bug real de `MusicaDetail` no payload `cifraclub_url` — aí é outro pool).
- **Responsável:** JorUge
- **Status:** plano assume Task 0 inclusa; remover se preferir separar.

### 2. Criar script `typecheck` no frontend?

- Hoje não há **nenhum** gate de tipos no frontend (Vite/esbuild não checa; ESLint sem type-aware rules; `tsc` puro acusa erros pré-existentes de tipos do jest-dom em 2 arquivos de teste). Resolver isso (augmentation do jest-dom + script `typecheck`) é débito técnico fora deste escopo.
- **Responsável:** JorUge
- **Status:** aberto (não bloqueia este plano).

### 3. `musicas.spec.ts` desktop sem autenticação — baseline possivelmente vermelha

- O spec navega direto a `/musicas` sem login; com `ProtectedRoute` isso tende a redirecionar para `/login`. Como o e2e não roda no CI, ninguém veria. Se a baseline estiver vermelha, o conserto (adicionar `loginAsAdmin` aos specs antigos) é outro pool.
- **Responsável:** JorUge
- **Status:** aberto — o plano agora só exige "nenhuma falha nova".

### 4. Ordenar também funções, tipos de evento e tonalidades?

- Ficaram fora porque a Vanessa pediu categorias e artistas. Se a inconsistência incomodar (Settings tem outras abas de lista), `compararNomesPtBr` já ficará pronto para reuso em follow-up de 2 linhas por service.
- **Responsável:** Vanessa (priorização) / JorUge
- **Status:** aberto (não bloqueia).
