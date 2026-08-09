# Kaizen Log — LouvorFlow

Registro de melhorias contínuas. Toda entrada tem: o que melhorou, o que aprendemos, o que virou padrão.

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
