# Feature Specification: Artista Opcional em Versão de Música

**Feature Branch**: `024-optional-artist-versao`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "Tornar o artista opcional ao criar uma versão de música, permitindo salvar com 'Não informado' ou sem versão vinculada, e impedir que a obrigatoriedade bloqueie o fluxo de cadastro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar versão sem artista (Priority: P1)

Como usuário, quero salvar uma versão de música sem informar o artista, para não ser bloqueado no fluxo de cadastro quando não conheço quem interpreta a música.

**Why this priority**: Este é o cenário raiz reportado pelo usuário Jonatas Sampaio — o sistema bloqueia o cadastro quando o artista não é conhecido. Resolver este cenário elimina imediatamente o problema reportado.

**Independent Test**: Pode ser testado criando uma versão via formulário ou API sem preencher o campo artista e verificando que a versão é salva com sucesso.

**Acceptance Scenarios**:

1. **Given** uma música existente no sistema, **When** o usuário cria uma versão sem informar `artista_id`, **Then** a versão é salva com sucesso e o artista fica como nulo
2. **Given** uma música existente no sistema, **When** o usuário cria uma versão informando `artista_id` de um artista válido, **Then** o comportamento permanece idêntico ao atual (versão salva com artista vinculado)
3. **Given** o formulário de criação de versão, **When** o campo artista está vazio, **Then** nenhum asterisco de obrigatoriedade é exibido e um placeholder "Não informado (opcional)" orienta o usuário

---

### User Story 2 - Visualizar versões sem artista na listagem (Priority: P2)

Como líder, quero ver claramente quais versões não têm artista identificado na listagem de versões de uma música, para saber quais precisam de complemento.

**Why this priority**: Após permitir versões sem artista, é essencial que a UI comunique claramente esse estado — sem isso, o usuário não sabe quais registros estão incompletos.

**Independent Test**: Pode ser testado criando uma versão sem artista e verificando que a listagem exibe "Não informado" no lugar do nome do artista.

**Acceptance Scenarios**:

1. **Given** uma versão sem artista vinculado, **When** o usuário visualiza a lista de versões de uma música, **Then** o campo artista exibe "Não informado" em estilo visual diferenciado (itálico ou cor secundária)
2. **Given** uma versão com artista vinculado, **When** o usuário visualiza a lista de versões, **Then** o nome do artista é exibido normalmente (sem mudança de comportamento)

---

### User Story 3 - Preencher artista posteriormente (Priority: P3)

Como usuário, quero poder editar uma versão que foi criada sem artista para adicionar o artista quando eu descobrir a informação.

**Why this priority**: Complementa o fluxo de P1 — permite que o cadastro incompleto seja completado depois, fechando o ciclo da funcionalidade.

**Independent Test**: Pode ser testado editando uma versão sem artista e adicionando um artista, verificando que a atualização é persistida.

**Acceptance Scenarios**:

1. **Given** uma versão existente sem artista, **When** o usuário edita a versão e seleciona um artista, **Then** o artista é vinculado à versão com sucesso
2. **Given** uma versão existente com artista, **When** o usuário edita a versão, **Then** o campo artista permanece preenchido e desabilitado (comportamento atual mantido — não é possível alterar ou remover artista já vinculado)

---

### Edge Cases

