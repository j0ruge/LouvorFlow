# TODO — Backlog do LouvorFlow

Índice de trabalho identificado e **não** executado. Cada item aponta para onde o
contexto completo está registrado (plano, `KAIZEN_LOG.md` ou regra), para que
nenhuma decisão precise ser redescoberta.

## Planos abertos

| Plano | Estado | Resumo |
|---|---|---|
| [Renovação de sessão: corrida entre abas deixa de ser logout](docs/superpowers/plans/2026-08-11-renovacao-sessao-corrida-entre-abas.md) | Task 0 concluída; **Tasks 1-8 pendentes** | Duas abas que renovam o refresh token ao mesmo tempo derrubam a sessão das duas; 429, 500 e blips de rede apagam credencial válida. Plano autocontido com 8 tasks, testes vermelhos definidos e limitações assumidas. |

As oportunidades levantadas durante esse diagnóstico (BroadcastChannel, Web Locks,
reuse detection no backend, `codigo` estruturado no `/sessions/refresh-token`,
crescimento indefinido de `users_refresh_tokens`) estão na seção
[**Fora de escopo — oportunidades**](docs/superpowers/plans/2026-08-11-renovacao-sessao-corrida-entre-abas.md#fora-de-escopo--oportunidades-para-o-kaizen_logmd--todomd)
do próprio plano.

## Testes end-to-end

Desde 2026-08-12 a suíte roda inteira num único comando (chromium 74/74, mobile
31/31) — ver `KAIZEN_LOG.md`. O que sobrou:

- **e2e não roda no CI** — `ci-frontend.yml` executa lint, typecheck e unitários.
  Subir e2e exige provisionar banco e servidores no workflow **e** definir
  `LOGIN_RATE_LIMIT_MAX` e `TOKEN_EXCHANGE_RATE_LIMIT_MAX` (a suíte estoura os
  limites de produção; ver `.env.example`).
- **Resíduo de execução interrompida deixa o admin multi-tenant.**
  `admin-formularios.spec.ts` vincula usuários a igrejas de teste; se o run for
  morto no meio, o vínculo fica e o login passa a exigir seleção de igreja. O
  helper tolera isso, mas um `globalSetup` varrendo `tenants` com prefixo
  `E2E ` resolveria de vez.

## Sessão e autenticação

- **Login revoga todas as outras sessões do mesmo usuário.**
  `authenticate-user.service` usa `replaceAllByUserId`, então entrar pelo celular
  desloga o notebook. Decisão de produto ainda não discutida — hoje é efeito
  colateral de uma escolha de implementação, não de um requisito.

## Acessibilidade

- **`CreatableCombobox`, `CreatableMultiCombobox`, `IntensidadeSelector` e
  `DateTimePicker` descartam `id`/`aria-invalid`/`aria-describedby`** injetados pelo
  `FormControl`. Campos com esses controles não anunciam erro nem obrigatoriedade a
  leitores de tela e não recebem foco no primeiro inválido. Corrigir exige
  `forwardRef` + repasse de props em cada componente. Detalhes em
  `.claude/rules/frontend-react.md`, seção "Formulários".

## Lacunas conscientes da auditoria UX (Nielsen)

Contexto completo em `KAIZEN_LOG.md`, entrada de 2026-08-11.

- **Rename inline não checa duplicado** em `ConfigCrudSection.tsx` — só o formulário
  de criação valida no cliente (o backend continua bloqueando com 409).
- **Undo não se aplica a Songs** (a tela não tem exclusão) nem a Igrejas
  (desativação já é reversível pelo botão "Reativar").
- **Fechar a aba do navegador dentro da janela de 5s do undo perde o DELETE** — o
  item reaparece no próximo load (risco aceito, decisão D2).

## Manutenção

- **`design/extracted/design_handoff_ux_audit/`** é o pacote de handoff que originou
  a auditoria; versionado junto do repo pela mesma convenção de
  `design/extracted/louvorflow-design-system/`.
