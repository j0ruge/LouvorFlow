# Feature Specification: Remover Campo Documento de Integrantes

**Feature Branch**: `012-remove-documento-integrante`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "No modelo de dados, backend e front end, na entidade integrantes, existe um atributo que é o Documento, a identificação única do usuário, a cliente usou e disse que não precisa desse dado, então vamos remover completamente do sistema."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastro de integrante sem documento (Priority: P1)

Como administrador do sistema, quero cadastrar integrantes sem precisar informar um documento de identificação (CPF ou RG), pois a cliente confirmou que esse dado não é necessário para o fluxo de trabalho.

**Why this priority**: É a ação principal do sistema — o cadastro de integrantes. O campo documento é obrigatório no formulário atual, impedindo o cadastro sem esse dado. Remover essa exigência é o benefício central desta feature.

**Independent Test**: Pode ser testado criando um novo integrante pelo formulário sem preencher nenhum campo de documento e confirmando que o cadastro é salvo com sucesso.

**Acceptance Scenarios**:

1. **Given** o formulário de cadastro de integrante está aberto, **When** o usuário preenche nome, email, telefone e função (sem documento), **Then** o integrante é criado com sucesso e aparece na listagem.
2. **Given** o formulário de cadastro de integrante está aberto, **When** o usuário submete o formulário, **Then** não existe campo de documento visível no formulário.

---

### User Story 2 - Edição de integrante sem campo documento (Priority: P1)

Como administrador do sistema, quero editar integrantes existentes sem ver ou precisar preencher o campo documento, mantendo a experiência consistente com o cadastro.

**Why this priority**: Mesma prioridade do cadastro — a edição é igualmente importante e precisa refletir a remoção do campo.

**Independent Test**: Pode ser testado abrindo o formulário de edição de um integrante existente e verificando que o campo documento não aparece, e que a edição é salva normalmente.

**Acceptance Scenarios**:

1. **Given** um integrante existente com documento cadastrado, **When** o administrador abre o formulário de edição, **Then** o campo documento não é exibido.
2. **Given** um integrante existente, **When** o administrador edita o nome e salva, **Then** a edição é salva com sucesso sem erros relacionados a documento.

---

### User Story 3 - Respostas da API sem campo documento (Priority: P2)

Como consumidor da API, espero que as respostas de listagem e detalhe de integrantes não incluam o campo `doc_id`, pois o dado não faz mais parte do modelo.

**Why this priority**: Prioridade secundária pois é consequência natural da remoção — mas importante para garantir que dados sensíveis não continuem sendo expostos na API.

**Independent Test**: Pode ser testado chamando os endpoints GET /api/integrantes e GET /api/integrantes/:id e verificando que o campo `doc_id` não está presente na resposta.

**Acceptance Scenarios**:

1. **Given** a API de integrantes está disponível, **When** o consumidor faz GET /api/integrantes, **Then** nenhum objeto na lista contém o campo `doc_id`.
2. **Given** a API de integrantes está disponível, **When** o consumidor faz GET /api/integrantes/:id, **Then** o objeto retornado não contém o campo `doc_id`.

---

### Edge Cases

- O que acontece com integrantes existentes que já possuem `doc_id` preenchido? O dado será removido da coluna no banco de dados durante a migração.
- O que acontece se existir código externo dependendo do campo `doc_id` na API? A remoção é uma breaking change — deve ser comunicada e documentada.
- O que acontece com a constraint unique no banco após a remoção? O índice único `integrantes_doc_id_key` será removido junto com a coluna.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema NÃO DEVE exibir campo de documento no formulário de cadastro de integrantes.
- **FR-002**: O sistema NÃO DEVE exibir campo de documento no formulário de edição de integrantes.
- **FR-003**: O sistema NÃO DEVE retornar o campo `doc_id` nas respostas da API de integrantes (listagem e detalhe).
- **FR-004**: O sistema NÃO DEVE validar ou exigir documento ao criar ou atualizar integrantes.
- **FR-005**: O sistema DEVE remover a coluna `doc_id` do modelo de dados de integrantes no banco de dados.
- **FR-006**: O sistema DEVE remover a verificação de duplicidade de documento ao criar ou atualizar integrantes.
- **FR-007**: O sistema DEVE validar unicidade do email ao criar ou atualizar integrantes (email será usado como identificador de login).
- **FR-008**: O sistema DEVE continuar funcionando normalmente para todas as demais funcionalidades de integrantes (listagem, criação, edição, exclusão) após a remoção.

### Key Entities

- **Integrantes**: Representa um membro da equipe de louvor. O campo `doc_id` (documento de identificação — CPF/RG) será removido. Todos os demais atributos (nome, email, telefone, senha, funções) permanecem inalterados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos formulários de integrantes (cadastro e edição) não exibem campo de documento.
- **SC-002**: 100% das respostas da API de integrantes não contêm o campo `doc_id`.
- **SC-003**: O cadastro de um novo integrante é concluído com sucesso sem informar documento.
- **SC-004**: Todos os testes automatizados existentes passam (adaptados para refletir a remoção do campo).
- **SC-005**: Nenhum erro é gerado no sistema ao acessar integrantes que anteriormente possuíam documento cadastrado.

## Clarifications

### Session 2026-02-25

- Q: O email deve ter constraint unique no banco? → A: Sim, email deve ser unique e será usado no login. (Nota: email já possui `@unique` no schema Prisma; a validação de duplicidade no service será adicionada.)

## Assumptions

- A cliente confirmou que o campo documento não é necessário e pode ser removido permanentemente.
- Não há integração externa que dependa do campo `doc_id`.
- A remoção da coluna do banco é definitiva — dados de documento existentes serão perdidos após a migração.
- Não é necessário manter histórico ou backup dos dados de documento removidos.
