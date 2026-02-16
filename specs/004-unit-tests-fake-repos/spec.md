# Feature Specification: Testes Unitários com Fake Repositories

**Feature Branch**: `004-unit-tests-fake-repos`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "crie os testes unitários, usando fake repositories com dados mockados dentro deste contexto da aplicação"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Testes dos Services CRUD simples (Priority: P1)

Um desenvolvedor deve poder executar testes unitários para os 4 services de CRUD simples (Tags, Tonalidades, Funções, Tipos de Eventos) e verificar que todas as validações de entrada, prevenção de duplicatas e operações CRUD funcionam corretamente sem dependência de banco de dados.

**Why this priority**: Estes services compartilham o mesmo padrão de validação (campo obrigatório + duplicata) e são a base para validar o padrão de fake repository. Uma vez que o padrão esteja funcionando aqui, pode ser replicado nos módulos mais complexos.

**Independent Test**: Pode ser testado executando `npm test` isoladamente. Cada service é independente e entrega cobertura de validação completa para operações CRUD básicas.

**Acceptance Scenarios**:

1. **Given** um fake repository vazio, **When** o service `listAll()` é chamado, **Then** retorna um array vazio
2. **Given** um fake repository com dados mockados, **When** o service `create()` é chamado com nome válido, **Then** o registro é criado e retornado com id gerado
3. **Given** um registro existente no fake repository, **When** o service `create()` é chamado com nome duplicado, **Then** lança AppError com statusCode 409
4. **Given** nenhum campo enviado, **When** o service `create()` é chamado com nome vazio/undefined, **Then** lança AppError com statusCode 400
5. **Given** um id inexistente, **When** o service `getById()` é chamado, **Then** lança AppError com statusCode 404
6. **Given** um registro existente, **When** o service `update()` é chamado com dados válidos, **Then** o registro é atualizado e retornado
7. **Given** um registro existente, **When** o service `delete()` é chamado, **Then** o registro é removido e retornado

---

### User Story 2 - Testes do Artistas Service (Priority: P1)

Um desenvolvedor deve poder executar testes unitários para o ArtistasService, verificando o padrão CRUD com prevenção de duplicatas por nome, incluindo a validação de exclusão por id diferente no update.

**Why this priority**: Mesmo nível de prioridade que P1 pois segue o mesmo padrão CRUD, mas com a particularidade de `findByNomeExcludingId` no update. Consolida o padrão de testes antes de avançar para services complexos.

**Independent Test**: Pode ser testado executando os testes do módulo artistas isoladamente.

**Acceptance Scenarios**:

1. **Given** um fake repository com artistas mockados, **When** `listAll()` é chamado, **Then** retorna todos os artistas
2. **Given** um artista existente "Aline Barros", **When** `create("Aline Barros")` é chamado, **Then** lança AppError 409
3. **Given** um artista existente, **When** `update(id, "Novo Nome")` é chamado com nome que já pertence a OUTRO artista, **Then** lança AppError 409
4. **Given** um artista existente, **When** `update(id, "Mesmo Nome")` é chamado com o próprio nome atual, **Then** atualiza sem erro

---

### User Story 3 - Testes do Integrantes Service (Priority: P2)

Um desenvolvedor deve poder executar testes unitários para o IntegrantesService, verificando hash de senha com bcrypt, normalização de doc_id, gerenciamento de funções dos integrantes e exclusão de campos sensíveis nas respostas.

**Why this priority**: Complexidade alta por envolver hashing de senha, normalização de dados e sub-recursos (funções). Valida padrões de segurança e transformação de dados.

**Independent Test**: Pode ser testado isoladamente. O bcrypt deve ser mockado para evitar lentidão nos testes.

**Acceptance Scenarios**:

1. **Given** dados válidos com senha, **When** `create()` é chamado, **Then** a senha é hasheada e o integrante retornado NÃO contém o campo senha
2. **Given** doc_id com formatação "123.456.789-00", **When** `create()` é chamado, **Then** o doc_id é normalizado para "12345678900"
3. **Given** um doc_id que já existe, **When** `create()` é chamado, **Then** lança AppError 409
4. **Given** campos nome, doc_id, email e senha todos ausentes, **When** `create()` é chamado, **Then** lança AppError 400 com múltiplas mensagens de erro
5. **Given** um integrante existente e uma função existente, **When** `addFuncao()` é chamado, **Then** a função é vinculada ao integrante
6. **Given** um integrante com função já vinculada, **When** `addFuncao()` é chamado com a mesma função, **Then** lança AppError 409
7. **Given** update com senha nova, **When** `update()` é chamado, **Then** a nova senha é hasheada antes de salvar

---

### User Story 4 - Testes do Musicas Service (Priority: P2)

Um desenvolvedor deve poder executar testes unitários para o MusicasService, verificando paginação, gerenciamento de versões por artista, vinculação de tags e funções, e normalização de dados da música.

**Why this priority**: Complexidade média-alta com paginação, 3 níveis de sub-recursos (versões, tags, funções) e normalização de dados do Prisma.

**Independent Test**: Pode ser testado isoladamente verificando paginação, sub-recursos e transformação de dados.

**Acceptance Scenarios**:

1. **Given** 25 músicas no fake repository, **When** `listAll(1, 10)` é chamado, **Then** retorna 10 itens com meta `{total: 25, page: 1, per_page: 10, total_pages: 3}`
2. **Given** limit maior que 100, **When** `listAll(1, 200)` é chamado, **Then** o limit é ajustado para 100
3. **Given** page menor que 1, **When** `listAll(0, 10)` é chamado, **Then** a page é ajustada para 1
4. **Given** uma música e um artista existentes, **When** `addVersao()` é chamado com artista_id válido, **Then** a versão é criada com bpm, cifras, lyrics e link_versao
5. **Given** uma versão já existente para o mesmo artista na mesma música, **When** `addVersao()` é chamado, **Then** lança AppError 409
6. **Given** uma música com nome e fk_tonalidade, **When** `create()` é chamado com tonalidade inexistente, **Then** lança AppError 404
7. **Given** uma música existente, **When** `getById()` é chamado, **Then** retorna música normalizada com arrays de versões, tags e funções

---

### User Story 5 - Testes do Eventos Service (Priority: P3)

Um desenvolvedor deve poder executar testes unitários para o EventosService, verificando validação de datas ISO 8601, formatação de dados para listagem e detalhe, e gerenciamento de músicas e integrantes escalados.

**Why this priority**: Service mais complexo com formatação de dados em dois níveis (index vs show), validação de datas e cascata de verificações para sub-recursos.

**Independent Test**: Pode ser testado isoladamente verificando todas as transformações de dados e validações de relacionamento.

**Acceptance Scenarios**:

1. **Given** dados com data inválida "não-é-uma-data", **When** `create()` é chamado, **Then** lança AppError 400
2. **Given** dados com data válida ISO 8601, **When** `create()` é chamado, **Then** o evento é criado com data convertida para Date
3. **Given** um evento existente, **When** `listAll()` é chamado, **Then** retorna eventos formatados com arrays simplificados de músicas (id, nome) e integrantes (id, nome)
4. **Given** um evento existente, **When** `getById()` é chamado, **Then** retorna evento formatado com músicas expandidas (id, nome, tonalidade) e integrantes expandidos (id, nome, funções)
5. **Given** um evento e uma música existentes, **When** `addMusica()` é chamado, **Then** a música é vinculada ao evento
6. **Given** uma música já vinculada ao evento, **When** `addMusica()` é chamado novamente, **Then** lança AppError 409
7. **Given** update sem nenhum campo preenchido, **When** `update()` é chamado, **Then** lança AppError 400
8. **Given** update com apenas descrição, **When** `update()` é chamado, **Then** atualiza somente a descrição mantendo os demais campos

---

### Edge Cases

