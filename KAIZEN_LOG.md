# Kaizen Log — LouvorFlow

Registro de melhorias contínuas. Toda entrada tem: o que melhorou, o que aprendemos, o que virou padrão.

## 2026-08-11 — Auditoria UX (Nielsen): 14 fases, do handoff ao fechamento

- **Tipo:** melhoria
- **Antes:** handoff de design pedia ~20 correções de usabilidade, parte já existente, parte factualmente errada; sem dirty-form guard, sem undo de exclusão, sem tom por evento, sem duplicar escala, sem rascunho; 3 telas com anatomias divergentes da mesma entidade; 4 telas admin fora do padrão responsivo; 5 specs e2e quebrados; bug real de unhandled rejection no CRUD de Configurações.
- **Depois:** 16 commits na `feature/ux-audit-nielsen` cobrindo 14 fases (F0–F15): copy PT-BR do admin, BPM 30–220 em 4 camadas, guard de alterações não salvas (4 saídas interceptadas, Radix + vaul), campos obrigatórios + 5 telas admin no `ResponsiveFormDialog`, undo client-side de 5s, tom por evento (migração + picker), duplicar escala + rascunho (migração + UI), EventoRow unificado, busca/filtros/atalho `/` em Músicas, contador de novas músicas, duplicados case-insensitive. Backend 578/578, frontend 339/339, e2e mobile 31/31, chromium 58 verdes (16 falhas restantes: 2 do seed T031 + 14 de specs sem auth pré-existentes, intocados). Cada fase passou por revisão de spec + revisão de qualidade com re-verificação.
- **Padronizado em:** `.claude/rules/frontend-react.md` (guard sem `!isPending`, formulário único + exceção sem-RHF, dívida a11y dos 4 comboboxes, EventoRow/`tituloDoEvento`, undo com 7 regras, chips removíveis, diálogo de decisão com saída neutra no touch, modo derivado de props), `.claude/rules/backend-api.md` (D7 case-insensitive com dados legados, cópia server-side, status D5, procedimento manual de migração com workaround do rtk, `setMusicaTonalidadeAtomic` nos sentinelas), `packages/backend/docs/openapi.json` (BPM, `/tonalidade`, `/duplicar`, `status`, `novasMusicasNoMes`), `README.md` (features e rotas novas), MEMORY (rate-limit e2e, DELETE ausente no admin, padrão DateTimePicker). Cada arquivo foi aberto e conferido na auditoria da F15 antes de entrar nesta lista; typecheck e branch reconferidos pelo coordenador.

### Desperdícios evitados (cortes conscientes)

- **Superprodução:** a §4 do plano vetou ~10 "correções fantasma" do handoff (toasts que já existiam, modal de convites já pronto, repertório ordenável já implementado, expiração "7 dias" que na verdade é 2h); Artista continuou opcional (D6); rename inline sem checagem de duplicado (lacuna consciente); Songs sem undo (não tem exclusão).
- **Superprocessamento:** undo client-side com `Set` local em vez de soft-delete no backend (D2) e em vez de mutação do cache do React Query; highlight chaveado por nome normalizado em vez de mudar o contrato de `onCreate`.
- **Defeito não andou:** 8 correções de causa raiz feitas dentro do ciclo em vez de viradas dívida — validação nativa engolindo submit (`noValidate`), guard desarmado durante submit in-flight, foco roubado pelo `inert`, corrida do desfazer tardio (hover do sonner), parse morto de P2003, cópia "rasgada" sob Read Committed, relatórios contando rascunhos, erros fantasma de RHF ao reabrir dialog.

### O que aprendemos

- `min`/`max` nativos em `<input type=number>` bloqueiam o submit ANTES do Zod — form compartilhado precisa de `noValidate`.
- O sonner pausa o countdown do toast no hover, mas `setTimeout` não — todo undo por toast precisa de guard de "já confirmou".
- Prisma 6 emite `meta.constraint` no P2003 (não `field_name`) — mocks com o formato errado dão confiança falsa.
- `mode: 'insensitive'` cobre caixa, não acento; `$transaction` multi-leitura precisa de `RepeatableRead` para snapshot consistente.
- `inert` aplicado no mesmo commit que monta um overlay rouba o foco antes de qualquer effect — capturar `activeElement` no EVENTO.
- Tailwind v3 não emite `@layer` nativo — a precedência vem de especificidade de seletor, não de camada.
- A suíte chromium completa é inatingível num run único (rate-limit de login em memória) — rodar em lotes com `touch packages/backend/index.ts`; a solução real (storageState) segue pendente.

## 2026-08-10 — Pedidos da Vanessa: filtros colapsáveis no mobile e ordem alfabética

- **Tipo:** melhoria
- **Antes:** a 360px (Galaxy S8, alvo primário) a página de Músicas abria com 3 chips de intensidade + 9 chips de categoria sempre visíveis no `CardHeader`, empurrando os resultados da busca para fora da tela — o usuário buscava e não via o que achou. Categorias e artistas voltavam da API em ordem de inserção (`findAll` sem `orderBy`), então `/configuracoes`, os comboboxes de `MusicaForm`/`VersaoForm` e os chips de filtro apareciam embaralhados.
- **Depois:** no mobile a busca é a protagonista — os chips vivem atrás de um botão "Filtros" com contador de ativos, num bottom-sheet (`Drawer`) com "Ver resultados" e "Limpar filtros"; no desktop os chips seguem inline, sem mudança. Categorias e artistas saem ordenados A→Z em pt-BR, com acentos junto da letra-base.
- **Padronizado em:** `.claude/rules/frontend-react.md` (regra nº 8 cita `MusicaFiltros.tsx`; nova linha na tabela "Páginas já corrigidas"), `.claude/rules/backend-api.md` (seção "Ordenação de Listas Nomeadas" + diretório `utils/` na árvore), `.claude/rules/dev-workflow.md` (caminhos relativos com subshell, sem caminho de máquina), `packages/backend/docs/openapi.json` (`GET /categorias` e `GET /artistas` com description e example reordenados). Cada arquivo foi aberto e conferido antes de entrar nesta lista.

### Incrementos entregues

| # | Incremento | Verificação |
|---|---|---|
| 0 | `loginAsAdmin` em `musicas.spec.ts` | de 0/5 (todos barrados no login) para 3/5; as 2 restantes falham por seed ausente, não por auth |
| 1 | `jest-dom.d.ts` + `include: ["src","tests"]` + script `typecheck` | `npm run typecheck` de 15 erros para 0; 194 testes seguem verdes; lint sem erro |
| 2 | `helpers/viewport.ts` extraído | `admin-igrejas` mobile 3/3 PASS, comportamento idêntico; typecheck limpo |
| 3 | `MusicaFiltros.tsx` + testes | 8 testes FAIL→PASS (o módulo nem resolvia antes); lint + typecheck |
| 4 | `Songs.tsx` integrado | suíte 202/202; `grep IntensityBars` vazio; verificado a 360px e 1024px |
| 5 | `musicas-filtros.mobile.spec.ts` | 4/4 PASS no projeto `mobile` |
| 6 | `ordenacao.ts` + categorias ordenadas | teste com "Ágape/Abertura" FAIL→PASS; smoke `curl` devolve as 9 categorias A→Z |
| 7 | Artistas ordenados | teste com "Ávine Vinny" FAIL→PASS; smoke `curl` com 3 artistas criados fora de ordem retorna A→Z |

### Desperdícios evitados (cortes conscientes)

- **Superprodução:** nenhuma mudança em repositories, hooks ou schemas; os toggles e o estado de URL de `Songs.tsx` não foram tocados — só a apresentação dos chips. `musicas.repository.ts` não mudou (já ordena no banco por exigência da paginação).
- **Superprocessamento:** a alternância mobile/desktop é por CSS (`sm:hidden`/`hidden sm:block`), não por `useIsMobile()` — aqui o desktop não usa overlay, então não há troca Drawer↔Popover a fazer em JS.
- **Estoque:** cada task virou um commit independente e reversível; reverter a Task 4 restaura o layout antigo sem tocar no backend.
- **Retrabalho:** as 2 falhas de `musicas.spec.ts` (busca por "T031") foram diagnosticadas via API (`?q=T031` devolve 0 itens) e **deixadas em pé** — consertar seed alheio contaminaria o escopo.

