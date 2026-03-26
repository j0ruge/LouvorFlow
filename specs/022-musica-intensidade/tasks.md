# Tasks: Intensidade de Música (por Versão)

**Input**: Design documents from `/specs/022-musica-intensidade/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md

**Tests**: Não solicitados explicitamente — tasks de teste omitidas.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story à qual a task pertence (US1, US2, US3)
- Paths exatos incluídos nas descrições

## Path Conventions

- **Backend**: `packages/backend/src/`, `packages/backend/prisma/`
- **Frontend**: `packages/frontend/src/`

---

## Phase 1: Setup (Database Migration)

**Purpose**: Criar o campo intensidade no banco de dados e regenerar o Prisma Client

- [x] T001 Adicionar campo `intensidade String?` ao model `Artistas_Musicas` em `packages/backend/prisma/schema.prisma`
- [x] T002 Executar `npx prisma migrate dev --name add_intensidade_to_artistas_musicas` em `packages/backend/`
- [x] T003 Executar `npx prisma generate` para regenerar o Prisma Client

---

## Phase 2: Foundational (Backend — todas as camadas)

**Purpose**: Propagar o campo intensidade em todas as camadas do backend. DEVE ser concluída antes de qualquer user story.

**⚠️ CRITICAL**: Nenhuma task de frontend pode começar antes desta fase estar completa.

- [x] T004 [P] Adicionar `intensidade` às interfaces `VersaoRaw`, `CreateMusicaCompleteInput`, `UpdateMusicaCompleteInput`, `Musica` e ao `MUSICA_SELECT` em `packages/backend/src/types/index.ts`
- [x] T005 [P] Adicionar `intensidade: z.enum(["calma", "media", "agitada"]).optional()` aos schemas `createMusicaCompleteBodySchema`, `updateMusicaCompleteBodySchema`, `addVersaoBodySchema`, `updateVersaoBodySchema` em `packages/backend/src/validators/musicas.validators.ts`
- [x] T006 [P] Adicionar `intensidade: true` nos selects e dados de criação em `findVersoes`, `createVersao`, `updateVersao`, `createWithVersao`, `updateWithVersao` em `packages/backend/src/repositories/musicas.repository.ts`
- [x] T007 Propagar `intensidade` em `formatMusica`, `addVersao`, `updateVersao`, `listVersoes` em `packages/backend/src/services/musicas.service.ts`

**Checkpoint**: Backend aceita e retorna o campo `intensidade` em todos os endpoints de música/versão

---

## Phase 3: User Story 1 — Definir intensidade ao criar música (Priority: P1) 🎯 MVP

**Goal**: Usuário pode selecionar Calma/Média/Agitada ao criar uma nova música via pill buttons abaixo do nome

**Independent Test**: Criar uma música com intensidade "media", salvar e verificar que o valor persiste no detalhe

### Implementation for User Story 1

- [x] T008 [P] [US1] Adicionar `intensidade` ao `VersaoSchema` e `CreateMusicaCompleteFormSchema` em `packages/frontend/src/schemas/musica.ts`
- [x] T009 [P] [US1] Criar componente `IntensidadeSelector` com pill buttons (Calma/Média/Agitada), ícones de barras e toggle deselect (clicar na opção já selecionada limpa para null) em `packages/frontend/src/components/IntensidadeSelector.tsx`
- [x] T010 [US1] Adicionar `IntensidadeSelector` ao formulário de criação logo abaixo do campo Nome, com `intensidade` no form defaults e submit em `packages/frontend/src/components/MusicaForm.tsx`

**Checkpoint**: Criar música com intensidade funciona end-to-end. Verificar via Playwright.

---

## Phase 4: User Story 2 — Visualizar intensidade no detalhe (Priority: P1)

**Goal**: Usuário vê a intensidade de cada versão ao abrir detalhes de uma música

**Independent Test**: Abrir detalhe de música com intensidade definida e verificar que badge/pill aparece junto à versão

### Implementation for User Story 2

- [x] T011 [US2] Exibir badge de intensidade junto a cada versão (pill com ícone) no card de Versões em `packages/frontend/src/components/MusicaDetail.tsx`

**Checkpoint**: Detalhe da música exibe intensidade corretamente. Versões sem intensidade não mostram badge.

---

## Phase 5: User Story 3 — Editar intensidade de versão existente (Priority: P2)

**Goal**: Usuário pode alterar a intensidade ao editar uma versão existente

**Independent Test**: Editar versão, trocar intensidade de "calma" para "agitada", salvar e verificar que novo valor persiste

### Implementation for User Story 3

- [x] T012 [US3] Adicionar `IntensidadeSelector` ao formulário de edição de versão com valor pré-selecionado e submit em `packages/frontend/src/components/VersaoForm.tsx`

**Checkpoint**: Edição de versão com intensidade funciona. Toggle deselect (clicar na selecionada) limpa o valor.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentação e validação final

- [x] T013 [P] Atualizar schemas de Versão e VersaoInput no OpenAPI adicionando campo `intensidade` em `packages/backend/docs/openapi.json`
- [x] T014 [P] Adicionar docstrings JSDoc em PT-BR ao componente `IntensidadeSelector` em `packages/frontend/src/components/IntensidadeSelector.tsx`
- [x] T015 Executar `npx tsc --noEmit` no frontend e `npm test` no backend para verificar que nada foi quebrado
- [x] T016 Smoke test via Playwright: criar música com intensidade, verificar no detalhe, editar versão

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as user stories
- **User Stories (Phase 3-5)**: Dependem de Phase 2 completa
  - US1 e US2 podem rodar em paralelo após Phase 2
  - US3 depende de T009 (IntensidadeSelector) de US1
- **Polish (Phase 6)**: Depende de todas as user stories desejadas

### User Story Dependencies

- **US1 (P1)**: Depende de Phase 2 — sem dependência de outras stories
- **US2 (P1)**: Depende de Phase 2 — sem dependência de US1 (dados já vêm da API)
- **US3 (P2)**: Depende de T009 (IntensidadeSelector criado em US1)

### Parallel Opportunities

- T004, T005, T006 podem rodar em paralelo (Phase 2 — arquivos diferentes)
- T008, T009 podem rodar em paralelo (Phase 3 — arquivos diferentes)
- T011 pode rodar em paralelo com T012 (Phase 4 e 5 — arquivos diferentes)
- T013, T014 podem rodar em paralelo (Phase 6)

---

## Parallel Example: Phase 2 (Foundational)

```text
# Backend layers em paralelo (arquivos diferentes):
Task T004: types/index.ts
Task T005: validators/musicas.validators.ts
Task T006: repositories/musicas.repository.ts
# Depois sequencial:
Task T007: services/musicas.service.ts (depende de T004, T006)
```

## Parallel Example: User Story 1

```text
# Frontend schema + componente em paralelo:
Task T008: schemas/musica.ts
Task T009: IntensidadeSelector.tsx (novo)
# Depois sequencial:
Task T010: MusicaForm.tsx (depende de T008, T009)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration)
2. Complete Phase 2: Foundational (backend layers)
3. Complete Phase 3: User Story 1 (criar com intensidade)
4. **STOP and VALIDATE**: Testar criação de música com intensidade
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Backend pronto
2. US1 (criar com intensidade) → MVP funcional
3. US2 (visualizar no detalhe) → Feedback visual completo
4. US3 (editar versão) → CRUD completo
5. Polish → Documentação + validação final

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task a user story específica
- Cada user story é independentemente testável
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar a story
