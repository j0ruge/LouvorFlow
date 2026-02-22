# Feature Specification: Categorias e Funções Requeridas no Formulário de Música

**Feature Branch**: `011-musica-categorias-funcoes`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Adicionar campos de Categorias e Funções Requeridas ao formulário de cadastro/edição de música, com busca e criação inline (mesmo padrão do combobox de artista e tonalidade), sem precisar sair da tela."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Selecionar categorias existentes no formulário de música (Priority: P1)

Um líder de louvor está cadastrando uma nova música e deseja associar categorias (ex: "Adoração", "Louvor Congregacional", "Kids"). No próprio formulário de criação da música, ele vê um campo de categorias com busca. Ao digitar, as categorias existentes são filtradas. Ele seleciona uma ou mais categorias, que aparecem como badges no formulário. Ele pode remover qualquer categoria selecionada clicando no "X" do badge.

**Why this priority**: Este é o caso de uso mais frequente — a maioria das categorias já existem e o usuário só precisa selecioná-las. Entregar esta funcionalidade primeiro viabiliza a associação sem sair do formulário.

**Independent Test**: Pode ser testado criando uma música, selecionando categorias existentes e verificando que as associações foram persistidas corretamente na tabela de junção.

**Acceptance Scenarios**:

1. **Given** existem categorias cadastradas (ex: "Adoração", "Louvor", "Kids"), **When** o usuário clica no campo de categorias no formulário de música, **Then** uma lista pesquisável exibe todas as categorias disponíveis.
2. **Given** o usuário selecionou a categoria "Adoração", **When** ela é adicionada, **Then** um badge "Adoração" aparece no formulário e a categoria é removida da lista de opções disponíveis.
3. **Given** o usuário selecionou múltiplas categorias, **When** clica no "X" de uma delas, **Then** a categoria é removida da seleção e volta a aparecer na lista de opções.
4. **Given** o usuário selecionou categorias e preenche o restante do formulário, **When** confirma a criação da música, **Then** a música é criada e todas as categorias selecionadas são associadas a ela.
5. **Given** o usuário não seleciona nenhuma categoria, **When** confirma a criação, **Then** a música é criada normalmente sem categorias associadas (campo opcional).

---

### User Story 2 - Selecionar funções requeridas existentes no formulário de música (Priority: P1)

Um líder de louvor cadastra uma música que requer instrumentos/funções específicas (ex: "Bateria", "Violão", "Vocal Tenor"). No formulário de criação, ele usa o campo de funções requeridas para buscar e selecionar uma ou mais funções. Cada função selecionada aparece como badge e pode ser removida.

**Why this priority**: Mesma prioridade que categorias — funcionalidade essencial para associar funções requeridas diretamente no cadastro, eliminando a necessidade de ir à tela de detalhe.

**Independent Test**: Pode ser testado criando uma música, selecionando funções existentes e verificando que as associações foram persistidas na tabela de junção.

**Acceptance Scenarios**:

1. **Given** existem funções cadastradas (ex: "Bateria", "Violão", "Vocal"), **When** o usuário clica no campo de funções requeridas no formulário de música, **Then** uma lista pesquisável exibe todas as funções disponíveis.
2. **Given** o usuário selecionou "Bateria", **When** a função é adicionada, **Then** um badge "Bateria" aparece no formulário e a função é removida da lista de opções.
3. **Given** o usuário selecionou múltiplas funções, **When** clica no "X" de uma delas, **Then** a função é removida da seleção e volta à lista de opções.
4. **Given** o usuário selecionou funções e preenche o restante do formulário, **When** confirma a criação, **Then** a música é criada com todas as funções requeridas associadas.
5. **Given** o usuário não seleciona nenhuma função, **When** confirma a criação, **Then** a música é criada normalmente sem funções associadas (campo opcional).

---

### User Story 3 - Criar categoria inline sem sair do formulário (Priority: P1)

Um líder de louvor está cadastrando uma música e precisa de uma categoria que ainda não existe (ex: "Ceia"). No campo de categorias, ele digita "Ceia" e não encontra resultado. O sistema oferece a opção de criar "Ceia" diretamente. Ao confirmar, a nova categoria é criada, automaticamente adicionada à seleção do formulário e fica disponível para futuras músicas.

**Why this priority**: A criação inline é o diferencial principal da feature — sem ela, o usuário teria que sair do formulário, ir à tela de configurações, cadastrar a categoria e voltar. Isso quebra o fluxo.

**Independent Test**: Pode ser testado digitando um nome de categoria inexistente no combobox, criando inline e verificando que a categoria foi persistida no banco e adicionada à seleção.

**Acceptance Scenarios**:

1. **Given** o usuário digita "Ceia" no campo de categorias e esse valor não existe, **When** o sistema exibe a opção "Criar Ceia", **Then** o usuário pode clicar nela para criar a categoria.
2. **Given** o usuário confirma a criação da categoria "Ceia", **When** a criação é bem-sucedida, **Then** um badge "Ceia" aparece na seleção do formulário e a categoria está persistida no sistema.
3. **Given** a categoria "Ceia" foi criada inline, **When** o usuário abre o campo de categorias novamente (neste ou em outro cadastro), **Then** "Ceia" aparece na lista de opções.
4. **Given** o usuário digita "Adoração" e essa categoria já existe, **When** a lista é filtrada, **Then** o sistema mostra a categoria existente para seleção (sem opção de criar duplicata).

---

### User Story 4 - Criar função requerida inline sem sair do formulário (Priority: P1)

Um líder de louvor está cadastrando uma música e precisa de uma função que ainda não existe (ex: "Saxofone"). No campo de funções requeridas, ele digita "Saxofone" e não encontra resultado. O sistema oferece a opção de criar "Saxofone" diretamente. Ao confirmar, a nova função é criada e adicionada à seleção.

**Why this priority**: Mesma lógica da US3 — criação inline é essencial para manter a fluidez do cadastro.

**Independent Test**: Pode ser testado digitando um nome de função inexistente, criando inline e verificando que a função foi persistida e adicionada à seleção.

**Acceptance Scenarios**:

1. **Given** o usuário digita "Saxofone" no campo de funções requeridas e esse valor não existe, **When** o sistema exibe a opção "Criar Saxofone", **Then** o usuário pode clicar nela para criar a função.
2. **Given** o usuário confirma a criação da função "Saxofone", **When** a criação é bem-sucedida, **Then** um badge "Saxofone" aparece na seleção e a função está persistida.
3. **Given** a função "Saxofone" foi criada inline, **When** o usuário abre o campo de funções novamente, **Then** "Saxofone" aparece na lista de opções.
4. **Given** o usuário digita "Bateria" e essa função já existe, **When** a lista é filtrada, **Then** o sistema mostra a função existente (sem criar duplicata).

---

### User Story 5 - Edição de categorias e funções em música existente (Priority: P2)

Ao editar uma música existente, o usuário vê as categorias e funções requeridas já associadas como badges no formulário. Ele pode adicionar novas, remover existentes e criar inline — da mesma forma que no formulário de criação.

**Why this priority**: A edição é uma extensão natural da criação. O cadastro inicial (US1-US4) entrega mais valor imediato.

**Independent Test**: Pode ser testado abrindo uma música existente com categorias/funções, adicionando e removendo itens, e verificando que as alterações são persistidas.

**Acceptance Scenarios**:

1. **Given** uma música existe com categorias "Adoração" e "Louvor" associadas, **When** o usuário abre o formulário de edição, **Then** os badges "Adoração" e "Louvor" aparecem no campo de categorias.
2. **Given** uma música existe com funções "Bateria" e "Violão" associadas, **When** o usuário abre o formulário de edição, **Then** os badges "Bateria" e "Violão" aparecem no campo de funções requeridas.
3. **Given** o usuário remove a categoria "Louvor" e adiciona "Kids" na edição, **When** confirma a edição, **Then** a música fica associada apenas a "Adoração" e "Kids".
4. **Given** o usuário cria uma nova função "Saxofone" inline durante a edição, **When** confirma a edição, **Then** a função "Saxofone" é criada e associada à música.

---

### Edge Cases

- O que acontece quando o usuário tenta criar uma categoria com nome que já existe? O sistema deve selecionar a existente em vez de criar duplicata (campo `nome` é unique).
- O que acontece quando o usuário tenta criar uma função com nome que já existe? O sistema deve selecionar a existente em vez de criar duplicata (campo `nome` é unique).
- O que acontece se a criação inline de categoria/função falha (ex: erro de rede)? O formulário deve exibir mensagem de erro sem perder os dados já preenchidos no restante do formulário.
- O que acontece quando não existem categorias/funções cadastradas no sistema? Os campos aparecem vazios, mas a opção de criação inline continua disponível.
- O que acontece quando todas as categorias/funções disponíveis já foram selecionadas? A lista de opções fica vazia e o usuário só pode criar novos itens ou remover os selecionados.
- O que acontece se o usuário seleciona categorias/funções no formulário de criação, mas a criação da música falha? Os dados do formulário (incluindo seleções de categorias/funções) devem ser preservados para nova tentativa.

## Requirements *(mandatory)*

### Functional Requirements

**Campo Multi-Seleção de Categorias no Formulário**

- **FR-001**: O formulário de criação de música DEVE incluir um campo de categorias com busca e seleção múltipla.
- **FR-002**: O campo de categorias DEVE exibir as categorias selecionadas como badges removíveis dentro do formulário.
- **FR-003**: O campo de categorias DEVE filtrar as opções disponíveis conforme o texto digitado pelo usuário.
- **FR-004**: As categorias já selecionadas NÃO DEVEM aparecer na lista de opções disponíveis.
- **FR-005**: O campo de categorias é opcional — o formulário DEVE permitir criação de música sem nenhuma categoria selecionada.

