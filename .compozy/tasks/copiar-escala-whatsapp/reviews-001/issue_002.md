---
status: pending
file: packages/frontend/src/hooks/use-eventos.ts
line: 236
severity: high
author: claude-code
provider_ref:
---

# Issue 002: Toast disparado em auto-seleção polui a UI ao abrir a escala

## Review Comment

O hook `useSetMusicaVersao` chama `toast.success(data.msg)` em **toda** mutação
bem-sucedida, inclusive na auto-seleção que ocorre quando uma música tem
exatamente uma versão disponível (gatilho feito no `useEffect` do
`MusicaVersaoPicker`).

```ts
// use-eventos.ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
  queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
  toast.success(data.msg);  // ← dispara mesmo em auto-select
},
```

Consequência: ao abrir uma escala com N músicas que possuem exatamente uma
versão cada (caso comum), o usuário vê N toasts "Versão atualizada" enfileirados,
sem ter interagido com nada. Isso contradiz explicitamente o PRD:

> "Songs with exactly one version auto-select it (**no UI noise**)."

### Sugestão de correção

Distinguir auto-seleção de seleção manual. Opções:

1. Passar uma flag `silent` na mutation e só chamar `toast.success` quando
   `silent` for falsy:

   ```ts
   // use-eventos.ts
   mutationFn: ({ musicaId, artistasMusicasId }: { musicaId: string; artistasMusicasId: string | null; silent?: boolean }) =>
     setMusicaVersao(eventoId, musicaId, artistasMusicasId),
   onSuccess: (data, variables) => {
     queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
     if (!variables.silent) toast.success(data.msg);
   },
   ```

   E no `MusicaVersaoPicker`, disparar `onSelect(defaultId, { silent: true })`
   no efeito de auto-seleção.

2. Alternativa: mover a auto-seleção para o backend no primeiro acesso a
   `formatEventoShow` (resolve o problema e elimina o round-trip adicional).

## Triage

- Decision: `UNREVIEWED`
- Notes:
