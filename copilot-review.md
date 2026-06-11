# Copilot Review — PR #63

**Repository**: j0ruge/LouvorFlow
**Reviewer**: Copilot (copilot-pull-request-reviewer[bot])
**Date**: 2026-06-10
**PR**: feat(escala): navegação escala→música + remediação de segurança do code review
**Base**: `027-cifraclub-list-link` ← **Head**: `028-escala-musica-link`
**Total findings**: 2 (recalibrado: 1 HIGH · 1 MEDIUM) — 1 duplicado de Gemini

## Findings

- [x] **#C5** [HIGH] `packages/frontend/src/hooks/use-scroll-restoration.ts:36` —
  **`restoredRef` não é resetado quando `key` muda.**
  Em rotas `/escalas/:id`, o React Router pode reutilizar o mesmo componente ao trocar o `:id`; ao mudar de `key`, o hook pula a restauração/scroll-to-top porque `restoredRef.current` já está `true`.
  **Already fixed — see gemini-review.md #2.** Mesma raiz e mesma correção (rastrear a última `key` via `lastKeyRef` e resetar `restoredRef` no render). Implementado uma única vez.

- [x] **#C6** [MEDIUM] (Copilot: sem severidade) `packages/frontend/src/components/EventoDetail.tsx:119` —
  **O `onKeyDown` do card dispara também para controles internos (bubble).**
  `handleClickableKeyDown` no card pai é acionado quando o foco está em controles internos (remover / grip / trigger do picker), pois eventos de teclado fazem bubble — causando navegação inesperada ao pressionar Enter/Espaço. Sugestão: ignorar eventos cujo `target` não seja o próprio card (`currentTarget`).
  **Fixed:** esta é a correção escolhida (root-cause, centralizada). O `onKeyDown` do card passou a navegar somente quando `e.target === e.currentTarget`, ignorando eventos que fizeram bubble de grip, seletor de versão e botão de remover — uma única mudança DRY que substitui as sugestões por-filho do Gemini (#3/#4) e cobre também o botão de remover, que não fora flagado. Severidade → MEDIUM (a11y de teclado).

## Final Result

| Status | Count | Items |
|--------|-------|-------|
| Fixed | 1 | #C6 |
| Already fixed | 1 | #C5 (→ gemini-review.md #2) |
| Not applicable | 0 | — |
| Pending | 0 | — |

**Tests**: backend 411/411 ✅ · frontend 158/158 ✅ (+1 regressão a11y de teclado) · typecheck backend ✅ · typecheck frontend ✅

### Conversations

- **Total threads (Copilot)**: 2
- **Resolved in this run**: 2
- **Previously resolved**: 0
- _(PR total: 6 threads — 4 Gemini + 2 Copilot — todos resolvidos)_
