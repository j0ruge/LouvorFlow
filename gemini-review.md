# Gemini Review — PR #63

**Repository**: j0ruge/LouvorFlow
**Reviewer**: gemini-code-assist[bot]
**Date**: 2026-06-10
**PR**: feat(escala): navegação escala→música + remediação de segurança do code review
**Base**: `027-cifraclub-list-link` ← **Head**: `028-escala-musica-link`
**Total findings**: 4 (recalibrado: 1 HIGH · 3 MEDIUM)

Findings ordenados por severidade recalibrada.

## Findings

- [x] **#2** [HIGH] `packages/frontend/src/hooks/use-scroll-restoration.ts:36` —
  **Bug de persistência do `restoredRef` ao mudar de escala.**
  `restoredRef` (useRef) persiste por toda a vida da instância. Ao navegar direto de `/escalas/1` para `/escalas/2`, o React Router pode reaproveitar a instância de `EventoDetail`: a `key` muda mas `restoredRef.current` continua `true`, e o efeito de restauração sai cedo (`if (restoredRef.current) return`) — a nova escala herda o scroll da anterior.
  **Fixed:** adicionado `lastKeyRef` + reset síncrono durante o render (`if (lastKeyRef.current !== key) { lastKeyRef.current = key; restoredRef.current = false; }`). Padrão idiomático de reset de estado derivado no render. Confere com a sugestão do reviewer. Testes existentes do hook permanecem verdes (não exercitam troca de key).

- [x] **#1** [MEDIUM] (Gemini: HIGH) `packages/backend/src/middlewares/rateLimit.ts:60` —
  **Gargalo de desempenho na varredura do rate limiter (DoS auto-infligido).**
  A limpeza preguiçosa rodava sempre que `hits.size > SWEEP_THRESHOLD` (10.000), **a cada requisição**. Sob carga sustentada com >10k IPs ativos, o `Map` permaneceria acima do limite e o `for...of` varreria todas as entradas em toda requisição — bloqueando o event loop (DoS auto-infligido).
  **Fixed:** adicionado `let lastSweep = 0` no closure do factory + guard `&& now - lastSweep > 60_000` — a varredura ocorre no máximo uma vez por minuto. Init em `0` preserva uma primeira varredura imediata ao cruzar o limite (mantém os testes verdes, que não exercitam o sweep). Severidade → MEDIUM: rotas afetadas são apenas as públicas de convites (baixo tráfego no porte atual); o cenário >10k IPs ativos é teórico, mas o fix é barato e correto (hardening coerente com o tema do PR).

- [x] **#3** [MEDIUM] (Gemini: HIGH) `packages/frontend/src/components/EventoDetail.tsx:130` (grip de arraste) —
  **A11y: eventos de teclado do grip propagam para o card pai.**
  Ao focar o grip e pressionar Enter/Espaço, o `keydown` faz bubble até o card pai (`role="button"`), disparando `onOpen` (navegação) e impedindo o uso do controle interno.
  **Fixed (abordagem alternativa):** em vez de `stopPropagation` por filho, apliquei o guard centralizado de `currentTarget` no `onKeyDown` do card (ver Copilot #C6) — o handler só navega quando `e.target === e.currentTarget`. Cobre grip, picker **e** o botão de remover de uma vez (DRY/KISS); a sugestão por-filho deixaria o botão de remover descoberto. Severidade → MEDIUM (a11y de teclado, sem perda de dados).

- [x] **#4** [MEDIUM] (Gemini: HIGH) `packages/frontend/src/components/EventoDetail.tsx:172` (seletor de versão) —
  **A11y: eventos de teclado do `MusicaVersaoPicker` propagam para o card pai.**
  Mesmo root cause de #3, no wrapper do seletor de versão.
  **Fixed (abordagem alternativa):** resolvido pelo mesmo guard centralizado de `currentTarget` em `EventoDetail.tsx`. Veja #3 e Copilot #C6.

## Final Result

| Status | Count | Items |
|--------|-------|-------|
| Fixed | 4 | #1, #2, #3, #4 |
| Already fixed | 0 | — |
| Not applicable | 0 | — |
| Pending | 0 | — |

**Tests**: backend 411/411 ✅ · frontend 158/158 ✅ (+1 regressão a11y de teclado) · typecheck backend ✅ · typecheck frontend ✅

### Conversations

- **Total threads (Gemini)**: 4
- **Resolved in this run**: 4
- **Previously resolved**: 0
- _(PR total: 6 threads — 4 Gemini + 2 Copilot — todos resolvidos)_
