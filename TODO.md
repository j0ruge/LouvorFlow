# TODO — Backlog do LouvorFlow

Achados que **não cabem na missão atual** — registrados, nunca perdidos, nunca desvio de escopo.
Formato e ciclo de vida: `templates/todo.pt-BR.md` do kit sdd (uma variante por `OUTPUT_LANG`); a
forma é medida por `tests/check-todo.sh --check TODO.md --allow-empty`, do kit.

> **Esqueleto.** Dois `##`, nesta ordem, cada um seguido na linha de baixo pelo seu marcador:
> `<!-- sdd:open -->` para os achados, `<!-- sdd:decided -->` para o que não se reabre. O texto do
> heading é livre e segue o `OUTPUT_LANG`; o marcador nunca muda. Nenhum outro `##`. Dentro da
> seção aberta, as categorias `###` são livres (tema, quem destrava, "Bloqueia", "Decisão
> pendente"). Análise longa e roadmap moram em `docs/`; o item aponta com `Fonte:`.
>
> **Achado aberto** — cerca de 6 linhas (teto 8), caixa sempre vazia, atribuição na última linha:
>
> ```md
> - [ ] **<título>** — `<arquivo:linha>` — <por que importa>. Direção: <o que fazer>. Fonte: `<docs/…>`
>   — descoberto por `<agente>` na missão `<slug>` (YYYY-MM-DD)
> ```
>
> **Registro decidido** — uma linha física, sem caixa, apontando a evidência:
>
> ```md
> - **<título>** — <o que se decidiu e por quê> — `<ADR | handoff | teste>` (YYYY-MM-DD)
> ```
>
> **Ciclo de vida.** Consertado por commit: o corpo ganha `RESOLVED by <hash>` (token do kit, igual
> em todo idioma) e o item fica até `git merge-base --is-ancestor <hash> <DEFAULT_BRANCH>` valer;
> então é **apagado**, nunca marcado. Refutado, decidido, wont-fix ou risco aceito: não há o que
> commitar, então sai da seção aberta e vira registro decidido no mesmo commit. Duplicado é
> apagado, citando o sobrevivente. Antes de registrar, leia os decididos: o que está lá não volta.

## Aberto
<!-- sdd:open -->

### Sessão e autenticação

- [ ] **Renovação de sessão: a corrida entre abas derruba a sessão das duas** —
  `docs/superpowers/plans/2026-08-11-renovacao-sessao-corrida-entre-abas.md` — duas abas que
  renovam o refresh token ao mesmo tempo derrubam a sessão das duas; 429, 500 e blips de rede
  apagam credencial válida. Direção: as Tasks 1-8 do plano (a Task 0 está concluída); as
  oportunidades fora de escopo estão na seção "Fora de escopo — oportunidades" do próprio plano
  — descoberto por `humano` (2026-08-12)
- [ ] **Login revoga todas as outras sessões do mesmo usuário** —
  `packages/backend/src/services/auth/authenticate-user.service.ts:197` — o `replaceAllByUserId`
  faz o login pelo celular deslogar o notebook. Hoje é efeito colateral de uma escolha de
  implementação, não de um requisito. Direção: decisão de produto, ainda não discutida —
  descoberto por `humano` (2026-08-12)

### Testes end-to-end

- [ ] **e2e não roda no CI** — `.github/workflows/ci-frontend.yml` — executa lint, typecheck e
  unitários. Direção: provisionar banco e servidores no workflow **e** definir
  `LOGIN_RATE_LIMIT_MAX` e `TOKEN_EXCHANGE_RATE_LIMIT_MAX` (a suíte estoura os limites de
  produção; ver `.env.example`) — descoberto por `humano` (2026-08-12)
- [ ] **Resíduo de execução interrompida deixa o admin multi-tenant** —
  `packages/frontend/tests/e2e/admin-formularios.spec.ts:17` — o spec vincula usuários a igrejas
  de teste; se o run for morto no meio, o vínculo fica e o login passa a exigir seleção de igreja.
  O helper tolera isso. Direção: um `globalSetup` varrendo `tenants` com prefixo `E2E ` —
  descoberto por `humano` (2026-08-12)

### Acessibilidade

- [ ] **`CreatableCombobox`, `CreatableMultiCombobox`, `IntensidadeSelector` e `DateTimePicker`
  descartam `id`/`aria-invalid`/`aria-describedby`** — `packages/frontend/src/components/` —
  injetados pelo `FormControl`; campos com esses controles não anunciam erro nem obrigatoriedade a
  leitores de tela e não recebem foco no primeiro inválido. Direção: `forwardRef` + repasse de
  props em cada componente. Fonte: `.claude/rules/frontend-react.md:107` (seção "Formulários") —
  descoberto por `humano` (2026-08-12)

### Auditoria UX (Nielsen)

- [ ] **Rename inline não checa duplicado** —
  `packages/frontend/src/components/ConfigCrudSection.tsx:182` — só o formulário de criação valida
  no cliente (o backend continua bloqueando com 409). Fonte: `KAIZEN_LOG.md`, entrada de 2026-08-11
  — descoberto por `humano` (2026-08-12)

## Decidido — não reabrir
<!-- sdd:decided -->

- **Undo não se aplica a Songs nem a Igrejas** — Songs não tem exclusão na tela, e a desativação de Igrejas já é reversível pelo botão "Reativar" — `KAIZEN_LOG.md` (auditoria UX de 2026-08-11) (2026-08-12)
- **Fechar a aba dentro da janela de 5 s do undo perde o DELETE** — o item reaparece no próximo load; risco aceito na decisão D2 (undo client-side, não soft-delete) — `KAIZEN_LOG.md:68` (2026-08-12)
- **`design/extracted/design_handoff_ux_audit/` fica versionado** — é o pacote de handoff que originou a auditoria UX, pela mesma convenção de `design/extracted/louvorflow-design-system/` (2026-08-12)
