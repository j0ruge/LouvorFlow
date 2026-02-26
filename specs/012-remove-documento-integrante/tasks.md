# Tasks: Remover Campo Documento de Integrantes

**Input**: Design documents from `/specs/012-remove-documento-integrante/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/integrantes.yaml

**Tests**: Testes existentes serão **atualizados** (não são novos) — fazem parte da implementação.

**Organization**: Tasks organizadas por user story para implementação e teste independentes.

**DB Context**: Tabela `eventos_integrantes` (id, evento_id, fk_integrante_id, created_at, updated_at) — relacionamento intacto, sem impacto pela remoção de `doc_id`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story associada (US1, US2, US3)
- Paths exatos incluídos nas descrições

---

## Phase 1: Setup (Schema & Migration)

**Purpose**: Remover `doc_id` do modelo de dados e gerar migration Prisma

- [x] T001 Remover campo `doc_id String @unique` do model `Integrantes` em `packages/backend/prisma/schema.prisma`
- [x] T002 Gerar e aplicar migration Prisma com `npx prisma migrate dev --name remove-doc-id` em `packages/backend/`
- [x] T003 Verificar regeneração do Prisma Client com `npx prisma generate` em `packages/backend/`

**Checkpoint**: Coluna `doc_id` e índice `integrantes_doc_id_key` removidos do banco. Prisma Client atualizado.

---

## Phase 2: Foundational (Backend Types & Repository)

**Purpose**: Atualizar types compartilhados e camada de repositório — pré-requisito para todas as user stories

**⚠️ CRITICAL**: Nenhuma user story pode iniciar antes desta fase estar completa

- [x] T004 [P] Remover `doc_id: string` de `IntegranteWithFuncoes` e `doc_id: true` de `INTEGRANTE_PUBLIC_SELECT` em `packages/backend/src/types/index.ts`
- [x] T005 Remover métodos `findByDocId()` e `findByDocIdExcludingId()` em `packages/backend/src/repositories/integrantes.repository.ts`
- [x] T006 Adicionar método `findByEmail(email: string)` que busca integrante por email em `packages/backend/src/repositories/integrantes.repository.ts`
- [x] T007 Adicionar método `findByEmailExcludingId(email: string, excludeId: string)` que busca integrante por email excluindo um ID em `packages/backend/src/repositories/integrantes.repository.ts`

**Checkpoint**: Types e repository atualizados. Métodos de busca por email disponíveis.

---

## Phase 3: User Story 1 — Cadastro de integrante sem documento (Priority: P1) 🎯 MVP

**Goal**: Permitir cadastro de integrantes sem campo documento. Adicionar validação de unicidade de email no service.

**Independent Test**: Criar integrante via POST /api/integrantes sem campo `doc_id` — deve retornar 201 com sucesso.

### Implementation for User Story 1

- [x] T008 [US1] Remover normalização de `doc_id` (`.replace(/\D/g, '')`) e checagem de duplicidade de `doc_id` no método `create()` em `packages/backend/src/services/integrantes.service.ts`
- [x] T009 [US1] Adicionar checagem de duplicidade de email via `findByEmail()` no método `create()` com erro 409 "Já existe um integrante com esse email" em `packages/backend/src/services/integrantes.service.ts`
- [x] T010 [P] [US1] Remover propriedade `doc_id` dos 3 objetos em `MOCK_INTEGRANTES` em `packages/backend/tests/fakes/mock-data.ts`
- [x] T011 [P] [US1] Remover `doc_id` de `buildWithFuncoes()` e `buildPublic()`, remover métodos `findByDocId()` e `findByDocIdExcludingId()`, adicionar métodos `findByEmail()` e `findByEmailExcludingId()` em `packages/backend/tests/fakes/fake-integrantes.repository.ts`
- [x] T012 [US1] Remover testes de normalização e duplicidade de `doc_id` no create, adicionar teste de duplicidade de email no create em `packages/backend/tests/services/integrantes.service.test.ts`

**Checkpoint**: Cadastro de integrantes funciona sem `doc_id`. Email duplicado retorna 409.

---

## Phase 4: User Story 2 — Edição de integrante sem campo documento (Priority: P1)

**Goal**: Permitir edição de integrantes sem campo documento. Adicionar validação de unicidade de email no update.

**Independent Test**: Editar integrante via PUT /api/integrantes/:id sem campo `doc_id` — deve retornar 200 com sucesso.

### Implementation for User Story 2

- [x] T013 [US2] Remover normalização de `doc_id` e checagem de duplicidade de `doc_id` no método `update()` em `packages/backend/src/services/integrantes.service.ts`
- [x] T014 [US2] Adicionar checagem de duplicidade de email via `findByEmailExcludingId()` no método `update()` (quando email é alterado) com erro 409 em `packages/backend/src/services/integrantes.service.ts`
- [x] T015 [US2] Remover testes de normalização e duplicidade de `doc_id` no update, adicionar teste de duplicidade de email no update em `packages/backend/tests/services/integrantes.service.test.ts`

**Checkpoint**: Edição de integrantes funciona sem `doc_id`. Email duplicado no update retorna 409.

---

## Phase 5: User Story 3 — Respostas da API sem campo documento (Priority: P2)

**Goal**: Garantir que API não expõe `doc_id` nas respostas e que o frontend não exibe/envia o campo.

**Independent Test**: GET /api/integrantes e GET /api/integrantes/:id — nenhum objeto contém `doc_id`.

> **Nota**: A mudança no backend que remove `doc_id` das respostas da API já foi realizada em T004 (Phase 2 — remoção de `INTEGRANTE_PUBLIC_SELECT.doc_id`). Esta fase cobre apenas o lado **frontend** (schemas Zod e formulário).

### Implementation for User Story 3

- [x] T016 [P] [US3] Remover `doc_id` dos schemas `IntegranteComFuncoesSchema`, `IntegranteResponseSchema`, `CreateIntegranteFormSchema` e `UpdateIntegranteFormSchema` em `packages/frontend/src/schemas/integrante.ts`
- [x] T017 [P] [US3] Remover campo "Documento" do formulário (FormField com name="doc_id"), remover `doc_id` dos default values, do useEffect de edição e do reset em `packages/frontend/src/components/IntegranteForm.tsx`

**Checkpoint**: Frontend não exibe campo documento. Schemas Zod não incluem `doc_id`.

---

## Phase 6: Polish & Validação Final

**Purpose**: Verificação cruzada de todas as mudanças e atualização de documentação

- [x] T018 Executar `npm test` no backend (`packages/backend/`) e confirmar que todos os testes passam
- [x] T019 Executar `npm test` no frontend (`packages/frontend/`) e confirmar que todos os testes passam
- [x] T020 Smoke test via API: POST /api/integrantes sem `doc_id` — verificar 201 com sucesso
- [x] T021 Smoke test via API: GET /api/integrantes — verificar ausência de `doc_id` na resposta
- [x] T022 Smoke test via API: POST /api/integrantes com email duplicado — verificar erro 409
- [x] T023 Atualizar `packages/backend/docs/openapi.json` removendo `doc_id` dos schemas de integrantes e adicionando resposta 409 para email duplicado
- [ ] T024 Documentar breaking change no corpo do PR: remoção do campo `doc_id` da API de integrantes (campo removido de responses e não aceito em requests)
- [x] T025 Executar validação do `specs/012-remove-documento-integrante/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 (Prisma Client regenerado) — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 (types e repository atualizados)
- **US2 (Phase 4)**: Depende de Phase 2. Pode rodar em paralelo com US1 (arquivos de service são o mesmo, mas métodos diferentes — `create` vs `update`)
- **US3 (Phase 5)**: Depende de Phase 2. Pode rodar em paralelo com US1 e US2 (frontend é independente do backend service)
- **Polish (Phase 6)**: Depende de TODAS as phases anteriores

### User Story Dependencies

- **US1 (P1)**: Após Phase 2 — independente de outras stories
- **US2 (P1)**: Após Phase 2 — opera no mesmo arquivo de service que US1, mas em métodos diferentes (`create` vs `update`). Recomendado: implementar sequencialmente após US1 para evitar conflitos no mesmo arquivo
- **US3 (P2)**: Após Phase 2 — completamente independente (frontend only)

### Within Each User Story

- Service changes antes de test changes (testes refletem o novo comportamento)
- Mock data e fake repository em paralelo (arquivos diferentes)
- Frontend schemas e form em paralelo (arquivos diferentes)

### Parallel Opportunities

- **Phase 2**: T004 em paralelo com T005→T006→T007 (T004 é arquivo diferente; T005-T007 são sequenciais no mesmo arquivo `integrantes.repository.ts`)
- **Phase 3**: T010 e T011 em paralelo (mock-data.ts vs fake-integrantes.repository.ts)
- **Phase 5**: T016 e T017 em paralelo (schemas/integrante.ts vs IntegranteForm.tsx)
- **Cross-story**: US3 (frontend) pode rodar em paralelo com US1+US2 (backend)

---

## Parallel Example: US3 (Frontend)

```bash
# T016 e T017 podem rodar em paralelo — arquivos diferentes:
Task: "Remover doc_id dos schemas Zod em packages/frontend/src/schemas/integrante.ts"
Task: "Remover campo Documento do form em packages/frontend/src/components/IntegranteForm.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (schema + migration)
2. Complete Phase 2: Foundational (types + repository)
3. Complete Phase 3: US1 (cadastro sem documento)
4. **STOP and VALIDATE**: POST /api/integrantes sem doc_id → 201
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Base pronta
2. US1 (cadastro) → Testar independentemente → Validar
3. US2 (edição) → Testar independentemente → Validar
4. US3 (frontend) → Testar independentemente → Validar
5. Polish → Smoke tests → Concluído

### Recomendação de Execução

Dado que esta é uma feature subtrativa (remoção de campo), a abordagem mais segura é:

1. **Sequencial backend** (Phase 1 → 2 → 3 → 4): Evita conflitos no mesmo arquivo de service
2. **Paralelo frontend** (Phase 5 em paralelo com Phase 3+4): Frontend é completamente independente
3. **Validação final** (Phase 6): Smoke tests confirmam integração

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task para user story específica
- Esta feature é **subtrativa** — a maioria das tasks envolve remoção de código
- A tabela `eventos_integrantes` (junction) não é afetada — relacionamento via `fk_integrante_id` permanece intacto
- Constraint unique de email já existe no banco (`integrantes_email_key`) — a nova validação no service adiciona mensagens user-friendly
- Commit após cada phase ou grupo lógico de tasks
