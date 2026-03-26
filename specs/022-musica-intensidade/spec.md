# Feature Specification: Intensidade de Música (por Versão)

**Feature Branch**: `022-musica-intensidade`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "No cadastro de música, adicionar campo 'Intensidade' com três opções (Calma, Média, Agitada) relacionado a cada versão. No frontend, a escolha será visual (toggle/pill buttons) logo abaixo do nome da música."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir intensidade ao criar música (Priority: P1)

O líder de louvor, ao cadastrar uma nova música no sistema, deseja classificar sua intensidade como "Calma", "Média" ou "Agitada". Essa classificação aparece logo abaixo do campo de nome da música, apresentada como botões de seleção visual (pill buttons com ícones de barras de intensidade), semelhante ao app de referência. O campo é opcional — se não selecionado, a música fica sem intensidade definida.

**Why this priority**: É o fluxo principal de entrada de dados. Sem a possibilidade de definir a intensidade na criação, a feature não tem valor.

**Independent Test**: Pode ser testado criando uma nova música, selecionando uma intensidade, salvando e verificando que o valor persiste no detalhe da música.

**Acceptance Scenarios**:

1. **Given** o formulário de "Nova Música" está aberto, **When** o usuário clica em "Média", **Then** o botão "Média" fica visualmente selecionado (destaque ativo) e os outros ficam inativos.
2. **Given** o formulário com intensidade "Calma" selecionada, **When** o usuário clica em "Salvar", **Then** a música é criada com intensidade "Calma" associada à versão.
3. **Given** o formulário de "Nova Música" está aberto, **When** o usuário não seleciona nenhuma intensidade e salva, **Then** a música é criada sem intensidade (campo nullable).

---

### User Story 2 - Visualizar intensidade no detalhe da música (Priority: P1)

Ao abrir os detalhes de uma música, o líder de louvor vê a intensidade associada a cada versão, exibida de forma visual consistente com a seleção no formulário (pill/badge com ícone).

**Why this priority**: Sem visualização, a classificação não tem utilidade prática.

**Independent Test**: Pode ser testado abrindo o detalhe de uma música que tem intensidade definida e verificando que o valor correto é exibido.

**Acceptance Scenarios**:

1. **Given** uma música com versão de intensidade "Agitada", **When** o usuário abre o detalhe, **Then** a intensidade "Agitada" aparece junto à versão com ícone visual correspondente.
2. **Given** uma música com versão sem intensidade, **When** o usuário abre o detalhe, **Then** nenhuma intensidade é exibida (sem "N/A" ou placeholder vazio).

---

### User Story 3 - Editar intensidade de uma versão existente (Priority: P2)

Ao editar uma versão existente de uma música, o líder de louvor pode alterar a intensidade. O formulário de edição de versão apresenta os mesmos botões visuais de seleção, pré-selecionando o valor atual.

**Why this priority**: Permite corrigir classificações erradas ou atualizar conforme o arranjo evolui.

**Independent Test**: Pode ser testado editando uma versão, alterando a intensidade de "Calma" para "Agitada", salvando e verificando que o novo valor persiste.

**Acceptance Scenarios**:

1. **Given** uma versão com intensidade "Calma", **When** o usuário abre a edição e clica em "Agitada", **Then** "Agitada" fica selecionado e "Calma" deseleciona.
2. **Given** a edição com intensidade alterada, **When** o usuário salva, **Then** a nova intensidade é persistida.

---

### Edge Cases

- O que acontece se o usuário clica na intensidade já selecionada? Deve desmarcar (voltar a nulo) para permitir remoção da classificação.
- Como a intensidade se comporta em músicas criadas antes desta feature? Versões existentes terão intensidade nula — exibição normal, sem indicação.
- O que acontece na migração de dados? Nenhuma versão existente é alterada; o campo novo é nullable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE armazenar a intensidade como um campo associado a cada versão (relação artista-música), com valores possíveis: "calma", "media", "agitada" ou nulo.
- **FR-002**: O formulário de criação de música DEVE exibir o seletor de intensidade logo abaixo do campo de nome, com três opções visuais: "Calma" (ícone de barras baixas), "Média" (ícone de barras médias), "Agitada" (ícone de barras altas).
- **FR-003**: O seletor de intensidade DEVE funcionar como toggle — clicar em uma opção a seleciona, clicar novamente a desmarca (nullable).
- **FR-004**: O formulário de edição de versão DEVE incluir o seletor de intensidade com o valor atual pré-selecionado.
- **FR-005**: A tela de detalhes da música DEVE exibir a intensidade de cada versão, quando definida, como badge/pill visual.
- **FR-006**: A API DEVE aceitar e retornar o campo `intensidade` nos endpoints de criação, atualização e consulta de músicas e versões.
- **FR-007**: O campo intensidade DEVE ser opcional (nullable) — não obrigatório para criação ou edição.
- **FR-008**: A migração de banco de dados DEVE adicionar o campo sem alterar dados existentes (nullable, sem default).

### Key Entities

- **Intensidade**: Classificação do nível energético de uma versão de música. Valores fixos: "calma", "media", "agitada". Não é uma tabela separada — é um campo enum/string na entidade de versão (Artistas_Musicas).
- **Versão (Artistas_Musicas)**: Entidade existente que passa a incluir o atributo intensidade. Uma versão pertence a uma música e um artista.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem classificar a intensidade de uma música em menos de 2 segundos (um clique).
- **SC-002**: 100% das versões criadas após a feature permitem definir intensidade opcionalmente.
- **SC-003**: A intensidade é exibida corretamente em todas as telas de detalhe de música onde versões aparecem.
- **SC-004**: Músicas/versões existentes continuam funcionando sem alteração após a migração.

## Assumptions

- A intensidade é uma propriedade da **versão** (Artistas_Musicas), não da música em si — diferentes artistas/arranjos podem ter intensidades diferentes para a mesma música.
- Os valores são fixos (3 opções) e não precisam de CRUD separado — são tratados como enum no backend.
- O componente visual segue o padrão da foto de referência: pill buttons horizontais com ícones de barras de intensidade, sublinhado ativo para a opção selecionada.
- No formulário de criação de música (MusicaForm), a intensidade aparece logo abaixo do nome e acima da tonalidade.
- No formulário de edição de versão (VersaoForm), a intensidade aparece como campo adicional.
