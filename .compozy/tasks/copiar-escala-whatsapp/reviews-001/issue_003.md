---
status: pending
file: packages/frontend/src/hooks/use-eventos.ts
line: 234
severity: medium
author: claude-code
provider_ref:
---

# Issue 003: Invalidação exagerada da query list ao trocar versão

## Review Comment

`useSetMusicaVersao` invalida duas queries ao concluir:

```ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
  queryClient.invalidateQueries({ queryKey: ["eventos"], exact: true });
  toast.success(data.msg);
},
```

A segunda invalidação (`["eventos"]`, exact: true) força um refetch completo da
listagem de eventos. Porém, a listagem (`EVENTO_INDEX_SELECT`) nem sequer expõe
versão selecionada — ela só projeta `id`/`nome` das músicas e `id`/`name` dos
users. Alterar a versão de uma música em um evento específico jamais muda a
resposta da lista.

Combinado com o Issue 002 (auto-seleção dispara a mutation por música), cada
abertura de escala com K músicas faz a listagem ser invalidada e refetchada K
vezes.

### Sugestão de correção

Remover a invalidação da query list:

```ts
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["eventos", eventoId] });
  toast.success(data.msg);
},
```

A query do detalhe (`["eventos", eventoId]`) já é suficiente para atualizar o
card renderizado após a troca de versão.

## Triage

- Decision: `UNREVIEWED`
- Notes:
