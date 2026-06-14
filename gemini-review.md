# Gemini Code Assist Review — PR #64

**Repository**: j0ruge/LouvorFlow
**Reviewer**: gemini-code-assist[bot]
**Branch**: `027-cifraclub-list-link` → `develop`
**Date**: 2026-06-14
**PR**: feat(cifraclub): integração CifraClub + scroll-restoration + remediação de review

> Nota: CodeRabbit **pulou** a review (auto-reviews desabilitadas em base diferente da branch padrão) — sem achados acionáveis. Ver `coderabbit-review.md`.

## Baseline de testes (pré-fix)

```text
baseline_pass: 593   (backend 419 + frontend 174)
baseline_fail: 0
baseline_failing_tests: (nenhum)
```

---

## Findings

### Segurança / Correção

- [x] **#1 [MEDIUM]** `packages/backend/src/lib/cifraclub-key-mapping.ts:79` — Validação de domínio com `.endsWith('cifraclub.com.br')` aceita bypass (`fakecifraclub.com.br`). **Fixed:** trocado por `hostname === 'cifraclub.com.br' || hostname.endsWith('.cifraclub.com.br')` + comentário atualizado.
  - _Severidade recalibrada de HIGH → MEDIUM: o impacto real é restrito (apenas anexa `#key=N` a URLs; o `href` é gateado por `isSafeUrl()` em separado). Ainda assim é um bug de correção de validação de domínio._

- [x] **#2 [MEDIUM]** `packages/frontend/src/lib/cifraclub-key-mapping.ts:79` — Mesmo bypass de domínio do #1, no porto frontend. **Fixed:** mesma correção aplicada (front/back sincronizados).

### Validação Zod

- [x] **#3 [MEDIUM]** `packages/backend/src/validators/eventos.validators.ts:74-81` — Bug lógico: `.regex()` roda antes do `.transform()`, então string vazia `""` falha no regex e nunca vira `null`. **Fixed:** reescrito com `z.preprocess` que normaliza `""` → `null` antes da validação; docstring atualizada.

- [x] **#4 [MEDIUM]** `packages/frontend/src/schemas/evento.ts:9` — Falta import de `CIFRACLUB_LIST_URL_REGEX`. **Fixed:** import adicionado (`@/lib/cifraclub-list-url`).

- [x] **#5 [MEDIUM]** `packages/frontend/src/schemas/evento.ts:27-33` — Contract drift: o campo de formulário valida só URL http/https genérica, não o formato CifraClub. **Fixed:** substituído `.url()` + refine de protocolo por `.regex(CIFRACLUB_LIST_URL_REGEX)` (mesmo contrato do backend); docstring atualizada. Os 4 testes de `evento.test.ts` continuam verdes (regex já cobre `https://` sem host e protocolo inseguro).

### Discrepância feature/spec

- [x] **#6 [MEDIUM]** `packages/frontend/src/components/EventoForm.tsx` — Preview debounced (500ms) da spec T035 não estava implementado; `fetchListPreview`/`ListPreview` eram código morto. **Fixed (decisão do usuário: implementar agora):** implementado o preview completo da T035 — `useDebouncedValue` (500ms) + `fetchListPreview` com `AbortController` (cancela a busca anterior), bloco de preview (nome · dono · nº músicas · pública/privada), texto fixo para listas-sistema, aviso "⚠ Lista não marcada como pública" quando privada e guarda de permissão `escalas.write` (input desabilitado + tooltip "Sem permissão"). Mobile-first: input `w-full`, preview empilha com `min-w-0`/`break-words`. `fetchListPreview` deixou de ser código morto.
  - _Testes: novo `EventoForm.cifraclub-preview.test.tsx` (3 casos: preview público, aviso de privada, lista-sistema sem busca). Polyfill `window.matchMedia` adicionado em `tests/setup.ts` (necessário para renderizar `DateTimePicker`/`Drawer` em jsdom)._

---

## Final Result

| Status | Count | Items |
|---|---|---|
| Fixed | 6 | #1, #2, #3, #4, #5, #6 |
| Already fixed | 0 | — |
| Not applicable | 0 | — |
| Pending | 0 | — |

**Tests pós-fix**: backend **419/419** ✅ · frontend **177/177** ✅ (+3 novos do preview T035) · typecheck backend ✅ · typecheck frontend ✅ · ESLint 0 erros. Sem regressões vs. baseline (593→596).

### Conversations

- **Total threads (Gemini)**: 6
- **Resolved in this run**: 6
- **Previously resolved**: 0
- **Unresolved restantes**: 0
- _(CodeRabbit não tem review threads — apenas issue comment de skip.)_