- O que acontece quando o fake repository retorna null para um findById? O service deve lançar AppError 404.
- Como o sistema lida com IDs em formato inválido (não-UUID)? O service delega ao repository que retorna null, resultando em 404.
- O que acontece quando `listAll()` é chamado em um repository vazio? Deve retornar array vazio (ou objeto paginado vazio para músicas).
- Como o bcrypt se comporta nos testes? Deve ser mockado para retornar hash previsível e evitar lentidão.
- O que acontece ao tentar remover uma relação (tag/função/versão) que não existe? Deve lançar AppError 404.
- Como a normalização de doc_id lida com strings contendo apenas letras? Deve retornar string vazia (todos os caracteres removidos).
- O que acontece ao chamar `update()` com todos os campos undefined? Deve lançar AppError 400 exigindo ao menos um campo.

## Clarifications

### Session 2026-02-16

- Q: Qual framework de testes usar (Jest, Vitest ou outro)? → A: Vitest — suporte nativo a TypeScript, ESM e performance superior; API 95% compatível com Jest

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema de testes DEVE executar sem conexão com banco de dados, usando fake repositories em memória
- **FR-002**: Cada fake repository DEVE implementar a mesma interface pública do repository real correspondente
- **FR-003**: Os fake repositories DEVEM ser pré-carregados com dados mockados no contexto gospel/louvor (artistas como "Aline Barros", "Fernandinho"; músicas como "Rendido Estou"; tonalidades como "G", "D")
- **FR-004**: Cada método público de cada service DEVE ter ao menos um teste para o caminho de sucesso
- **FR-005**: Cada validação de entrada em cada service DEVE ter um teste que verifique o lançamento de AppError com o statusCode correto (400, 404 ou 409)
- **FR-006**: Os testes DEVEM verificar que o AppError lançado contém a mensagem correta em português
- **FR-007**: Os testes do IntegrantesService DEVEM mockar o bcrypt para evitar operações CPU-intensivas
- **FR-008**: Os testes do MusicasService DEVEM cobrir os limites de paginação (page mínima, limit máximo)
- **FR-009**: Os testes do EventosService DEVEM validar aceitação e rejeição de datas no formato ISO 8601
- **FR-010**: Os testes DEVEM ser organizados por módulo de service, com describe/it blocks descritivos em português
- **FR-011**: Os fake repositories DEVEM permitir reset de estado entre testes para garantir isolamento
- **FR-012**: Os testes DEVEM cobrir todas as operações de sub-recursos (versões, tags, funções em músicas; funções em integrantes; músicas e integrantes em eventos)

### Key Entities

- **Fake Repository**: Implementação em memória que substitui o repository real do Prisma, armazenando dados em arrays/maps internos e replicando as assinaturas de método do repository original
- **Dados Mockados**: Conjunto de dados de teste pré-definidos no contexto de um ministério de louvor, incluindo artistas gospel, músicas de adoração, tonalidades musicais, funções instrumentais e eventos de culto
- **AppError**: Classe de erro customizada com message, statusCode e array opcional de errors, usada para validação em todos os services

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos métodos públicos dos 8 services possuem ao menos um teste unitário
- **SC-002**: Todos os testes executam em menos de 10 segundos sem dependência de banco de dados
- **SC-003**: Cada validação de entrada (campo obrigatório, duplicata, não encontrado) possui teste dedicado que verifica statusCode e mensagem
- **SC-004**: Os dados mockados são coerentes com o domínio da aplicação (nomes de artistas, músicas e tonalidades reais do contexto gospel)
- **SC-005**: Os testes de sub-recursos cobrem ao menos: adicionar, listar e remover relação para cada tipo
- **SC-006**: O bcrypt é mockado nos testes de integrantes, eliminando latência de hashing
- **SC-007**: Cada teste é isolado — a execução de um teste não afeta o resultado de outro

### Assumptions

- O framework de testes é **Vitest** — escolhido por suporte nativo a TypeScript/ESM, performance superior e zero config
- Os fake repositories serão implementados como classes TypeScript com a mesma interface pública dos repositories reais
- O bcrypt será mockado via `vi.mock('bcryptjs')` do Vitest
- Os dados mockados usarão UUIDs fixos e previsíveis para facilitar asserções
- Os testes focam exclusivamente na camada de service — controllers e rotas não são escopo desta feature