**Criação Inline de Categorias**

- **FR-006**: Quando o usuário digita um valor inexistente no campo de categorias, o sistema DEVE oferecer a opção de criar a nova categoria diretamente.
- **FR-007**: A categoria criada inline DEVE estar imediatamente disponível e automaticamente adicionada à seleção, sem recarregar a página.
- **FR-008**: Se o usuário digitar um nome que já existe como categoria, o sistema DEVE mostrar a existente para seleção em vez de oferecer criação.

**Campo Multi-Seleção de Funções Requeridas no Formulário**

- **FR-009**: O formulário de criação de música DEVE incluir um campo de funções requeridas com busca e seleção múltipla.
- **FR-010**: O campo de funções requeridas DEVE exibir as funções selecionadas como badges removíveis dentro do formulário.
- **FR-011**: O campo de funções requeridas DEVE filtrar as opções disponíveis conforme o texto digitado pelo usuário.
- **FR-012**: As funções já selecionadas NÃO DEVEM aparecer na lista de opções disponíveis.
- **FR-013**: O campo de funções requeridas é opcional — o formulário DEVE permitir criação de música sem nenhuma função selecionada.

**Criação Inline de Funções Requeridas**

- **FR-014**: Quando o usuário digita um valor inexistente no campo de funções requeridas, o sistema DEVE oferecer a opção de criar a nova função diretamente.
- **FR-015**: A função criada inline DEVE estar imediatamente disponível e automaticamente adicionada à seleção, sem recarregar a página.
- **FR-016**: Se o usuário digitar um nome que já existe como função, o sistema DEVE mostrar a existente para seleção em vez de oferecer criação.

**Edição**

- **FR-017**: O formulário de edição DEVE exibir as categorias e funções já associadas à música como badges pré-selecionados.
- **FR-018**: O usuário DEVE poder adicionar, remover e criar inline categorias e funções durante a edição, da mesma forma que na criação.
- **FR-019**: Ao salvar a edição, o sistema DEVE sincronizar as associações — adicionando novas, removendo as desmarcadas.

**Experiência do Usuário**

- **FR-020**: O usuário NÃO DEVE precisar sair do formulário de criação/edição para cadastrar categorias ou funções requeridas.
- **FR-021**: O formulário DEVE preservar todas as seleções de categorias e funções caso ocorra um erro durante a submissão.

### Key Entities

- **Categoria** (classificação musical): Entidade de lookup — possui campo `nome` único. Usada para classificar músicas (ex: "Adoração", "Louvor Congregacional", "Kids"). Relaciona-se com músicas via tabela de junção muitos-para-muitos.
- **Função Requerida** (papel instrumental/vocal): Entidade de lookup — possui campo `nome` único. Representa instrumentos ou funções vocais necessárias para tocar uma música (ex: "Bateria", "Violão", "Vocal Tenor"). Relaciona-se com músicas via tabela de junção muitos-para-muitos.
- **Música** (composição): Entidade central que agora inclui associações opcionais com categorias e funções requeridas, além dos campos já existentes.

## Assumptions

- O modelo de dados existente já suporta as relações muitos-para-muitos entre Músicas↔Categorias e Músicas↔Funções via tabelas de junção (`musicas_categorias` e `musicas_funcoes`).
- Os endpoints de API para CRUD de categorias e funções, bem como os endpoints de junção (`/api/musicas/:musicaId/categorias` e `/api/musicas/:musicaId/funcoes`), já existem e funcionam corretamente.
- O padrão de combobox com criação inline já existe no projeto (usado para tonalidade e artista) e será estendido para suportar seleção múltipla.
- Os campos de categorias e funções requeridas serão posicionados após os campos já existentes no formulário (nome, tonalidade, artista, BPM, cifra, letra, link).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue associar categorias e funções requeridas a uma música diretamente no formulário de criação, sem navegação adicional.
- **SC-002**: O usuário nunca precisa sair do formulário para cadastrar novas categorias ou funções requeridas.
- **SC-003**: 100% das categorias existentes são pesquisáveis e selecionáveis no campo de categorias.
- **SC-004**: 100% das funções existentes são pesquisáveis e selecionáveis no campo de funções requeridas.
- **SC-005**: Categorias e funções criadas inline estão imediatamente disponíveis para seleção no mesmo formulário, sem recarregar a página.
- **SC-006**: O formulário de edição exibe corretamente as categorias e funções já associadas a uma música existente.
- **SC-007**: O fluxo completo de criação de música (com todos os campos, incluindo categorias e funções) pode ser realizado em uma única tela.
