---
status: pending
file: packages/frontend/src/components/EscalaShareActions.tsx
line: 51
severity: low
author: claude-code
provider_ref:
---

# Issue 009: setState pós-unmount no timeout do botão "Copiar"

## Review Comment

O handler `handleCopy` usa `setTimeout(() => setCopied(false), 3000)` após
copiar a escala para o clipboard:

```tsx
async function handleCopy() {
  if (!evento) return;
  try {
    await copyEscalaToClipboard(evento);
    setCopied(true);
    toast.success("Escala copiada para a área de transferência");
    setTimeout(() => setCopied(false), 3000);
  } catch {
    toast.error('Não foi possível copiar. Use o botão "Abrir no WhatsApp".');
  }
}
```

Se o usuário clicar em "Copiar texto" e navegar para fora da página de detalhe
da escala antes dos 3 segundos decorrerem, o callback tentará chamar
`setCopied(false)` em um componente desmontado. Em modo strict do React 18 isso
dispara um warning no console; em fluxos produtivos é silencioso mas acumula
memória se o usuário clicar e sair várias vezes.

### Sugestão de correção

Guardar a referência do timeout e limpá-la no cleanup do componente:

```tsx
import { useEffect, useRef, useState } from "react";

const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
  };
}, []);

// dentro de handleCopy, após setCopied(true):
if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
copiedTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
```

## Triage

- Decision: `UNREVIEWED`
- Notes:
