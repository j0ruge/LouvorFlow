# Tasks: Artista Opcional em Versão de Música

**Input**: Design documents from `/specs/024-optional-artist-versao/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídos conforme FR-009 da spec (testes unitários obrigatórios).

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story associada (US1, US2, US3)
- Caminhos exatos incluídos nas descrições

## Path Conventions

- **Backend**: `packages/backend/`
- **Frontend**: `packages/frontend/`

---

## Phase 1: Setup (Database & Schema)

**Purpose**: Migration e regeneração do Prisma Client — pré-requisito para todas as camadas.

- [x] T001 Criar migration SQL para tornar `artista_id` nullable, dropar unique index antigo e criar partial unique index em `packages/backend/prisma/migrations/<timestamp>_make_artista_id_optional/migration.sql`
- [x] T002 Atualizar model `Artistas_Musicas` em `packages/backend/prisma/schema.prisma`: `artista_id String? @db.Uuid`, relação `Artistas?`, remover `@@unique([tenant_id, artista_id, musica_id])`
- [x] T003 Executar `npx prisma generate` em `packages/backend/` para regenerar Prisma Client

**Checkpoint**: Prisma Client regenerado com `artista_id` nullable. Banco aceita versões sem artista.

---

## Phase 2: Foundational (Backend Types + Validators)

**Purpose**: Tipos e validação que todas as user stories dependem.

**CRITICAL**: Nenhuma user story pode começar antes desta fase.

- [x] T004 [P] Atualizar interface `VersaoRaw` em `packages/backend/src/types/index.ts`: `artistas_musicas_artista_id_fkey: IdNome | null`
- [x] T005 [P] Atualizar interface `Musica` em `packages/backend/src/types/index.ts`: `versoes[].artista: IdNome | null`
- [x] T006 [P] Atualizar `addVersaoBodySchema` em `packages/backend/src/validators/musicas.validators.ts`: `artista_id` com `z.preprocess` (empty→undefined) + `.string().uuid().optional()`
- [x] T007 [P] Atualizar `updateVersaoBodySchema` em `packages/backend/src/validators/musicas.validators.ts`: adicionar `artista_id` como `z.preprocess` (empty→undefined) + `.string().uuid().optional()`

**Checkpoint**: Tipos e validators aceitam `artista_id` nullable/opcional. Compilação TypeScript sem erros.

---

## Phase 3: User Story 1 - Criar versão sem artista (Priority: P1) MVP

**Goal**: Permitir criação de versão sem artista via API e formulário, com guard de duplicata (max 1 null por música).

**Independent Test**: `POST /api/musicas/:id/versoes` sem `artista_id` retorna 201 com `artista: null`.

### Tests for User Story 1

- [x] T008 [P] [US1] Adicionar mock entry com `artista_id: null` em `packages/backend/tests/fakes/mock-data.ts`
- [x] T009 [P] [US1] Atualizar `createVersao` no fake para aceitar `artista_id` null e resolver `artistas_musicas_artista_id_fkey` como null em `packages/backend/tests/fakes/fake-musicas.repository.ts`
- [x] T010 [P] [US1] Adicionar método fake `findVersaoWithoutArtist(musicaId)` em `packages/backend/tests/fakes/fake-musicas.repository.ts`
- [x] T011 [US1] Adicionar test case "deve criar versão sem artista" em `packages/backend/tests/services/musicas.service.test.ts`
- [x] T012 [US1] Adicionar test case "deve rejeitar segunda versão sem artista para mesma música (409)" em `packages/backend/tests/services/musicas.service.test.ts`
- [x] T013 [US1] Atualizar test case existente "deve lançar AppError 400 quando artista_id não é enviado" → remover ou inverter expectativa em `packages/backend/tests/services/musicas.service.test.ts`
- [x] T014 [US1] Adicionar test case "deve criar música completa sem artista quando campos de versão preenchidos" em `packages/backend/tests/services/musicas.service.test.ts`

### Implementation for User Story 1

- [x] T015 [P] [US1] Adicionar método `findVersaoWithoutArtist(musicaId: string)` em `packages/backend/src/repositories/musicas.repository.ts`
- [x] T016 [P] [US1] Atualizar `createVersao` em `packages/backend/src/repositories/musicas.repository.ts`: aceitar `artista_id: string | null | undefined`, select condicional do artista (retornar null quando artista_id é null)
- [x] T017 [US1] Atualizar `addVersao` em `packages/backend/src/services/musicas.service.ts`: remover guard `if (!artista_id) throw AppError`, adicionar lógica condicional — com artista: validar existência + duplicata normal; sem artista: verificar via `findVersaoWithoutArtist` → 409 se já existe
- [x] T018 [US1] Atualizar `createComplete` em `packages/backend/src/services/musicas.service.ts`: remover guard `temCamposVersao && !artista_id`, permitir criação de versão mesmo sem artista quando campos de versão estão presentes
- [x] T019 [US1] Atualizar `createWithVersao` em `packages/backend/src/repositories/musicas.repository.ts`: criar row `artistas_musicas` mesmo quando `artista_id` é null, condição de criação baseada em presença de qualquer campo de versão
- [x] T020 [P] [US1] Atualizar `VersaoSchema` em `packages/frontend/src/schemas/musica.ts`: `artista: IdNomeSchema.nullable()`
- [x] T021 [P] [US1] Atualizar `CreateVersaoFormSchema` em `packages/frontend/src/schemas/musica.ts`: `artista_id` opcional com `.string().uuid().optional().or(z.literal(""))`
- [x] T022 [US1] Remover `superRefine` em `CreateMusicaCompleteFormSchema` em `packages/frontend/src/schemas/musica.ts` que exige artista quando campos de versão preenchidos
- [x] T023 [US1] Atualizar `VersaoForm.tsx` em `packages/frontend/src/components/VersaoForm.tsx`: Select artista sem asterisco, placeholder "Não informado (opcional)", campo não obrigatório
- [x] T024 [US1] Atualizar `MusicaForm.tsx` em `packages/frontend/src/components/MusicaForm.tsx`: label artista com "(opcional)"

**Checkpoint**: Versão pode ser criada sem artista via API e formulário. Testes passam. MVP funcional.

---

## Phase 4: User Story 2 - Visualizar versões sem artista na listagem (Priority: P2)

**Goal**: Exibir "Não informado" com estilo diferenciado para versões sem artista na listagem.

**Independent Test**: Versão sem artista aparece com "Não informado" em itálico/cor secundária em `MusicaDetail`.

### Implementation for User Story 2

- [x] T025 [US2] Atualizar renderização de `versao.artista.nome` em `packages/frontend/src/components/MusicaDetail.tsx`: null check, exibir "Não informado" com `text-muted-foreground italic` quando `versao.artista` é null

**Checkpoint**: Listagem exibe corretamente versões com e sem artista. US1 + US2 funcionais.

---

## Phase 5: User Story 3 - Preencher artista posteriormente (Priority: P3)

**Goal**: Permitir adicionar artista a uma versão existente sem artista (null → artista). Campo desabilitado quando artista já vinculado.

**Independent Test**: Editar versão sem artista, selecionar artista, salvar — artista vinculado com sucesso.

### Tests for User Story 3

- [x] T026 [US3] Adicionar test case "deve aceitar artista_id no update quando versão não tem artista" em `packages/backend/tests/services/musicas.service.test.ts`
- [x] T027 [US3] Adicionar test case "deve retornar AppError 400 'Não é permitido alterar artista já vinculado' quando artista_id enviado no update de versão que já possui artista" em `packages/backend/tests/services/musicas.service.test.ts`

### Implementation for User Story 3

- [x] T028 [US3] Atualizar `updateVersao` em `packages/backend/src/services/musicas.service.ts`: aceitar `artista_id` no body, validar existência do artista, rejeitar se versão já possui artista, conectar artista via Prisma update
- [x] T029 [US3] Atualizar `updateVersao` em `packages/backend/src/repositories/musicas.repository.ts`: suportar `artista_id` no data de update (connect relation)
- [x] T030 [US3] Atualizar `VersaoForm.tsx` em `packages/frontend/src/components/VersaoForm.tsx`: habilitar Select artista na edição quando `versao.artista` é null, manter desabilitado quando artista existe
- [x] T031 [US3] Atualizar `UpdateVersaoFormSchema` em `packages/frontend/src/schemas/musica.ts`: adicionar `artista_id` como campo opcional

**Checkpoint**: Todas as 3 user stories funcionais e testáveis independentemente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, docstrings e validação final.

- [x] T032 [P] Atualizar `packages/backend/docs/openapi.json`: `artista_id` opcional no request de POST versão e PUT versão, `artista` nullable no response de versões
- [x] T033 [P] Adicionar docstrings JSDoc PT-BR em todos os métodos novos/modificados: `findVersaoWithoutArtist`, `addVersao` (atualizado), `createComplete` (atualizado), `updateVersao` (atualizado)
- [x] T034 Executar `npm test` em `packages/backend` — todos os testes devem passar (regressão zero + novos cenários)
- [x] T035 Executar `npx tsc --noEmit` em ambos packages — sem erros de tipo
- [x] T036 Executar `npm run build` em `packages/frontend` — build sem erros

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 (T003 Prisma generate) — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 — MVP
- **US2 (Phase 4)**: Depende de Phase 2 + parcialmente de T020 (VersaoSchema nullable do US1)
- **US3 (Phase 5)**: Depende de Phase 2 + T015-T016 (repository do US1)
- **Polish (Phase 6)**: Depende de todas as user stories

### User Story Dependencies

- **User Story 1 (P1)**: Depende apenas de Phase 2. MVP autossuficiente.
- **User Story 2 (P2)**: Depende de Phase 2 + `VersaoSchema` nullable (T020 do US1). Pode iniciar em paralelo com US1 se T020 for feito primeiro.
- **User Story 3 (P3)**: Depende de Phase 2 + repository methods (T015-T016 do US1). Pode iniciar em paralelo com US2.

### Within Each User Story

- Testes escritos antes da implementação (FAIL first)
- Repository antes de Service
- Service antes de Frontend
- Backend antes de Frontend

### Parallel Opportunities

- T004, T005, T006, T007 (Phase 2) — todos em paralelo (arquivos diferentes)
- T008, T009, T010 (US1 test setup) — todos em paralelo
- T015, T016 (US1 repository) — em paralelo
- T020, T021 (US1 frontend schemas) — em paralelo
- T032, T033 (Polish docs) — em paralelo

---

## Parallel Example: User Story 1

```text
# Batch 1 — Test setup (paralelo):
T008: Mock data com artista_id null
T009: Fake createVersao aceita null
T010: Fake findVersaoWithoutArtist

# Batch 2 — Repository (paralelo):
T015: findVersaoWithoutArtist real
T016: createVersao aceita null

# Batch 3 — Service (sequencial):
T017: addVersao sem guard obrigatório
T018: createComplete sem guard obrigatório
T019: createWithVersao aceita null

# Batch 4 — Frontend schemas (paralelo):
T020: VersaoSchema nullable
T021: CreateVersaoFormSchema opcional

# Batch 5 — Frontend components (sequencial):
T022: Remover superRefine
T023: VersaoForm opcional
T024: MusicaForm label
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration + schema)
2. Complete Phase 2: Foundational (types + validators)
3. Complete Phase 3: User Story 1 (criar versão sem artista)
4. **STOP and VALIDATE**: Testar criação via API + formulário
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Base pronta
2. User Story 1 → Testar independentemente → Deploy (MVP!)
3. User Story 2 → Testar independentemente → Deploy (listagem "Não informado")
4. User Story 3 → Testar independentemente → Deploy (edição null→artista)
5. Polish → Documentação + validação final

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task à user story para rastreabilidade
- Cada user story é independentemente completável e testável
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
