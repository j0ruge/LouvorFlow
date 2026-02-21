# Feature Specification: Enhanced Music Registration Form

**Feature Branch**: `008-enhanced-musica-form`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "Formulário único para cadastro completo de música com criação inline de tonalidade e artista, eliminando a necessidade de múltiplas telas."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastro completo de música em formulário único (Priority: P1)

Um líder de louvor abre o formulário de nova música e preenche todas as informações de uma só vez: nome da música, tonalidade, artista, BPM, cifra, letra e link da versão. Ao confirmar, o sistema cria a música e sua versão padrão automaticamente. Hoje isso exige navegar entre múltiplas telas (configurações para tonalidade/artista, criação da música, página de detalhe para adicionar versão).

**Why this priority**: Esta é a funcionalidade central da feature. Sem o formulário unificado, o fluxo continua fragmentado e lento. Todas as demais histórias dependem desta experiência base.

**Independent Test**: Pode ser testado criando uma música completa pelo formulário e verificando que a música e a versão padrão foram persistidas corretamente no banco de dados.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de cadastro de músicas, **When** preenche apenas o campo "nome" e confirma, **Then** a música é criada sem versão padrão (todos os campos adicionais são opcionais).
2. **Given** o usuário está na tela de cadastro, **When** preenche nome, tonalidade, artista, BPM, cifra, letra e link, **Then** a música é criada com uma versão padrão contendo todos esses dados.
3. **Given** o usuário preencheu o formulário completo, **When** confirma a criação, **Then** o sistema redireciona para a lista de músicas (ou detalhe) exibindo os dados recém-cadastrados.
4. **Given** o usuário deixa o campo "nome" vazio, **When** tenta confirmar, **Then** o sistema exibe uma mensagem de validação indicando que o nome é obrigatório.

---

### User Story 2 - Criação inline de tonalidade via combobox (Priority: P1)

Ao preencher o campo de tonalidade no formulário de música, o usuário vê uma lista pesquisável das tonalidades já cadastradas. Caso a tonalidade desejada não exista, o usuário digita o novo valor e o sistema a cria automaticamente, sem sair do formulário.

**Why this priority**: Tonalidade é um campo central para qualquer música. Se o usuário precisar sair do formulário para cadastrar uma tonalidade, a experiência unificada é quebrada.

**Independent Test**: Pode ser testado abrindo o campo de tonalidade, digitando um valor inexistente, confirmando a criação e verificando que a nova tonalidade aparece selecionada e foi persistida no banco.

**Acceptance Scenarios**:

1. **Given** existem tonalidades cadastradas (ex: "C", "D", "Em"), **When** o usuário clica no campo de tonalidade, **Then** uma lista pesquisável exibe todas as tonalidades existentes.
2. **Given** o usuário digita "F#m" no campo de tonalidade e esse valor não existe, **When** seleciona a opção de criar "F#m", **Then** a tonalidade "F#m" é criada no sistema e automaticamente selecionada no formulário.
3. **Given** o usuário criou uma nova tonalidade inline, **When** abre o campo de tonalidade novamente, **Then** a tonalidade recém-criada aparece na lista de opções.
4. **Given** o usuário digita parte de um nome de tonalidade existente, **When** a lista é filtrada, **Then** apenas as tonalidades correspondentes ao texto digitado são exibidas.

---

### User Story 3 - Criação inline de artista via combobox (Priority: P1)

Ao preencher o campo de artista no formulário de música, o usuário vê uma lista pesquisável dos artistas já cadastrados. Caso o artista desejado não exista, o usuário digita o novo nome e o sistema o cria automaticamente, sem sair do formulário.

**Why this priority**: Artista é necessário para associar uma versão à música. Sem criação inline, o usuário teria que abandonar o formulário, ir a outra tela, cadastrar o artista e retornar — exatamente o problema que esta feature resolve.

**Independent Test**: Pode ser testado abrindo o campo de artista, digitando um nome inexistente, confirmando a criação e verificando que o novo artista aparece selecionado e foi persistido no banco.

**Acceptance Scenarios**:

1. **Given** existem artistas cadastrados (ex: "Hillsong", "Aline Barros"), **When** o usuário clica no campo de artista, **Then** uma lista pesquisável exibe todos os artistas existentes.
2. **Given** o usuário digita "Fernandinho" no campo de artista e esse valor não existe, **When** seleciona a opção de criar "Fernandinho", **Then** o artista "Fernandinho" é criado no sistema e automaticamente selecionado no formulário.
3. **Given** o usuário criou um novo artista inline, **When** abre o campo de artista novamente, **Then** o artista recém-criado aparece na lista de opções.
4. **Given** o usuário digita parte de um nome de artista existente, **When** a lista é filtrada, **Then** apenas os artistas correspondentes ao texto digitado são exibidos.

---

### User Story 4 - Edição do formulário ampliado (Priority: P2)

Ao editar uma música existente, o usuário vê o mesmo formulário ampliado com todos os campos (nome, tonalidade, artista, BPM, cifra, letra, link), pré-preenchidos com os dados atuais. O usuário pode modificar qualquer campo e salvar.

**Why this priority**: A edição é uma extensão natural da criação. Porém, o cadastro inicial (US1-US3) entrega mais valor imediato, pois hoje o fluxo de criação é o mais problemático.

**Independent Test**: Pode ser testado abrindo uma música existente para edição, alterando campos e verificando que as mudanças foram persistidas corretamente.

**Acceptance Scenarios**:

1. **Given** uma música existe com versão padrão, **When** o usuário abre o formulário de edição, **Then** todos os campos são pré-preenchidos com os dados atuais (nome, tonalidade, artista, BPM, cifra, letra, link).
2. **Given** o usuário alterou o campo BPM de 120 para 130, **When** confirma a edição, **Then** a versão padrão é atualizada com o novo BPM.
3. **Given** o usuário altera a tonalidade selecionada, **When** confirma a edição, **Then** a música é atualizada com a nova tonalidade.

---

### Edge Cases

- O que acontece quando o usuário tenta criar uma tonalidade que já existe? O sistema deve selecionar a existente em vez de criar duplicata (campo `tom` é unique).
- O que acontece quando o usuário tenta criar um artista que já existe? O sistema deve selecionar o existente em vez de criar duplicata (campo `nome` é unique).
- O que acontece quando o usuário preenche dados de versão (BPM, cifra, etc.) mas não seleciona um artista? O sistema não deve criar uma versão sem artista — os campos de versão devem ser ignorados ou o sistema deve solicitar a seleção de um artista.
- O que acontece quando o usuário cria uma música com versão padrão e depois adiciona mais versões? As versões adicionais devem coexistir normalmente com a versão criada no formulário.
- O que acontece se a criação da tonalidade/artista inline falha (ex: erro de rede)? O formulário deve exibir uma mensagem de erro sem perder os dados já preenchidos.
- O que acontece quando o campo de busca do combobox está vazio? Todas as opções disponíveis devem ser exibidas.

## Requirements *(mandatory)*

### Functional Requirements

**Formulário Unificado**

- **FR-001**: O formulário de criação de música DEVE incluir os campos: nome, tonalidade, artista, BPM, cifra, letra, link da versão.
- **FR-002**: Ao criar uma música com artista informado, o sistema DEVE criar automaticamente uma versão padrão (registro em `artistas_musicas`) com os dados fornecidos (artista, BPM, cifra, letra, link).
- **FR-003**: Somente o campo `nome` é obrigatório; todos os demais campos são opcionais.
- **FR-004**: Se dados de versão forem preenchidos sem artista selecionado, o sistema DEVE alertar o usuário que um artista é necessário para criar a versão, ou ignorar os dados de versão.
- **FR-005**: Após a criação bem-sucedida, a versão criada automaticamente é a versão "padrão" — versões adicionais podem ser adicionadas posteriormente pela tela de detalhe.

**Combobox de Tonalidade**

- **FR-006**: O campo de tonalidade DEVE permitir buscar e selecionar uma tonalidade existente OU digitar um novo valor para criação automática.
- **FR-007**: Ao digitar um valor inexistente, o sistema DEVE oferecer a opção de criar a nova tonalidade diretamente no combobox.
- **FR-008**: A tonalidade criada inline DEVE estar imediatamente disponível para seleção sem recarregar a página.

**Combobox de Artista**

- **FR-009**: O campo de artista DEVE permitir buscar e selecionar um artista existente OU digitar um novo nome para criação automática.
- **FR-010**: Ao digitar um nome inexistente, o sistema DEVE oferecer a opção de criar o novo artista diretamente no combobox.
- **FR-011**: O artista criado inline DEVE estar imediatamente disponível para seleção sem recarregar a página.

**Edição**

- **FR-012**: O formulário de edição DEVE exibir os mesmos campos do formulário de criação, pré-preenchidos com os dados atuais da música e sua versão padrão.
- **FR-013**: O usuário DEVE poder alterar qualquer campo e salvar as modificações.

**Experiência do Usuário**

- **FR-014**: O usuário NÃO DEVE precisar sair do formulário de criação/edição para cadastrar entidades auxiliares (tonalidade, artista).
- **FR-015**: O formulário DEVE preservar os dados preenchidos caso ocorra um erro durante a submissão.

### Key Entities

- **Música** (composição): Entidade central — possui nome e tonalidade. Relaciona-se com artistas através de versões (`artistas_musicas`).
- **Versão / Artistas_Musicas** (arranjo): Representação de uma versão específica de uma música por um artista — contém BPM, cifras, letra e link da versão. Vinculada a uma música e a um artista.
- **Tonalidade** (tom musical): Entidade de lookup — possui campo `tom` único. Pode ser criada inline durante o cadastro de música.
- **Artista** (intérprete/compositor): Entidade de lookup — possui campo `nome` único. Pode ser criado inline durante o cadastro de música.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue cadastrar uma música completa com todos os detalhes (nome, tonalidade, artista, BPM, cifra, letra, link) em uma única tela, sem navegação adicional.
- **SC-002**: O usuário nunca precisa sair do formulário de criação para cadastrar dados auxiliares (tonalidade, artista).
- **SC-003**: 100% das tonalidades existentes são pesquisáveis e selecionáveis no combobox de tonalidade.
- **SC-004**: 100% dos artistas existentes são pesquisáveis e selecionáveis no combobox de artista.
- **SC-005**: Tonalidades e artistas criados inline estão imediatamente disponíveis para seleção no mesmo formulário, sem recarregar a página.
- **SC-006**: O formulário de edição exibe corretamente todos os dados pré-preenchidos de uma música existente e sua versão padrão.
