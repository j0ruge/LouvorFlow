# Tasks: Categorias e Funções Requeridas no Formulário de Música

**Input**: Design documents from `/specs/011-musica-categorias-funcoes/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Não solicitados explicitamente na spec. Tarefas de teste não incluídas.

**Organization**: Tasks agrupadas por user story. US1+US3 (categorias: seleção + criação inline) e US2+US4 (funções: seleção + criação inline) são combinadas porque compartilham o mesmo componente e backend.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `packages/backend/src/`
- **Frontend**: `packages/frontend/src/`

---

## Phase 1: Foundational — Backend (Estender Endpoints Completos)

**Purpose**: Estender `createComplete` e `updateComplete` para aceitar `categoria_ids[]` e `funcao_ids[]` dentro da transação Prisma existente. Isso desbloqueia todas as user stories.

**CRITICAL**: Todas as user stories dependem desta fase.

- [X] T001 [P] Estender método `createWithVersao` no repository para aceitar e criar junções de categorias e funções dentro da transação Prisma existente em `packages/backend/src/repositories/musicas.repository.ts`. O método já cria a música e opcionalmente uma versão dentro de `prisma.$transaction()`. Adicionar parâmetros opcionais `categoria_ids: string[]` e `funcao_ids: string[]` ao input. Dentro da mesma transação, após criar a música: (1) se `categoria_ids` fornecido e não vazio, criar registros em `musicas_categorias` com `createMany` para cada ID; (2) mesma lógica para `funcao_ids` em `musicas_funcoes`. Incluir os `include` de `Musicas_Categorias` e `Musicas_Funcoes` no retorno da query final para que `formatMusica()` funcione. Deduplicate IDs antes de inserir (usar `[...new Set(ids)]`).

- [X] T002 [P] Estender método `updateWithVersao` no repository para aceitar e sincronizar junções de categorias e funções dentro da transação Prisma existente em `packages/backend/src/repositories/musicas.repository.ts`. Adicionar parâmetros opcionais `categoria_ids: string[]` e `funcao_ids: string[]`. Implementar lógica de sync (diff): (1) buscar IDs atuais das junções existentes; (2) calcular quais adicionar (novos - existentes) e quais remover (existentes - novos); (3) `deleteMany` para remover e `createMany` para adicionar, tudo dentro da transação. Se o campo for `undefined`, não modificar (skip). Se for array vazio `[]`, remover todas as associações. Incluir `Musicas_Categorias` e `Musicas_Funcoes` no `include` do retorno.

- [X] T003 Estender método `createComplete` no service para validar e propagar `categoria_ids` e `funcao_ids` em `packages/backend/src/services/musicas.service.ts`. Extrair `categoria_ids` e `funcao_ids` do body (default `[]`). Para cada array não vazio: validar que cada ID referencia uma entidade existente usando o repository correspondente (`categoriasRepository.findById` e `funcoesRepository.findById`); se algum não existir, lançar `AppError("Categoria não encontrada", 404)` ou `AppError("Função não encontrada", 404)`. Passar os arrays validados para `musicasRepository.createWithVersao()`. Depende de T001.

- [X] T004 Estender método `updateComplete` no service para validar e propagar `categoria_ids` e `funcao_ids` em `packages/backend/src/services/musicas.service.ts`. Mesma lógica de validação de T003, mas respeitando a semântica de sync: se `categoria_ids` for `undefined`, não passar para o repository (manter existentes); se for array (incluindo vazio), validar e passar. Depende de T002.

**Checkpoint**: Backend aceita `categoria_ids` e `funcao_ids` nos endpoints `/api/musicas/complete` (POST e PUT). Pode ser testado com curl/Postman.

---

## Phase 2: Foundational — Frontend Infrastructure

**Purpose**: Criar o componente `CreatableMultiCombobox`, estender schemas Zod e service layer. Desbloqueia integração no formulário.

**CRITICAL**: Fase 3+ depende desta fase.

- [X] T005 [P] Estender `CreateMusicaCompleteFormSchema` e `UpdateMusicaCompleteFormSchema` em `packages/frontend/src/schemas/musica.ts`. Adicionar campo `categoria_ids: z.array(z.string().uuid()).optional().default([])` e `funcao_ids: z.array(z.string().uuid()).optional().default([])` a ambos os schemas. Atualizar os tipos TypeScript exportados correspondentes (`CreateMusicaCompleteForm`, `UpdateMusicaCompleteForm`). Atualizar `MUSICA_FORM_DEFAULTS` para incluir `categoria_ids: []` e `funcao_ids: []`.

- [X] T006 [P] Estender funções `createMusicaComplete()` e `updateMusicaComplete()` em `packages/frontend/src/services/musicas.ts` para incluir `categoria_ids` e `funcao_ids` no payload enviado ao backend. A função `cleanEmptyStrings()` já converte strings vazias para undefined — verificar que arrays não são afetados (arrays vazios devem ser enviados como `[]`, não convertidos). Se `cleanEmptyStrings` afeta arrays, ajustar para preservá-los.

- [X] T007 Criar componente `CreatableMultiCombobox` em `packages/frontend/src/components/CreatableMultiCombobox.tsx`. Baseado no padrão visual do `CreatableCombobox.tsx` existente (Popover + Command do shadcn/ui), mas adaptado para multi-seleção. Props da interface: `options: ComboboxOption[]` (`{ value: string; label: string }`), `value: string[]` (array de UUIDs selecionados), `onValueChange: (value: string[]) => void`, `onCreate: (inputValue: string) => Promise<string | undefined>`, `placeholder?: string`, `searchPlaceholder?: string`, `createLabel?: (input: string) => string`, `disabled?: boolean`, `isLoading?: boolean`. Comportamentos: (1) Trigger exibe badges dos itens selecionados com botão "X" para remover individualmente; se nenhum selecionado, exibe placeholder; (2) Popover com Command para busca e filtragem client-side; (3) Itens já selecionados NÃO aparecem na lista de opções; (4) Após selecionar um item, Popover permanece aberto para seleção adicional; (5) Quando texto digitado não tem match exato com opções não-selecionadas, exibir botão "Criar X" (mesmo padrão de `CreatableCombobox`); (6) `onCreate` callback assíncrono retorna UUID criado — adicionar automaticamente ao array de seleção; (7) Suporte a item otimista (armazenar localmente enquanto React Query refetch). Usar Badge do shadcn/ui para itens selecionados, X icon do lucide-react para remoção, ChevronsUpDown para trigger, Check para item selecionado, Loader2 para loading. Toda docstring em PT-BR (JSDoc).

**Checkpoint**: Componente `CreatableMultiCombobox` pode ser usado em qualquer formulário. Schemas e services prontos para os novos campos.

---

## Phase 3: US1+US3 — Categorias no Formulário de Música (Priority: P1)

**Goal**: O usuário pode buscar, selecionar e criar categorias inline diretamente no formulário de criação de música. (User Stories 1 e 3)

**Independent Test**: Criar uma música selecionando categorias existentes e criando uma nova inline. Verificar que todas as associações são persistidas e que a categoria criada inline aparece na lista.

### Implementation

- [X] T008 [US1+US3] Integrar campo de categorias no `MusicaForm` em `packages/frontend/src/components/MusicaForm.tsx`. Passos: (1) Importar `useCategorias` e `useCreateCategoria` de `@/hooks/use-support`; (2) Importar `CreatableMultiCombobox` do novo componente; (3) Criar `handleCreateCategoria` seguindo o mesmo padrão de `handleCreateTonalidade` — chamar `createCategoria.mutateAsync({ nome: inputValue })`, extrair o ID da resposta (a resposta do backend é `{ msg, categoria: { id, nome } }` — mas o service frontend retorna `CrudResponse` que é `{ msg }`, então precisará buscar o ID: verificar se o hook `useCreateCategoria` retorna o ID na mutação ou se será necessário ajustar o service para retornar o objeto completo); (4) Mapear `categorias` de `useCategorias()` para `ComboboxOption[]` (`{ value: cat.id, label: cat.nome }`); (5) Adicionar `FormField` com `CreatableMultiCombobox` controlado por react-hook-form usando `field.value` e `field.onChange` para `categoria_ids`; (6) Posicionar o campo após o campo `link_versao` (último campo atual). Docstrings JSDoc em PT-BR.

**Checkpoint**: Formulário de criação de música permite buscar, selecionar e criar categorias inline. Música criada persiste as associações de categorias.

---

## Phase 4: US2+US4 — Funções Requeridas no Formulário de Música (Priority: P1)

**Goal**: O usuário pode buscar, selecionar e criar funções requeridas inline diretamente no formulário de criação de música. (User Stories 2 e 4)

**Independent Test**: Criar uma música selecionando funções existentes e criando uma nova inline. Verificar que todas as associações são persistidas.

### Implementation

- [X] T009 [US2+US4] Integrar campo de funções requeridas no `MusicaForm` em `packages/frontend/src/components/MusicaForm.tsx`. Passos: (1) Importar `useFuncoes` e `useCreateFuncao` de `@/hooks/use-support`; (2) Criar `handleCreateFuncao` seguindo o mesmo padrão de `handleCreateCategoria` (T008); (3) Mapear `funcoes` de `useFuncoes()` para `ComboboxOption[]`; (4) Adicionar `FormField` com `CreatableMultiCombobox` controlado por react-hook-form para `funcao_ids`; (5) Posicionar após o campo de categorias. Docstrings JSDoc em PT-BR. Depende de T008 (mesmo arquivo).

**Checkpoint**: Formulário de criação exibe campos de categorias E funções. Ambos suportam seleção múltipla e criação inline.

---

## Phase 5: US5 — Edição de Categorias e Funções em Música Existente (Priority: P2)

**Goal**: Ao editar uma música, categorias e funções já associadas aparecem pré-preenchidas como badges. O usuário pode adicionar, remover e criar inline. Ao salvar, o backend sincroniza as associações via diff.

**Independent Test**: Abrir uma música existente com categorias/funções associadas. Verificar que badges aparecem. Adicionar e remover itens. Salvar e verificar que as alterações foram persistidas corretamente.

### Implementation

- [X] T010 [US5] Estender lógica de pré-preenchimento (edit mode) no `MusicaForm` em `packages/frontend/src/components/MusicaForm.tsx`. No bloco existente que pré-preenche o formulário quando `musica` prop é fornecido (onde já seta `nome`, `fk_tonalidade`, `artista_id`, etc.), adicionar: `categoria_ids: musica.categorias.map(c => c.id)` e `funcao_ids: musica.funcoes.map(f => f.id)` ao `form.reset()`. Isso fará os badges das associações existentes aparecerem automaticamente via `CreatableMultiCombobox`. Verificar que o `updateMutation` do `MusicaForm` já passa os novos campos no payload (garantido por T005 e T006 — os schemas e services já incluem os campos). Depende de T008, T009.

**Checkpoint**: Fluxo completo de criação e edição funciona com categorias e funções. Todas as 5 user stories atendidas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finais e validação.

- [X] T011 Verificar que `useFormDraft` em `packages/frontend/src/components/MusicaForm.tsx` preserva corretamente os arrays `categoria_ids` e `funcao_ids` no localStorage quando o usuário fecha o formulário sem salvar. Testar: (1) abrir formulário, selecionar categorias/funções, fechar sem salvar; (2) reabrir o formulário e verificar que o draft recovery dialog aparece; (3) ao recuperar, verificar que os badges das categorias/funções selecionadas reaparecem. Se `useFormDraft` serializa/deserializa arrays corretamente (via JSON.stringify/parse), nenhuma mudança é necessária. Caso contrário, ajustar.

- [X] T012 Verificar que o `CrudResponse` retornado por `createCategoria()` e `createFuncao()` em `packages/frontend/src/services/support.ts` inclui o ID da entidade criada (necessário para `handleCreateCategoria`/`handleCreateFuncao` no MusicaForm). O schema `CrudResponseSchema` atual parseia apenas `{ msg }`. Se o backend retorna `{ msg, categoria: { id, nome } }`, mas o frontend descarta o objeto, será necessário: (1) criar um schema de resposta que capture o ID (ex: `CreateCategoriaResponseSchema = z.object({ msg: z.string(), categoria: IdNomeSchema })`); (2) atualizar a função `createCategoria()` para retornar o objeto completo; (3) ajustar o hook `useCreateCategoria` se necessário. Mesmo para `createFuncao`. Esta tarefa pode ser necessária **antes** de T008 — se for o caso, mover para Phase 2.

- [ ] T013 Executar validação do quickstart.md: seguir os 10 passos de verificação rápida documentados em `specs/011-musica-categorias-funcoes/quickstart.md` para confirmar que toda a feature funciona end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Backend)      → Nenhuma dependência — começar imediatamente
  T001, T002           → Paralelos (métodos diferentes no mesmo arquivo)
  T003                 → Depende de T001
  T004                 → Depende de T002

Phase 2 (Frontend Infra) → Pode iniciar em paralelo com Phase 1 (frontend independente)
  T005, T006           → Paralelos (arquivos diferentes)
  T007                 → Independente (novo arquivo)

Phase 3 (US1+US3)      → Depende de Phase 1 + Phase 2 (backend + componente + schemas prontos)
  T008                 → Depende de T003, T005, T006, T007

Phase 4 (US2+US4)      → Depende de Phase 3 (mesmo arquivo: MusicaForm.tsx)
  T009                 → Depende de T008

Phase 5 (US5)          → Depende de Phase 4
  T010                 → Depende de T009

Phase 6 (Polish)       → Depende de Phase 5
  T011                 → Depende de T010
  T012                 → Pode ser movida para Phase 2 se necessário (ver descrição)
  T013                 → Depende de todas as fases anteriores
```