### Oportunidades levantadas (fora do escopo, a fazer)

- **A suíte e2e completa é inatingível num único run.** `POST /sessions` tem `rateLimit(max: 10, 15 min)` desde o hardening de segurança, e os ~48 testes chamam `loginAsAdmin` no `beforeEach` — a partir do 10º login tudo responde 429 e falha no `waitForURL`. Specs isolados passam; a suíte inteira, não. Saída natural: `storageState` reaproveitado entre testes (um login por run) — vale um ciclo próprio.
- **6 specs ainda não autenticam**: `dashboard`, `escala-detalhe`, `escalas`, `integrantes`, `musica-detalhe`, `navigation`.
- **Seed de dev não tem a música "T031"** que `musicas.spec.ts` procura em 2 casos.
- **Download do Playwright 1208 trava neste ambiente** (~18 MB de 167 MB, reprodutível em 2 tentativas). Contornado localmente apontando `chromium-1208`/`chromium_headless_shell-1208` por symlink para o build 1228 já presente no cache — workaround de máquina, não versionado.
- **Ordenação de funções, tipos de evento e tonalidades** segue por definir (tonalidades têm ordem musical, não alfabética — decisão de produto).
- **e2e ainda não roda no CI** (`ci-frontend.yml` faz só lint + unitários).

### O que aprendemos

- **Um plano com caminho absoluto de máquina é inexecutável na máquina seguinte.** A causa raiz estava na regra (`dev-workflow.md` prescrevia `/c/Users/...`), não no plano — corrigida aqui para subshell + caminho relativo. E o CWD realmente vaza: um `cd packages/frontend` sem parênteses quebrou o comando seguinte nesta própria sessão.
- **Baseline reportada por outra sessão precisa ser reproduzida antes de virar task.** O plano afirmava que o binário do Playwright estava presente; não estava, e isso custou ~40 min de download travado.
- **A augmentation "canônica" de uma lib pode não valer para a versão instalada.** `import "@testing-library/jest-dom/vitest"` (jest-dom 6.9.1) faz `declare module 'vitest'` sobre `Assertion` — que no **Vitest 4** saiu do módulo `vitest` e vive em `@vitest/expect`, estendendo a interface vazia `Matchers<T>`. O arquivo entrava no `--listFiles` e mesmo assim os 23 erros continuavam: carregar ≠ aplicar. Augmentar `Matchers` resolveu.
- **Expandir um gate revela passivo em cascata.** Corrigir `bpm: '120'` → `120` desmascarou um `TS2739` que o erro anterior escondia: o `tsc` reporta um erro por nó, não todos.
- **`tsx watch` não recarregou de novo.** A API devolvia categorias fora de ordem com o service correto no disco; reiniciar o processo (regra do `dev-workflow.md`) resolveu sem tocar em código. Terceira ocorrência registrada neste log — sintoma de que o watch não é confiável para arquivos novos.

## 2026-08-09 — Integrantes agrupados por função no compartilhamento da escala

- **Tipo:** melhoria
- **Antes:** a seção "👥 Integrantes" da mensagem de WhatsApp saía como lista plana `Nome — Função1, Função2`, ordenada só por nome. Não dava para ver de relance quem ministra, quem dirige e quem toca.
- **Depois:** a seção sai em blocos `Função — Nome`, um por grupo de funções, na ordem que a igreja definir na aba **Grupos** de Configurações. Cinco grupos padrão (Ministração, Direção Musical, Vocal, Instrumentos, Outros) criados por migração para os tenants existentes, com as funções classificadas automaticamente por nome.
- **Padronizado em:** `.claude/rules/backend-api.md` (contagem de modelos e seção "Grupos de funções" descrevendo o recurso com `reorder` e `PUT /:id/funcoes`); `README.md` (funcionalidades e tabela de rotas); `packages/backend/docs/openapi.json` (4 endpoints novos).

### Incrementos entregues

