# Research: Categorias e Funções Requeridas no Formulário de Música

**Feature**: 011-musica-categorias-funcoes
**Date**: 2026-02-22

## R-001: Componente Multi-Select com Criação Inline

**Decision**: Criar novo componente `CreatableMultiCombobox` separado do `CreatableCombobox` existente.

**Rationale**: O `CreatableCombobox` existente é single-select (retorna `string` via `onSelect`). Um multi-select tem UX fundamentalmente diferente: exibe badges dos itens selecionados, mantém o combobox aberto para seleções adicionais, e precisa gerenciar um array de valores. Modificar o componente existente adicionaria complexidade desnecessária e risco de regressão nos campos de tonalidade e artista.

**Alternatives considered**:
- **Estender `CreatableCombobox` com prop `multiple`**: Rejeitado — UX single vs multi é tão diferente que o componente ficaria sobrecarregado de condicionais (`if multiple` em cada handler). Viola KISS.
- **Usar biblioteca externa (react-select, downshift)**: Rejeitado — o projeto já usa shadcn/ui (Command + Popover) para o combobox existente. Introduzir dependência externa viola YAGNI e quebra consistência visual.

## R-002: Estratégia de Persistência (Criação Atômica vs Chamadas Separadas)

**Decision**: Estender os endpoints `POST /api/musicas/complete` e `PUT /api/musicas/:id/complete` para aceitar campos opcionais `categoria_ids: string[]` e `funcao_ids: string[]`, processados dentro da mesma transação Prisma.

**Rationale**: A criação atômica garante que o usuário não acabe com uma música parcialmente configurada. Se a associação de categorias falhar, a música inteira não é criada — comportamento consistente com o que já acontece com a versão (artista + BPM + cifra). O frontend faz uma única chamada, simplificando error handling e UX.

**Alternatives considered**:
- **Chamadas separadas pós-criação** (create música → N chamadas POST junction): Rejeitado — cria estado parcial em caso de falha na 2ª+ chamada; UX confusa ("música criada mas sem categorias"); exige lógica de rollback ou retry no frontend.
- **Endpoint batch separado** (POST /api/musicas/:id/categorias/batch): Rejeitado — over-engineering para um caso que já tem solução natural na transação do createComplete.

## R-003: Comportamento do Multi-Select na Edição (Sync Strategy)

**Decision**: Na edição, o frontend envia o array completo de `categoria_ids` e `funcao_ids` desejados. O backend compara com as associações existentes e executa diff: adiciona os novos, remove os ausentes.

**Rationale**: O frontend não precisa calcular diffs — apenas envia o estado final desejado. O backend é a fonte de verdade e faz a reconciliação. Isso é mais simples para o frontend e mais seguro (evita race conditions se dois usuários editam simultaneamente).

**Alternatives considered**:
- **Frontend calcula diff e envia add/remove separados**: Rejeitado — mais complexo no frontend; suscetível a race conditions.
- **DELETE ALL + INSERT ALL**: Rejeitado — ineficiente e gera UUIDs novos desnecessários para registros que não mudaram; pode causar problemas com triggers/audit logs futuros.

## R-004: Padrão UI do CreatableMultiCombobox

**Decision**: Usar o mesmo padrão visual do `CreatableCombobox` (Popover + Command) com estas adaptações:
- Trigger exibe badges dos itens selecionados (em vez de texto do item único)
- Após selecionar um item, o Popover permanece aberto para seleção adicional
- Itens já selecionados são filtrados da lista
- Badge com botão "X" remove o item da seleção
- Opção "Criar X" aparece quando texto digitado não tem match exato (mesmo padrão)

**Rationale**: Mantém consistência visual com o restante do formulário. O padrão Popover + Command já é familiar ao usuário (usado em tonalidade e artista). As adaptações são mínimas e intuitivas.

**Alternatives considered**:
- **Select + Badge externo** (padrão atual do MusicaDetail): Rejeitado para o formulário — não suporta criação inline; apenas seleciona de lista fixa.
- **Chips input com autocomplete**: Rejeitado — requer mais implementação custom; shadcn/ui Command já provê busca e filtragem.