### Parallel Opportunities

```text
Paralelo 1 (Phase 1):
  T001 (repository createWithVersao) || T002 (repository updateWithVersao)

Paralelo 2 (Phase 1 + Phase 2, cross-phase):
  Phase 1 inteira || T005 (schemas) || T006 (services) || T007 (componente)

Paralelo 3 (Phase 2):
  T005 (schemas) || T006 (services) || T007 (componente)
```

### User Story Dependencies

- **US1+US3 (Categorias)**: Depende de Foundational (Phase 1 + 2). Independente de US2+US4 e US5.
- **US2+US4 (Funções)**: Depende de US1+US3 (mesmo arquivo MusicaForm.tsx — não paralelizável).
- **US5 (Edição)**: Depende de US1+US3 e US2+US4 (campos devem existir no form antes de pré-preencher).

---

## Implementation Strategy

### MVP First (US1+US3 Only — Categorias)

1. Complete Phase 1: Backend extensions
2. Complete Phase 2: Frontend infrastructure
3. Complete Phase 3: Categories field in MusicaForm
4. **STOP and VALIDATE**: Criar música com categorias funciona end-to-end

### Full Delivery

1. MVP (acima) → validar
2. Add Phase 4 (US2+US4): Functions field → validar
3. Add Phase 5 (US5): Edit mode → validar
4. Phase 6: Polish → validação final com quickstart

---

## Notes

- Nenhuma migração Prisma necessária (schema já suporta tudo)
- O componente `CreatableMultiCombobox` é o item de maior esforço (T007)
- T012 (CrudResponse com ID) pode ser blocker — priorizar investigação se o service atual não retorna o ID
- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task para user story específica
- Commit após cada task ou grupo lógico