| # | Incremento | Verificação |
|---|---|---|
| 1 | Modelo `Funcoes_Grupos` + `funcoes.fk_grupo` + migração com backfill | `migrate diff` sem drift; 5 grupos/tenant, 13 funções classificadas, 0 sem grupo |
| 2 | Recurso `/api/funcoes-grupos` (CRUD, reorder, setFuncoes) + OpenAPI | 20 testes de service; smoke curl cobrindo 200/400/401/404/409 |
| 3 | Seed de grupos e classificação para tenants novos | Re-seed idempotente (0 alterações); igreja criada via API nasce com os 5 grupos |
| 4 | Schema/service/hooks React Query no frontend | 10 testes de schema; build sem erro de tipo |
| 5 | Formatter agrupado (`formatEscalaWhatsApp(evento, grupos)`) | 20 testes cobrindo todas as regras; saída idêntica ao exemplo pedido |
| 6 | `EscalaShareActions` consumindo os grupos reais | Suíte do frontend verde; botões bloqueados durante o load |
| 7 | Aba "Grupos" em Configurações com dnd-kit | Build e lint limpos; verificação no navegador |
| 8 | E2E, documentação e fechamento | 6 abas no spec; docs sincronizadas |

### Desperdícios evitados (cortes conscientes)

- **Superprodução:** sem `GET /funcoes-grupos/:id` (nenhum consumidor); sem campo de ordem por função dentro do grupo (a ordenação é pelo nome do integrante); agrupamento **não** aplicado ao `EventoDetail` — o pedido era sobre a mensagem compartilhada, e ampliar a tela dobraria o custo de verificação mobile.
- **Superprocessamento:** o padrão de drag-and-drop foi **copiado** de `EventoDetail`, não extraído para um componente genérico — o CLAUDE.md proíbe refatorar sem solicitação, e a abstração prematura acoplaria duas telas que ainda podem divergir.
- **Estoque:** cada incremento entrou como um commit verificado; nada ficou "pronto mas parado".

### Oportunidades levantadas (fora do escopo, a fazer)

- **8 dos 10 specs E2E não autenticam** (`dashboard`, `escalas`, `escala-detalhe`, `integrantes`, `musicas`, `musica-detalhe`, `navigation` e, até este ciclo, `configuracoes`). Eles navegam direto para rotas protegidas, são redirecionados ao login e falham — a suíte está vermelha por construção, não por regressão. Corrigido aqui apenas `configuracoes.spec.ts` (via `loginAsAdmin` em `beforeEach`, o padrão que `auth` e `admin-igrejas` já usam); os demais merecem um ciclo próprio.
- **Binário do Playwright ausente neste ambiente**: `playwright.config.ts` roda headless e o `chromium_headless_shell` da versão 1.58.2 não está baixado (`npx playwright install` baixa uma versão diferente da do projeto — use `./node_modules/.bin/playwright install`).
- **"Direção Musical" não existe em `DEFAULT_FUNCOES`**, então o grupo homônimo nasce vazio em tenants novos. Incluir a função no seed é decisão de produto, não técnica.

### O que aprendemos

- **Allowlist de tenant é invisível e silenciosa.** `forTenant()` (`prisma/cliente.ts`) só filtra modelos listados em `TENANT_MODELS`. Um modelo novo esquecido ali funciona perfeitamente nos testes e vaza dados entre igrejas em produção. **Todo modelo de domínio novo precisa entrar nessa lista no mesmo commit do schema.**
- **Rótulo ≠ artefato, duas vezes nesta sessão.** (1) `tsx watch` do `dev.sh` não recarregou após a criação de arquivos novos: a API respondia 404 na rota que existia no disco. (2) Um servidor de smoke iniciado *antes* de editar o seed testou o seed antigo e "provou" que a feature não funcionava. Em ambos os casos o processo é que estava velho, não o código — conferir a idade do processo antes de acusar o código.
- **`lower()` no Postgres depende da collation.** A auto-classificação por nome só é confiável com acentos porque o banco usa `en_US.utf8`; sob collation `C`, `lower('MINISTRAÇÃO')` não normalizaria os acentos.
- **Desempate de ordenação importa para o teste, não só para o usuário.** Com o mesmo integrante em duas funções, `localeCompare` coloca "Violão" antes de "Vocal" (`i` < `o`). Sem um desempate explícito a saída seria não determinística e o teste ficaria intermitente.
