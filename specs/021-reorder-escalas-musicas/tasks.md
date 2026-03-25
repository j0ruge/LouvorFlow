# Tasks: Reordenacao de Musicas na Escala

**Input**: Design documents from `/specs/021-reorder-escalas-musicas/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Testes unitarios incluidos conforme padrao do projeto (Vitest + fakes).

**Organization**: Tasks agrupadas por user story para implementacao e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependencias)
- **[Story]**: User story associada (US1, US2, US3, US4)
- Paths relativos a raiz do monorepo

---

## Phase 1: Setup (Dependencias)

**Purpose**: Instalar dependencias novas necessarias para a feature

- [x] T001 Instalar `@dnd-kit/core` e `@dnd-kit/sortable` em `packages/frontend/package.json`

**Checkpoint**: Dependencias instaladas, `yarn install` executado com sucesso

---

## Phase 2: Foundational (Schema + Migracao + Types)

**Purpose**: Alteracoes no banco e tipos que BLOQUEIAM todas as user stories

- [x] T002 Adicionar campo `ordem Int @default(0)` ao model `Eventos_Musicas` em `packages/backend/prisma/schema.prisma`
- [x] T003 Criar e executar migracao Prisma com data migration SQL para popular `ordem` em registros existentes via `ROW_NUMBER() OVER (PARTITION BY evento_id ORDER BY created_at)` em `packages/backend/prisma/migrations/`
- [x] T004 Atualizar `EVENTO_SHOW_SELECT` em `packages/backend/src/types/index.ts` para incluir `id` e `ordem` no select de `Eventos_Musicas` e adicionar `orderBy: { ordem: 'asc' }`
- [x] T005 [P] Adicionar schema Zod `reorderMusicasBodySchema` com `musicas_ids: z.array(z.string().uuid()).min(1)` em `packages/backend/src/validators/eventos.validators.ts`
- [x] T005b [P] Atualizar fake repository de eventos em `packages/backend/tests/fakes/` para suportar campo `ordem` nos registros de `Eventos_Musicas` e adicionar metodo `reorderMusicas`

**Checkpoint**: Schema migrado, `prisma generate` executado, tipos, validators e fakes prontos

---

## Phase 3: User Story 1 - Reordenar musicas via drag-and-drop (Priority: P1)

**Goal**: Permitir que o usuario arraste musicas para reordena-las dentro de uma escala, com persistencia no banco e optimistic UI.

**Independent Test**: Acessar detalhes de uma escala com 3+ musicas, arrastar uma musica para outra posicao, recarregar a pagina e confirmar que a ordem persistiu.

### Backend — US1

- [x] T006 [US1] Adicionar metodo `reorderMusicas(eventoId: string, musicasIds: string[])` no repository — atualizar `ordem` de cada registro `Eventos_Musicas` dentro de `prisma.$transaction` em `packages/backend/src/repositories/eventos.repository.ts`
- [x] T007 [US1] Adicionar metodo `findMusicas` com `orderBy: { ordem: 'asc' }` no repository (atualizar query existente) em `packages/backend/src/repositories/eventos.repository.ts`
- [x] T008 [US1] Adicionar metodo `reorderMusicas(eventoId, musicasIds)` no service — validar que evento existe, que IDs correspondem exatamente as musicas do evento (sem duplicatas, sem faltantes), delegar ao repository em `packages/backend/src/services/eventos.service.ts`
- [x] T009 [US1] Adicionar handler `reorderMusicas(req, res)` no controller — extrair `eventoId` de params e `musicas_ids` do body, chamar service, retornar 200 com `{ msg }` em `packages/backend/src/controllers/eventos.controller.ts`
- [x] T010 [US1] Adicionar rota `PATCH /:eventoId/musicas/reorder` com middleware chain `ensureAuthenticated, ensureTenantContext, can(['escalas.write']), validateRequest({ body: reorderMusicasBodySchema })` em `packages/backend/src/routes/eventos.routes.ts`

### Frontend — US1

- [x] T010b [P] [US1] Atualizar schema Zod de resposta do evento no frontend para incluir campo `ordem` (inteiro) no array de musicas em `packages/frontend/src/schemas/evento.ts`
- [x] T011 [US1] Adicionar funcao `reorderMusicas(eventoId: string, musicasIds: string[]): Promise<AssociationResponse>` que faz PATCH para `/eventos/${eventoId}/musicas/reorder` em `packages/frontend/src/services/eventos.ts`
- [x] T012 [US1] Adicionar hook `useReorderMusicas(eventoId)` com optimistic update — `onMutate` salva cache anterior e atualiza otimisticamente, `onError` reverte e exibe toast via `sonner`, `onSettled` invalida queries em `packages/frontend/src/hooks/use-eventos.ts`
- [x] T013 [US1] Refatorar secao de musicas no `EventoDetail.tsx` para usar `DndContext` + `SortableContext` do `@dnd-kit/sortable` — cada card de musica vira um `SortableItem` com grip handle (`GripVertical` do lucide-react) e badge numerico de posicao. Icone de grip visivel apenas para usuarios com `can(['escalas.write'])`, badge de posicao visivel para todos em `packages/frontend/src/components/EventoDetail.tsx`
- [x] T014 [US1] Implementar handler `onDragEnd` no `EventoDetail.tsx` — recalcular array de IDs na nova ordem via `arrayMove` do `@dnd-kit/sortable` e chamar `reorderMusicas.mutate(newIds)` em `packages/frontend/src/components/EventoDetail.tsx`

### Testes — US1

- [x] T015 [P] [US1] Adicionar testes unitarios do service `reorderMusicas` — cenarios: reordenacao valida, evento inexistente (404), IDs nao correspondentes (400), lista vazia (400) — usando fake repository em `packages/backend/tests/services/eventos.service.test.ts`

**Checkpoint**: US1 completa — usuario pode arrastar musicas e reordenar com persistencia. Recarregar pagina confirma ordem salva.

---

## Phase 4: User Story 2 - Adicionar musica preservando ordem (Priority: P2)

**Goal**: Ao adicionar nova musica a uma escala, ela recebe automaticamente a proxima posicao disponivel.

**Independent Test**: Adicionar uma musica a uma escala com 3 musicas ordenadas e verificar que a nova musica recebeu posicao 4.

### Implementation — US2

- [x] T016 [US2] Modificar metodo `createMusica` no repository para calcular `MAX(ordem) + 1` das musicas do evento e atribuir ao novo registro em `packages/backend/src/repositories/eventos.repository.ts`

### Testes — US2

- [x] T017 [P] [US2] Adicionar testes unitarios do service `addMusica` — cenarios: adicionar a escala com musicas (recebe posicao N+1), adicionar a escala vazia (recebe posicao 1) em `packages/backend/tests/services/eventos.service.test.ts`

**Checkpoint**: US2 completa — novas musicas sempre recebem a ultima posicao sem alterar as existentes.

---

## Phase 5: User Story 3 - Remover musica com reajuste de ordem (Priority: P2)

**Goal**: Ao remover uma musica, as posicoes das restantes sao recalculadas para sequencia continua.

**Independent Test**: Remover a musica da posicao 2 de uma escala com 3 musicas e verificar que as restantes ficam nas posicoes 1 e 2.

### Implementation — US3

- [x] T018 [US3] Modificar metodo `removeMusica` no service para, apos deletar, recalcular `ordem` das musicas restantes do evento (buscar, ordenar por `ordem`, atualizar sequencialmente 1..N via `$transaction`) em `packages/backend/src/services/eventos.service.ts`

### Testes — US3

- [x] T019 [P] [US3] Adicionar testes unitarios do service `removeMusica` — cenarios: remover do meio (reajuste), remover a ultima (sem reajuste), remover unica musica em `packages/backend/tests/services/eventos.service.test.ts`

**Checkpoint**: US3 completa — remover musica nunca deixa buracos na sequencia de ordem.

---

## Phase 6: User Story 4 - Experiencia mobile-first (Priority: P1)

**Goal**: Garantir que drag-and-drop funciona em dispositivos touch com long press e feedback visual adequado.

**Independent Test**: Em um celular (ou emulador), acessar a escala, tocar e segurar o icone de grip, arrastar para reposicionar.

### Implementation — US4

- [x] T020 [US4] Configurar sensores do `DndContext` no `EventoDetail.tsx` — `PointerSensor` com `activationConstraint: { distance: 8 }` para desktop e `TouchSensor` com `activationConstraint: { delay: 250, tolerance: 5 }` para mobile (long press) em `packages/frontend/src/components/EventoDetail.tsx`
- [x] T021 [US4] Adicionar estilos de feedback visual ao `SortableItem` — durante arraste: elevacao/sombra (`shadow-lg`), opacidade reduzida no placeholder, indicador de posicao destino. Garantir area de toque minima de 44x44px no grip handle para mobile em `packages/frontend/src/components/EventoDetail.tsx`

**Checkpoint**: US4 completa — drag-and-drop fluido em mobile (long press) e desktop (click), com feedback visual claro.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentacao, OpenAPI e validacao final

- [x] T022 [P] Atualizar `packages/backend/docs/openapi.json` — adicionar endpoint `PATCH /api/eventos/{eventoId}/musicas/reorder` com request/response schemas, e adicionar campo `ordem` ao schema de resposta de `GET /api/eventos/{eventoId}`
- [x] T023 [P] Adicionar docstrings JSDoc em PT-BR a todos os metodos novos e modificados (repository, service, controller, hooks, service frontend) conforme regra CLAUDE.md
- [x] T024 Executar validacao quickstart.md — testar fluxo completo via curl (backend) e UI (frontend) conforme `specs/021-reorder-escalas-musicas/quickstart.md`

**Checkpoint**: Feature completa, documentada e validada end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependencias — pode comecar imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — BLOQUEIA todas as user stories
- **Phase 3 (US1)**: Depende de Phase 2 — MVP da feature
- **Phase 4 (US2)**: Depende de Phase 2 — pode rodar em paralelo com US1 (arquivos diferentes para T016)
- **Phase 5 (US3)**: Depende de Phase 2 — pode rodar em paralelo com US1 (arquivo compartilhado em service, mas metodo diferente)
- **Phase 6 (US4)**: Depende de Phase 3 (US1) — refina o DnD implementado em US1
- **Phase 7 (Polish)**: Depende de todas as user stories completas

### Within Each User Story

- Repository antes de Service
- Service antes de Controller
- Controller antes de Routes
- Backend antes de Frontend (para US1)
- Core implementation antes de testes

### Parallel Opportunities

- T005 (validator) em paralelo com T002-T004 (schema/types)
- T015 (testes US1) em paralelo com T011-T014 (frontend US1)
- T017 (testes US2) em paralelo com T018-T019 (US3)
- T022 e T023 (polish) em paralelo entre si

---

## Parallel Example: User Story 1

```text
# Sequencial (backend depende de schema):
T002 → T003 → T004 → T006 → T007 → T008 → T009 → T010

# Em paralelo apos T010 (backend pronto):
Task T011: "API service reorderMusicas em packages/frontend/src/services/eventos.ts"
Task T012: "Hook useReorderMusicas em packages/frontend/src/hooks/use-eventos.ts"
  → (depende de T011)
Task T013+T014: "DnD no EventoDetail.tsx"
  → (depende de T012)
Task T015: "Testes unitarios service reorderMusicas"
  → (em paralelo com T011-T014, arquivo diferente)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T005)
3. Complete Phase 3: User Story 1 (T006-T015)
4. **STOP and VALIDATE**: Arrastar musicas e recarregar pagina
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Base pronta
2. US1 (reordenar) → Testar independentemente → MVP!
3. US2 (adicionar com ordem) → Testar independentemente
4. US3 (remover com reajuste) → Testar independentemente
5. US4 (mobile polish) → Testar em dispositivo touch
6. Polish → Documentacao e validacao final

---

## Notes

- [P] tasks = arquivos diferentes, sem dependencias
- [Story] label mapeia task para user story especifica
- Cada user story deve ser independentemente completavel e testavel
- Commit apos cada task ou grupo logico
- Parar em qualquer checkpoint para validar story independentemente
