# CodeRabbit Review — PR #61

**Repository**: j0ruge/LouvorFlow
**Reviewer**: coderabbitai[bot]
**Date**: 2026-05-03
**Total findings**: 19 (5 HIGH · 6 MEDIUM · 8 LOW)

## Findings

### HIGH

- [x] **#1** [HIGH] `packages/frontend/src/lib/utils.ts:107` — Fixed: `formatDateBlock` agora valida `isNaN` (retorna `{NaN, ""}`) e usa UTC getters para ISO date-only.
- [x] **#2** [HIGH] `packages/frontend/src/pages/Dashboard.tsx:128` — Fixed: botão "Nova Escala" agora navega para `/escalas?nova=1` e a página `Scales` lê esse query param para abrir o `EventoForm` automaticamente (e remove o param da URL).
- [x] **#3** [HIGH] `packages/frontend/src/components/AppSidebar.tsx:208` — Fixed: TenantSwitcher ganhou prop `compact` que renderiza um botão-ícone funcional (com `aria-label` + `title`) quando a sidebar está colapsada, mantendo o dropdown acessível.
- [x] **#4** [HIGH] `design/extracted/.../brand-lockup.html:12` — Fixed: removida chave `}` extra na regra `.wordmark`.
- [x] **#5** [HIGH] `packages/frontend/tests/unit/lib/utils.test.ts:11` — Fixed: adicionado `import type React from "react"`.

### MEDIUM

- [x] **#6** [MEDIUM] `design/extracted/.../fonts.css:11` — Fixed: trocado `wght@400;500;600;700;800` por `wght@400;500;600;700` (peso 800 não usado).
- [x] **#7** [MEDIUM] `design/extracted/.../README.md:209` — Fixed: caveat reescrito refletindo que Sora já é default desde este PR.
- [x] **#8** [MEDIUM] `design/extracted/.../index.html:908` — Fixed: removida chave `artives` (typo) duplicada de `artista`.
- [x] **#9** [MEDIUM] `design/extracted/.../views.js:73` — Fixed: CTAs do header marcados `disabled` com `title` indicando que o shell completo está em `index.html` (preview enxuto).
- [x] **#10** [MEDIUM] `design/extracted/.../views.js:184` — Fixed: introduzido `supportedViews` set que normaliza views não suportadas para `dashboard`, evitando desync nav/conteúdo.
- [x] **#11** [MEDIUM] `packages/frontend/src/components/ui/toggle.tsx:8` — Fixed: `data-[state=on]:bg-accent`/`text-accent-foreground` migrados para `bg-muted`/`text-foreground`, alinhando com os demais primitivos.

### LOW

- [x] **#12** [LOW] `packages/frontend/src/components/ui/command.tsx:108` — Fixed: aspas removidas em `data-[selected=true]:bg-muted`.
- [x] **#13** [LOW] `packages/frontend/src/components/UserMenu.tsx:127` — Fixed: `w-72` ganhou `max-w-[calc(100vw-1rem)]` como guard responsivo.
- [x] **#14** [LOW] `design/extracted/.../fonts.css:11` — Fixed: trocado `@import url("...")` por `@import "..."`.
- [x] **#15** [LOW] `design/extracted/.../_card.css:2` — Fixed: mesmo ajuste de notação `@import`.
- [x] **#16** [LOW] `design/extracted/.../components-badges.html:5-12` — Not applicable: handoff snapshot (preview HTML estático com naming próprio para demonstração); na implementação real (`packages/frontend`) não há essa divergência.
- [x] **#17** [LOW] `design/extracted/.../components-inputs.html:15-23` — Fixed: adicionados `for="preview-email"`/`id="preview-email"` e equivalentes para Senha.
- [x] **#18** [LOW] `packages/frontend/src/pages/Songs.tsx:227` — Fixed: badges de categoria extraídas para const `categoriaBadges` reutilizada nos containers desktop e mobile.
- [x] **#19** [LOW] `design/extracted/.../index.html:1117` — Fixed: `const init = initials;` (alias) em vez de redefinição duplicada.

## Final Result

| Status | Count |
|---|---|
| Fixed | 18 |
| Already fixed | 0 |
| Not applicable | 1 |
| Pending | 0 |

**Tests**: backend 347/347 ✅ · frontend 134/134 ✅ · typecheck ✅ · lint 0 errors ✅