- O que acontece quando o usuário tenta criar duas versões sem artista para a mesma música? O sistema deve permitir no máximo uma versão sem artista por música, retornando erro de duplicata caso já exista uma.
- O que acontece quando o campo artista é enviado como string vazia na API? Deve ser tratado como nulo (sem artista).
- O que acontece nas listagens e selects que exibem versões (ex: futura seleção de versão em escalas)? Versões sem artista devem aparecer com label "Não informado" no select/dropdown.
- O que acontece com dados existentes? Nenhum dado existente é afetado — todas as versões atuais possuem artista preenchido; a mudança apenas relaxa a obrigatoriedade para novos registros.
- O que acontece ao deletar um artista que está vinculado a versões? Comportamento inalterado (cascade delete já existe).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE aceitar criação de versão sem `artista_id` tanto no endpoint dedicado de criação de versão quanto no endpoint de criação completa de música (quando campos de versão são preenchidos sem artista)
- **FR-002**: O sistema DEVE persistir versões com artista nulo no banco de dados
- **FR-003**: O sistema DEVE retornar `artista: null` em versões sem artista nos endpoints de leitura
- **FR-004**: O sistema DEVE limitar a 1 (uma) versão sem artista por música por tenant, com enforcement atômico via partial unique index no banco (`WHERE artista_id IS NULL`) e guard no service retornando erro de duplicata
- **FR-005**: O sistema DEVE tratar `artista_id` como string vazia ou nulo no corpo da requisição como "sem artista"
- **FR-006**: O formulário de versão DEVE exibir o campo artista como opcional, sem asterisco de obrigatoriedade, com placeholder "Não informado (opcional)"
- **FR-007**: A listagem de versões DEVE exibir "Não informado" para versões sem artista, em estilo visual diferenciado
- **FR-008**: A edição de versão DEVE permitir adicionar um artista a uma versão que foi criada sem artista (null → artista). Versões que já possuem artista DEVEM manter o campo desabilitado — não é permitido alterar ou remover artista já vinculado
- **FR-009**: Os testes unitários DEVEM cobrir cenários de criação com e sem `artista_id`

### Key Entities

- **Versão (Artistas_Musicas)**: Registro que vincula uma música a um artista com metadados (BPM, cifras, letras, link, intensidade). O atributo artista passa de obrigatório para opcional — uma versão pode existir sem artista identificado.
- **Artista (Artistas)**: Entidade de artista/intérprete. Sem alterações nesta feature — permanece como está.
- **Música (Musicas)**: Entidade principal de música. Sem alterações nesta feature — permanece como está.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos fluxos de criação de versão são concluídos com sucesso quando o artista não é informado, sem mensagens de erro de validação
- **SC-002**: Versões sem artista são exibidas corretamente em todas as listagens com indicação visual clara ("Não informado")
- **SC-003**: Usuários conseguem completar o cadastro de versão sem artista em tempo igual ou inferior ao cadastro com artista
- **SC-004**: Todos os testes unitários existentes continuam passando (regressão zero), e novos testes cobrem o cenário sem artista

## Clarifications

### Session 2026-04-04

- Q: Escopo da edição de artista em versões existentes — apenas adicionar (null → artista), ou também alterar/remover? → A: Apenas adicionar artista a versões sem artista (null → artista). Versões com artista mantêm campo desabilitado.

## Assumptions

- A abordagem escolhida é tornar `artista_id` nullable (nulo real no banco), em vez de criar um artista-sentinela "Desconhecido" por tenant. Isso é mais simples, evita dados artificiais no banco e facilita a identificação de registros incompletos.
- O índice único composto `[tenant_id, artista_id, musica_id]` será convertido em um índice parcial (apenas para registros com artista preenchido), pois o banco de dados trata NULLs como valores distintos em constraints unique. A mitigação de duplicatas sem artista será feita na camada de serviço (FR-004).
- A edição de versão atualmente não permite alterar o artista (campo desabilitado no frontend). Para suportar FR-008, o campo artista será habilitado na edição **apenas** quando a versão não tem artista vinculado (null → artista). Versões com artista mantêm o campo desabilitado.

## Scope Boundaries

**Dentro do escopo**:

- Tornar `artista_id` opcional no schema de validação de criação de versão
- Migration para tornar `artista_id` nullable na tabela `artistas_musicas`
- Atualização do frontend (formulário, listagem, schemas)
- Testes unitários atualizados

**Fora do escopo**:

- Busca de artistas em fontes externas (issue LF-10)
- Merge/deduplicação de artistas
- Criação de artista padrão "Desconhecido" por tenant (decisão: usar null em vez de sentinela)

## Dependencies

- **LF-1 (seleção de versão na escala)**: Se/quando implementado, o select de versão na escala deve exibir "Não informado" para versões sem artista. Esta feature não bloqueia LF-1, mas LF-1 deve considerar o cenário.
