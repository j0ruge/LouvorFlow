# Tasks: Testes Unitários com Fake Repositories

**Input**: Design documents from `/specs/004-unit-tests-fake-repos/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Esta feature É inteiramente sobre testes — todos os artefatos de código são fake repositories e arquivos de teste.

**Organization**: Tasks agrupadas por user story para implementação e validação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story a que pertence (US1, US2, US3, US4, US5)
- Caminhos exatos incluídos nas descrições

## Path Conventions

- **Backend**: `src/backend/` (raiz do backend)
- **Tests**: `src/backend/tests/` (diretório de testes)
- **Fakes**: `src/backend/tests/fakes/` (fake repositories + dados)
- **Services tests**: `src/backend/tests/services/` (arquivos de teste)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalação do Vitest e configuração do projeto para testes

- [x] T001 Instalar Vitest como devDependency e adicionar scripts "test" e "test:watch" em `src/backend/package.json`
- [x] T002 Criar configuração do Vitest em `src/backend/vitest.config.ts` com globals, environment node, include `tests/**/*.test.ts` e testTimeout 10000
- [x] T003 Criar estrutura de diretórios `src/backend/tests/fakes/` e `src/backend/tests/services/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dados mockados centralizados que TODOS os fake repositories e testes dependem

**CRITICAL**: Nenhum fake repository ou teste pode ser implementado antes desta fase estar completa

- [x] T004 Criar arquivo de dados mockados centralizados em `src/backend/tests/fakes/mock-data.ts` com UUIDs fixos e dados do domínio gospel/louvor para todas as 8 entidades (tags, tonalidades, funcoes, tipos-eventos, artistas, integrantes, musicas com 25 registros para paginação, eventos) incluindo junction tables (Integrantes_Funcoes, Artistas_Musicas, Musicas_Tags, Musicas_Funcoes, Eventos_Musicas, Eventos_Integrantes) e constantes exportadas para uso nos fakes e nos testes

**Checkpoint**: Dados mockados prontos — implementação dos fake repositories pode começar

---

## Phase 3: User Story 1 — Testes dos Services CRUD Simples (Priority: P1) MVP

**Goal**: Testes unitários para os 4 services de CRUD simples (Tags, Tonalidades, Funções, Tipos de Eventos) cobrindo validações de entrada, prevenção de duplicatas e operações CRUD

**Independent Test**: `npx vitest run tests/services/tags.service.test.ts tests/services/tonalidades.service.test.ts tests/services/funcoes.service.test.ts tests/services/tipos-eventos.service.test.ts`

### Fake Repositories for User Story 1

- [x] T005 [P] [US1] Criar fake repository para Tags em `src/backend/tests/fakes/fake-tags.repository.ts` com factory function `createFakeTagsRepository()` implementando: findAll, findById, findByNome, findByNomeExcludingId, create, update, delete, reset — usando dados de mock-data.ts
- [x] T006 [P] [US1] Criar fake repository para Tonalidades em `src/backend/tests/fakes/fake-tonalidades.repository.ts` com factory function `createFakeTonalidadesRepository()` implementando: findAll, findById, findByTom, findByTomExcludingId, create, update, delete, reset — usando dados de mock-data.ts
- [x] T007 [P] [US1] Criar fake repository para Funcoes em `src/backend/tests/fakes/fake-funcoes.repository.ts` com factory function `createFakeFuncoesRepository()` implementando: findAll, findById, findByNome, findByNomeExcludingId, create, update, delete, reset — usando dados de mock-data.ts
- [x] T008 [P] [US1] Criar fake repository para TiposEventos em `src/backend/tests/fakes/fake-tipos-eventos.repository.ts` com factory function `createFakeTiposEventosRepository()` implementando: findAll, findById, findByNome, findByNomeExcludingId, create, update, delete, reset — usando dados de mock-data.ts

### Tests for User Story 1

- [x] T009 [P] [US1] Criar testes do TagsService em `src/backend/tests/services/tags.service.test.ts` com vi.mock do repository, beforeEach reset, e cobertura completa: listAll (vazio + com dados), getById (sucesso + 400 sem id + 404 inexistente), create (sucesso + 400 sem nome + 409 duplicata), update (sucesso + 400 sem id + 404 inexistente + 400 sem nome + 409 duplicata), delete (sucesso + 400 sem id + 404 inexistente) — describe/it em português, verificando message e statusCode do AppError
- [x] T010 [P] [US1] Criar testes do TonalidadesService em `src/backend/tests/services/tonalidades.service.test.ts` com vi.mock do repository, beforeEach reset, e cobertura completa: listAll, getById (sucesso + 400 + 404), create (sucesso + 400 sem tom + 409 duplicata), update (sucesso + 400 sem id + 404 + 400 sem tom + 409 duplicata), delete (sucesso + 400 + 404) — describe/it em português
- [x] T011 [P] [US1] Criar testes do FuncoesService em `src/backend/tests/services/funcoes.service.test.ts` com vi.mock do repository, beforeEach reset, e cobertura completa: listAll, getById (sucesso + 400 + 404), create (sucesso + 400 sem nome + 409), update (sucesso + 400 sem id + 404 + 400 sem nome + 409), delete (sucesso + 400 + 404) — describe/it em português
- [x] T012 [P] [US1] Criar testes do TiposEventosService em `src/backend/tests/services/tipos-eventos.service.test.ts` com vi.mock do repository, beforeEach reset, e cobertura completa: listAll, getById (sucesso + 400 + 404), create (sucesso + 400 sem nome + 409), update (sucesso + 400 sem id + 404 + 400 sem nome + 409), delete (sucesso + 400 + 404) — describe/it em português
- [x] T013 [US1] Executar `npx vitest run` no diretório `src/backend/` e validar que todos os testes de US1 passam com 0 falhas

**Checkpoint**: 4 services CRUD simples com cobertura completa de testes. Padrão de fake repository validado e pronto para replicação.

---

## Phase 4: User Story 2 — Testes do Artistas Service (Priority: P1)

**Goal**: Testes unitários para o ArtistasService com padrão CRUD + validação `findByNomeExcludingId` no update

**Independent Test**: `npx vitest run tests/services/artistas.service.test.ts`

### Fake Repository for User Story 2

- [x] T014 [US2] Criar fake repository para Artistas em `src/backend/tests/fakes/fake-artistas.repository.ts` com factory function `createFakeArtistasRepository()` implementando: findAll, findById (com array de músicas/versões), findByIdSimple, findByNome, findByNomeExcludingId, create (retorna full Artistas), update (retorna full Artistas), delete, reset — usando dados de mock-data.ts

### Tests for User Story 2

- [x] T015 [US2] Criar testes do ArtistasService em `src/backend/tests/services/artistas.service.test.ts` com vi.mock do repository, beforeEach reset, e cobertura: listAll (retorna todos), getById (sucesso com músicas + 400 sem id + 404), create (sucesso retornando {id,nome} + 400 sem nome + 409 duplicata "Aline Barros"), update (sucesso + 400 sem id + 404 + 400 sem nome + 409 nome de outro artista + sucesso com próprio nome atual), delete (sucesso + 400 + 404) — describe/it em português
- [x] T016 [US2] Executar `npx vitest run` e validar que todos os testes de US1 + US2 passam

**Checkpoint**: ArtistasService testado. Padrão `findByNomeExcludingId` consolidado.

---

## Phase 5: User Story 3 — Testes do Integrantes Service (Priority: P2)

**Goal**: Testes unitários para o IntegrantesService com hash de senha (bcrypt mockado), normalização de doc_id, sub-recurso funções e exclusão de campos sensíveis

**Independent Test**: `npx vitest run tests/services/integrantes.service.test.ts`

### Fake Repository for User Story 3

- [x] T017 [US3] Criar fake repository para Integrantes em `src/backend/tests/fakes/fake-integrantes.repository.ts` com factory function `createFakeIntegrantesRepository()` implementando: findAll (com Integrantes_Funcoes), findById (com Integrantes_Funcoes), findByIdSimple, findByIdPublic (sem senha), findByDocId, findByDocIdExcludingId, create (retorna público sem senha), update (retorna público sem senha), delete, findFuncoesByIntegranteId, findIntegranteFuncao, createIntegranteFuncao, deleteIntegranteFuncao, findFuncaoById, reset — usando dados de mock-data.ts

### Tests for User Story 3

- [x] T018 [US3] Criar testes do IntegrantesService em `src/backend/tests/services/integrantes.service.test.ts` com vi.mock do repository E vi.mock('bcryptjs') retornando hash determinístico, beforeEach reset. Cobertura: listAll (com funcoes mapeadas), getById (sucesso com funcoes + 400 + 404), create (sucesso com senha hasheada e sem campo senha no retorno + normalização doc_id "123.456.789-00" → "12345678900" + 400 dados ausentes com múltiplos erros + 409 doc_id duplicata), update (sucesso + 400 sem id + 404 + 400 nenhum dado + 409 doc_id duplicata + sucesso com nova senha hasheada), delete (sucesso + 400 + 404), listFuncoes (retorna funcoes mapeadas), addFuncao (sucesso + 400 sem funcao_id + 404 integrante não encontrado + 404 funcao não encontrada + 409 duplicata), removeFuncao (sucesso + 404 registro não encontrado) — describe/it em português
- [x] T019 [US3] Executar `npx vitest run` e validar que todos os testes de US1 + US2 + US3 passam

**Checkpoint**: IntegrantesService testado com bcrypt mockado e sub-recurso funções coberto.

---

## Phase 6: User Story 4 — Testes do Musicas Service (Priority: P2)

**Goal**: Testes unitários para o MusicasService com paginação, 3 sub-recursos (versões, tags, funções) e normalização de dados

**Independent Test**: `npx vitest run tests/services/musicas.service.test.ts`

### Fake Repository for User Story 4

- [x] T020 [US4] Criar fake repository para Musicas em `src/backend/tests/fakes/fake-musicas.repository.ts` com factory function `createFakeMusicasRepository()` implementando: findAll(skip, take), count, findById (com MUSICA_SELECT completo), findByIdSimple, findByIdNameOnly, create, update, delete, findVersoes, findVersaoById, createVersao, updateVersao, deleteVersao, findVersaoDuplicate, findArtistaById, findTags, createTag, deleteTag, findTagDuplicate, findTagById, findFuncoes, createFuncao, deleteFuncao, findFuncaoDuplicate, findFuncaoById, reset — 25 músicas para teste de paginação, usando dados de mock-data.ts. IMPORTANTE: também precisa do mock do tonalidadesRepository (MusicasService importa dois repositories)

### Tests for User Story 4

- [x] T021 [US4] Criar testes do MusicasService em `src/backend/tests/services/musicas.service.test.ts` com vi.mock de musicasRepository E tonalidadesRepository, beforeEach reset. Cobertura: listAll (25 músicas paginação page=1 limit=10 retorna 10 itens com meta {total:25, page:1, per_page:10, total_pages:3} + limit>100 ajustado para 100 + page<1 ajustado para 1), getById (sucesso normalizado com arrays versoes/tags/funcoes + 400 + 404), create (sucesso + 400 sem nome + 400 sem tonalidade + 404 tonalidade inexistente), update (sucesso + 400 + 404 musica + 404 tonalidade), delete (sucesso + 400 + 404), listVersoes, addVersao (sucesso + 400 sem artista_id + 404 musica + 404 artista + 409 duplicata), updateVersao (sucesso + 404), removeVersao (sucesso + 404), listTags, addTag (sucesso + 400 + 404 musica + 404 tag + 409), removeTag (sucesso + 404), listFuncoes, addFuncao (sucesso + 400 + 404 musica + 404 funcao + 409), removeFuncao (sucesso + 404) — describe/it em português
- [x] T022 [US4] Executar `npx vitest run` e validar que todos os testes de US1 + US2 + US3 + US4 passam

**Checkpoint**: MusicasService testado com paginação e 3 sub-recursos cobertos.

---

## Phase 7: User Story 5 — Testes do Eventos Service (Priority: P3)

**Goal**: Testes unitários para o EventosService com validação de datas ISO 8601, formatação em 2 níveis (index/show) e sub-recursos músicas/integrantes

**Independent Test**: `npx vitest run tests/services/eventos.service.test.ts`

### Fake Repository for User Story 5

- [x] T023 [US5] Criar fake repository para Eventos em `src/backend/tests/fakes/fake-eventos.repository.ts` com factory function `createFakeEventosRepository()` implementando: findAll (com EVENTO_INDEX_SELECT incluindo músicas e integrantes simplificados), findById (com EVENTO_SHOW_SELECT expandido), findByIdSimple, findByIdForDelete, create (com tipo_evento joined), update (com tipo_evento joined), delete, findMusicas, createMusica, deleteMusica, findMusicaDuplicate, findMusicaById, findIntegrantes, createIntegrante, deleteIntegrante, findIntegranteDuplicate, findIntegranteById, reset — usando dados de mock-data.ts

### Tests for User Story 5

- [x] T024 [US5] Criar testes do EventosService em `src/backend/tests/services/eventos.service.test.ts` com vi.mock do repository, beforeEach reset. Cobertura: listAll (retorna eventos formatados index com arrays simplificados {id,nome} de músicas e integrantes), getById (sucesso formatado show com músicas expandidas {id,nome,tonalidade} e integrantes expandidos {id,nome,funcoes} + 400 + 404), create (sucesso com data ISO 8601 convertida para Date + 400 data inválida "não-é-uma-data" + 400 campos ausentes com array de erros), update (sucesso + 400 sem id + 404 + 400 data inválida + 400 nenhum campo + sucesso com apenas descrição), delete (sucesso + 400 + 404), listMusicas (sucesso + 404 evento), addMusica (sucesso + 400 sem musicas_id + 404 evento + 404 música + 409 duplicata), removeMusica (sucesso + 404), listIntegrantes (sucesso + 404 evento), addIntegrante (sucesso + 400 sem fk_integrante_id + 404 evento + 404 integrante + 409 duplicata), removeIntegrante (sucesso + 404) — describe/it em português
- [x] T025 [US5] Executar `npx vitest run` e validar que todos os testes de US1 + US2 + US3 + US4 + US5 passam

**Checkpoint**: Todos os 8 services testados. EventosService coberto com validação ISO 8601 e formatação em 2 níveis.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validação final e verificação dos critérios de sucesso

- [x] T026 Executar `npx vitest run` no diretório `src/backend/` e validar que TODOS os testes passam em < 10 segundos (SC-002), verificar contagem total de testes vs SC-001 (100% dos métodos públicos cobertos)
- [x] T027 Validar isolamento dos testes executando `npx vitest run --sequence.shuffle` para confirmar que nenhum teste depende da ordem de execução (SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Setup (T001-T003) — BLOQUEIA todos os fake repos e testes
- **US1 (Phase 3)**: Depende de Foundational (T004) — MVP, padrão de referência
- **US2 (Phase 4)**: Depende de Foundational (T004) — pode rodar em paralelo com US1
- **US3 (Phase 5)**: Depende de Foundational (T004) — pode rodar em paralelo com US1/US2
- **US4 (Phase 6)**: Depende de Foundational (T004) — precisa do fake de tonalidades (T006 de US1) para mock do tonalidadesRepository
- **US5 (Phase 7)**: Depende de Foundational (T004) — independente dos demais
- **Polish (Phase 8)**: Depende de TODAS as user stories concluídas

### User Story Dependencies

- **US1 (P1)**: Independente — sem dependência de outras stories
- **US2 (P1)**: Independente — sem dependência de outras stories
- **US3 (P2)**: Independente — sem dependência de outras stories
- **US4 (P2)**: Depende parcialmente de US1 (reutiliza fake-tonalidades.repository.ts do T006)
- **US5 (P3)**: Independente — sem dependência de outras stories

### Within Each User Story

1. Fake repository primeiro (depende de mock-data.ts)
2. Arquivo de teste depois (depende do fake repository correspondente)
3. Validação (executar testes e confirmar 0 falhas)

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 podem rodar em paralelo (setup independente)
- **Phase 3**: T005-T008 (4 fake repos) podem rodar em paralelo; T009-T012 (4 tests) podem rodar em paralelo após os fakes
- **Phase 4-7**: User stories US1, US2, US3, US5 podem rodar em paralelo (US4 depende parcialmente de US1)

---

## Parallel Example: User Story 1

```bash
# Fase 1: Criar os 4 fake repos em paralelo (arquivos independentes):
Task: "Fake tags repository em src/backend/tests/fakes/fake-tags.repository.ts"
Task: "Fake tonalidades repository em src/backend/tests/fakes/fake-tonalidades.repository.ts"
Task: "Fake funcoes repository em src/backend/tests/fakes/fake-funcoes.repository.ts"
Task: "Fake tipos-eventos repository em src/backend/tests/fakes/fake-tipos-eventos.repository.ts"

# Fase 2: Criar os 4 test files em paralelo (arquivos independentes):
Task: "Tests TagsService em src/backend/tests/services/tags.service.test.ts"
Task: "Tests TonalidadesService em src/backend/tests/services/tonalidades.service.test.ts"
Task: "Tests FuncoesService em src/backend/tests/services/funcoes.service.test.ts"
Task: "Tests TiposEventosService em src/backend/tests/services/tipos-eventos.service.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational mock-data.ts (T004)
3. Complete Phase 3: US1 — 4 fake repos + 4 test files (T005-T013)
4. **STOP and VALIDATE**: `npx vitest run` — testes passam?
5. Padrão de fake repository validado e pronto para replicação

### Incremental Delivery

1. Setup + Foundational → Infraestrutura pronta
2. US1 (4 CRUD simples) → Validar padrão → **56 test cases**
3. US2 (Artistas) → Validar findByNomeExcludingId → **+13 test cases**
4. US3 (Integrantes) → Validar bcrypt mock + sub-recurso → **+17 test cases**
5. US4 (Musicas) → Validar paginação + 3 sub-recursos → **+22 test cases**
6. US5 (Eventos) → Validar ISO 8601 + formatação → **+22 test cases**
7. Polish → Validação final de performance e isolamento

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências mútuas
- [Story] label mapeia task à user story para rastreabilidade
- Cada user story deve ser completável e testável independentemente
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar a story
- Evitar: tasks vagas, conflitos no mesmo arquivo, dependências cross-story que quebrem independência
