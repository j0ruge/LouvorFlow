# Handoff: Correções de UX — Auditoria Nielsen (nota A)

## Overview
Implementar no app LouvorFlow (`j0ruge/LouvorFlow`, branch `master`, frontend em `packages/frontend/`) as correções de UX validadas na auditoria de heurísticas de Nielsen. O protótipo de referência saiu de B- (74/100) para A (93/100); este pacote porta esses comportamentos para o código real.

## About the Design Files
Os arquivos deste pacote são **referências de design em HTML** — protótipos que mostram aparência e comportamento pretendidos, não código de produção. A tarefa é **recriar esses comportamentos no codebase existente** (React + TypeScript + Tailwind/shadcn, conforme os padrões já usados em `packages/frontend/src`), reutilizando os componentes shadcn existentes (Dialog, AlertDialog, Toast/Sonner, Form) em vez de portar o JS vanilla do protótipo.

## Fidelity
**High-fidelity.** `ui_kits/louvorflow-index.html` é uma recriação fiel das telas reais sincronizada com o repo; os comportamentos novos estão implementados e testáveis nele (abra no navegador e interaja). Cores, espaçamentos e tipografia seguem os tokens de `colors_and_type.css` — já equivalentes aos do app.

## Mudanças por arquivo do repo
Paths relativos a `packages/frontend/`.

### Transversal (todos os formulários em modal)
Arquivos: `src/pages/Songs.tsx`, `Scales.tsx`, `Members.tsx`, `src/pages/admin/Users.tsx`, `Roles.tsx`, `Permissions.tsx`, `Igrejas.tsx`
1. **Dirty-form guard**: se o formulário tem dados digitados, Esc / clique no backdrop / botão X NÃO fecham direto — mostram confirmação in-modal "Descartar alterações?" com ações "Continuar editando" (default) e "Descartar" (destrutiva). Implementar como estado `isDirty` (react-hook-form já expõe `formState.isDirty`) + interceptar `onOpenChange` do Dialog.
2. **Campos obrigatórios**: asterisco no label + legenda "* campo obrigatório" no topo do form. Validação no submit (zod/react-hook-form): borda destructive + mensagem inline de 12px sob o campo, foco no primeiro inválido, erro limpo ao digitar.
3. **Toast de sucesso** em toda escrita: "Escala criada.", "Música salva no repertório.", "Integrante salvo.", etc. Bottom-center, ~4,5s.
4. **CTA de salvar**: ícone check (Lucide `Check`) ou sem ícone. `Plus` fica exclusivo dos botões "Novo X".

### `src/pages/Scales.tsx` (maior mudança)
1. **Repertório ordenável**: ao marcar uma música no picker, ela sobe para uma lista "Selecionadas" numerada com: posição, nome, seletor de tom por evento (pré-preenchido com o tom da música), setas ↑↓ (ou drag), botão remover. A ordem da lista é a ordem de execução persistida.
2. **Duplicar escala**: ação "Duplicar" (Lucide `Copy`) no card da escala, abrindo o modal pré-preenchido (título, tipo, equipe, repertório com tons) — usuário só revisa a data. CTA vira "Criar cópia".
3. **Escala sem repertório**: ao criar sem músicas, confirmar ("Adicionar músicas" / "Criar assim mesmo") sem bloquear.
4. **Rascunho**: "Salvar rascunho" cria item na lista com badge tracejada "Rascunho" e data "a definir".
5. **Excluir** com confirmação + toast "Escala excluída." com ação **Desfazer** (restaura o item).
6. Item recém-criado recebe highlight (box-shadow âmbar que decai em 2s).
7. Zero-result da busca ganha botão "Limpar busca".

### `src/pages/History.tsx`
1. **Duplicar** por linha (mesmo fluxo do Scales, pré-preenche e pede data).
2. Unificar a anatomia da linha com a do Dashboard: bloco de data (dia grande + mês), título, meta ("N músicas · N integrantes"), badge do tipo — em vez do layout próprio atual.

### `src/pages/Songs.tsx`
1. **Linha de resultados** acima da lista quando há busca/filtros: "**N** músicas para "termo"" + badges dos filtros ativos + botão "Limpar filtros".
2. Zero-result: botão "Limpar busca e filtros".
3. Form: Título e Artista obrigatórios; BPM `min=30 max=220`.
4. Atalho `/` foca a busca (ignorar quando foco já está em input/textarea/select).

### `src/pages/Members.tsx`
1. **Excluir integrante passa por confirmação** (hoje deleta direto) + toast com Desfazer.
2. **Modal Convites**: listar convites enviados com status — Pendente (badge âmbar) / Aceito (verde) / Expirado (muted) — e nota "Convites expiram em 7 dias".
3. **Modal Gerar Convite**: explicar o fluxo ("quem abrir o link cria a conta já vinculada à igreja"), e-mail opcional restringindo o uso, botão Copiar com toast "Link de convite copiado.".

### `src/pages/Dashboard.tsx`
1. Trocar o stat "Eventos · futuros agendados" (redundante com "Escalas") por "Novas Músicas · adicionadas no mês".
2. "Ver todas" / "Ver integrantes" navegam de fato para as telas.

### `src/pages/Settings.tsx` + `src/components/ConfigCrudSection.tsx`
1. **Duplicados bloqueados** no add (case-insensitive) com mensagem inline "Já existe um item com esse nome."
2. Exclusão: manter confirmação, mas trocar "não pode ser desfeita" por toast com **Desfazer** (restaura na posição original).
3. Item recém-adicionado com highlight de 2s.

### `src/pages/admin/Roles.tsx`, `Users.tsx` e `src/components/AppSidebar.tsx`
1. Copy PT-BR: "Roles" → **"Papéis"**, "Nova Role" → "Novo Papel", "Sem roles" → "Sem papel definido", "Gerenciar ACL" → "Gerenciar acessos". Identificadores técnicos (`musicas.write`) permanecem.

## Interactions & Behavior — especificações
- **Toast**: bottom-center, fundo foreground invertido (`hsl(30 15% 18%)` light / `hsl(35 20% 92%)` dark), radius 12px, ícone check âmbar, 4,5s, entrada slide-up 200ms. Ação "Desfazer" em texto âmbar bold.
- **Undo**: manter o item em memória e restaurar no índice original; o delete real só efetiva quando o toast expira (ou usar soft-delete no backend).
- **Veil de descarte**: overlay `hsl(var(--card) / 0.97)` cobrindo a modal inteira, título 17px display, ações lado a lado. Não é um segundo Dialog — evita stacking de foco.
- **Highlight de item novo**: `box-shadow: 0 0 0 3px hsla(38,80%,52%,0.4)` decaindo para a sombra normal em 2s (animation, uma vez).
- **Erro de campo**: borda `hsl(var(--destructive))` + `box-shadow 0 0 0 3px hsla(0,72%,51%,0.12)` + mensagem 12px destructive abaixo do campo.

## Design Tokens
Usar os já existentes no app (equivalentes a `colors_and_type.css`): primary `38 80% 52%`, accent `350 45% 42%`, background `38 40% 96%`, radius 12/10px, sombras warm-brown. Nenhum token novo é necessário.

## Assets
Nenhum asset novo. Ícones: Lucide (`Copy`, `Check`, `ArrowUp`, `ArrowDown`, `X`).

## Files
- `ui_kits/louvorflow-index.html` — protótipo navegável com todos os comportamentos (fonte da verdade; abrir e interagir)
- `preview/components-states.html` — spec visual de toast + erro de campo
- `colors_and_type.css` — tokens
- `Auditoria-UX.html` — auditoria pós-correções (justificativa de cada mudança)

## Ordem sugerida de implementação
1. Infra transversal: toast (sonner já no shadcn) + dirty-form guard + validação — destrava tudo.
2. `Scales.tsx`: repertório ordenável + duplicar (maior valor para o usuário).
3. `History.tsx` duplicar + linha unificada; `Members.tsx` confirmação/convites.
4. Copy PT-BR do admin, stats do Dashboard, resultados/limpar filtros, highlights.
