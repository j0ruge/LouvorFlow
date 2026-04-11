---
status: pending
file: packages/frontend/src/components/MusicaVersaoPicker.tsx
line: 117
severity: medium
author: claude-code
provider_ref:
---

# Issue 007: Seleção stale mostra artista inexistente no badge

## Review Comment

`selectDefaultVersaoId` trata corretamente o caso em que `versaoSelecionada`
aponta para um ID que não existe mais em `versoesDisponiveis` (retorna `null`).
Porém, o auto-select effect só dispara a limpeza quando
`versaoSelecionada === null` e há exatamente 1 versão:

```ts
useEffect(() => {
  if (autoSelectFired.current) return;
  const defaultId = selectDefaultVersaoId(versoesDisponiveis, versaoSelecionada);
  if (versoesDisponiveis.length === 1 && versaoSelecionada === null && defaultId !== null) {
    autoSelectFired.current = true;
    onSelect(defaultId);
  }
}, [versoesDisponiveis, versaoSelecionada, onSelect]);
```

Cenário problemático: um líder tinha selecionado a versão X; outro usuário
deleta a versão X do catálogo de músicas. Com `onDelete: SetNull` o backend já
limpa `fk_artistas_musicas` (bom). Mas se o cliente tiver uma página cacheada
antes da deleção, a cópia local ainda mostra `versao_selecionada: { id: X }`.
Ao re-renderizar com `versoes_disponiveis` atualizada (sem X), o badge exibe
o nome do artista X que não existe mais, e o `RadioGroup` cai no valor
sentinela (`__sem_versao__`) — estado inconsistente entre badge e popover.

### Sugestão de correção

Duas opções complementares:

1. Detectar o label a partir de `versoesDisponiveis`, não do objeto direto:

   ```ts
   const isStale = versaoSelecionada && !versoesDisponiveis.some(v => v.id === versaoSelecionada.id);
   const badgeLabel = isStale || !versaoSelecionada
     ? "Sem versão"
     : versaoSelecionada.artista_nome ?? "Sem artista";
   ```

2. No efeito, disparar `onSelect(null)` também quando a seleção atual ficar
   stale, para limpar o FK no backend:

   ```ts
   if (versaoSelecionada && !versoesDisponiveis.some(v => v.id === versaoSelecionada.id)) {
     autoSelectFired.current = true;
     onSelect(null);  // idealmente silencioso — ver Issue 002
     return;
   }
   ```

## Triage

- Decision: `UNREVIEWED`
- Notes:
