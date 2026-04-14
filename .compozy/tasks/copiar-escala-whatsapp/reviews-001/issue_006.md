---
status: pending
file: packages/frontend/vitest.config.ts
line: 7
severity: medium
author: claude-code
provider_ref:
---

# Issue 006: Vitest do frontend usa environment 'node' para código de browser

## Review Comment

A primeira config Vitest do pacote frontend declara `environment: 'node'`:

```ts
// packages/frontend/vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
    ...
  },
});
```

Porém o único teste atual — `src/lib/whatsapp-share.test.ts` — exercita código
que depende de APIs de browser:

- `navigator.clipboard.writeText` (testa `copyEscalaToClipboard`).
- `Intl.DateTimeFormat('pt-BR', ...)` com timezone local (a saída varia
  conforme o TZ do processo Node, o que pode tornar o teste frágil em CI).
- `encodeURIComponent` dentro de `buildWhatsAppShareUrl` (essa é safe em node).

O teste "funciona por sorte" em Node 21+ porque o global `navigator` existe,
mas a monkey-patch `Object.assign(navigator, { clipboard: {...} })` é frágil —
em runners com Node < 20 ele quebra imediatamente. Mais importante, quando
mais testes forem adicionados (componentes React, DOM, etc.), essa config
não vai comportá-los.

### Sugestão de correção

1. Trocar `environment: 'node'` por `'jsdom'` (ou `'happy-dom'` para start-up
   mais rápido) e adicionar `jsdom` como devDependency. O `vitest` já traz o
   loader automático.
2. Garantir que o teste do formatador de data funcione independentemente do
   timezone do runner — ou fixar `TZ=UTC` no script, ou comparar contra a
   saída do próprio `Intl.DateTimeFormat` com a mesma data, como o teste atual
   já faz (bom padrão, manter).

## Triage

- Decision: `UNREVIEWED`
- Notes:
