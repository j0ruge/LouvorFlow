# Tasks: Link de Convite para Integrantes

**Input**: Design documents from `/specs/023-invite-link/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Não solicitados explicitamente na spec. Tasks de teste não incluídas.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Prisma model e migration para a tabela `invite_tokens`

- [x] T001 Adicionar model `InviteTokens` ao schema com relations para Tenant, Users (creator) e Users (used_by) em `packages/backend/prisma/schema.prisma`
- [x] T002 Adicionar relations inversas `convitesCreated` e `conviteUsed` no model Users e `convites` no model Tenant em `packages/backend/prisma/schema.prisma`
- [x] T003 Executar `npx prisma migrate dev --name add-invite-tokens` e `npx prisma generate` em `packages/backend/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Repository, types, validators e controller base — infraestrutura compartilhada por todas as user stories

**CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa

- [x] T004 [P] Criar interfaces e DTOs de convites em `packages/backend/src/types/convites.types.ts`
- [x] T005 [P] Criar schemas Zod de validação (acceptInviteBodySchema com refine senha_confirmacao, tokenParamSchema UUID, inviteIdParamSchema UUID) em `packages/backend/src/validators/convites.validators.ts`
- [x] T006 Criar repository `InvitesRepository` com métodos: create, findByToken (include tenant+creator), findAllByTenantId (include creator+user), findById, markAsUsed, revokeById em `packages/backend/src/repositories/convites.repository.ts`
- [x] T007 Criar controller `InvitesController` com handlers: create, index, revoke, validate, accept em `packages/backend/src/controllers/convites.controller.ts`
- [x] T008 Criar arquivo de rotas com rotas autenticadas (POST /, GET /, DELETE /:id) com middleware `ensureAuthenticated + ensureTenantContext + can(['integrantes.write'])` e rotas públicas (GET /:token/validate, POST /:token/accept) sem auth em `packages/backend/src/routes/convites.routes.ts`
- [x] T009 Registrar `convitesRoutes` no Express app em `packages/backend/src/app.ts` adicionando `this.app.use('/api/convites', convitesRoutes)`

**Checkpoint**: Infraestrutura backend pronta — services podem ser implementados

---

## Phase 3: User Story 1 — Líder gera link de convite (Priority: P1) MVP

**Goal**: O líder gera um link de convite com 1 clique, recebe URL copiável com expiração de 2h

**Independent Test**: Login como líder → POST /api/convites → recebe JSON com url, token e expires_at

### Implementation for User Story 1

- [x] T010 [US1] Implementar `CreateInviteService` que gera token UUID, calcula `expires_at = now + 2h`, constrói URL com `APP_WEB_URL/convite/{token}` e retorna invite com status em `packages/backend/src/services/convites/create-convite.service.ts`
- [x] T011 [US1] Conectar `create` no controller ao service, retornando 201 com `{ msg, invite: { id, token, url, expires_at, created_at, status } }` em `packages/backend/src/controllers/convites.controller.ts`
- [x] T012 [P] [US1] Criar service de API frontend `createInvite()` com schema Zod de response em `packages/frontend/src/services/convites.ts`
- [x] T013 [P] [US1] Criar hook `useCreateConvite` com useMutation, invalidação de queryKey ["convites"] e toast de sucesso em `packages/frontend/src/hooks/use-convites.ts`
- [x] T014 [US1] Criar componente `InviteGenerateDialog` com botão gerar, exibição do link, botão copiar (navigator.clipboard), timer de expiração e toast de confirmação em `packages/frontend/src/components/InviteGenerateDialog.tsx`
- [x] T015 [US1] Adicionar botão "Gerar convite" no header da página Members (visível apenas com permissão `integrantes.write`) que abre InviteGenerateDialog em `packages/frontend/src/pages/Members.tsx`

**Checkpoint**: Líder gera convite e copia link — fluxo US1 funcional e testável

---

## Phase 4: User Story 2+3 — Participante aceita convite + Validação de estados (Priority: P1)

**Goal**: Participante abre link, sistema valida estado do token (válido/expirado/usado/revogado/404), exibe form de cadastro ou mensagem de erro. Participante cria conta e é vinculado ao tenant.

**Independent Test**: Abrir URL /convite/{token} em aba anônima → ver nome do tenant → preencher form → criar conta → login funciona

### Implementation for User Story 2+3

- [x] T016 [P] [US3] Implementar `ValidateInviteService` que busca token, verifica estado (valid/expired/used/revoked/not_found) e retorna `{ valid, tenant: { name } }` ou erro com status em `packages/backend/src/services/convites/validate-convite.service.ts`
- [x] T017 [P] [US2] Implementar `AcceptInviteService` com fluxo: validar token → se e-mail novo: criar Users (bcrypt hash SALT_ROUNDS=12) + TenantUsers → se e-mail existe: verificar senha (bcrypt.compare), criar TenantUsers → marcar token used_at/used_by → retornar 201 ou 200 em `packages/backend/src/services/convites/accept-convite.service.ts`
- [x] T018 [US2] Tratar caso de e-mail existente no AcceptConviteService: se e-mail existe e não pertence ao tenant, comparar senha com hash existente (bcrypt.compare) — se correta criar TenantUsers (200), se incorreta retornar 401; se já pertence ao tenant retornar 409 em `packages/backend/src/services/convites/accept-convite.service.ts`
- [x] T019 [US3] Conectar handlers `validate` e `accept` no controller aos services correspondentes em `packages/backend/src/controllers/convites.controller.ts`
- [x] T020 [P] [US2] Criar services de API frontend `validateInvite(token)` e `acceptInvite(token, body)` com schemas Zod de response em `packages/frontend/src/services/convites.ts`
- [x] T021 [P] [US2] Criar hooks `useValidateInvite(token)` com useQuery e `useAcceptInvite` com useMutation em `packages/frontend/src/hooks/use-convites.ts`
- [x] T022 [US2] Criar página `InviteAccept` com: validação do token ao carregar, exibição do nome do tenant, form (Nome + E-mail + Senha + Confirmação), tratamento de 409 (mostrar campo senha para conta existente), mensagens de erro por estado, redirect para /login após sucesso em `packages/frontend/src/pages/InviteAccept.tsx`
- [x] T023 [US2] Adicionar rota pública `/convite/:token` apontando para InviteAccept (fora de ProtectedRoute) em `packages/frontend/src/App.tsx`

**Checkpoint**: Fluxo completo gerar→abrir→cadastrar→login funcional. Todos os estados do token tratados.

---

## Phase 5: User Story 4 — Líder gerencia convites (Priority: P2)

**Goal**: Líder vê lista de convites com status (ativo/expirado/usado/revogado) e pode revogar convites ativos

**Independent Test**: Login como líder → ver lista de convites → revogar um convite ativo → verificar que status muda para revogado

### Implementation for User Story 4

- [x] T024 [P] [US4] Implementar `ListInvitesService` que busca todos convites do tenant com status derivado (active/expired/used/revoked) e inclui dados do creator e used_by em `packages/backend/src/services/convites/list-convites.service.ts`
- [x] T025 [P] [US4] Implementar `RevokeInviteService` que valida que convite não está usado nem revogado, marca `revoked_at` e retorna sucesso em `packages/backend/src/services/convites/revoke-convite.service.ts`
- [x] T026 [US4] Conectar handlers `index` e `revoke` no controller aos services correspondentes em `packages/backend/src/controllers/convites.controller.ts`
- [x] T027 [P] [US4] Criar services de API frontend `getInvites()` e `revokeInvite(id)` com schemas Zod de response em `packages/frontend/src/services/convites.ts`
- [x] T028 [P] [US4] Criar hooks `useConvites` com useQuery e `useRevokeConvite` com useMutation + invalidação de queryKey ["convites"] em `packages/frontend/src/hooks/use-convites.ts`
- [x] T029 [US4] Criar componente `InviteListDialog` com tabela de convites (status badge colorido, gerado por, expiração, botão revogar desabilitado para não-ativos) em `packages/frontend/src/components/InviteListDialog.tsx`
- [x] T030 [US4] Adicionar botão "Ver convites" no header da página Members (visível com `integrantes.write`) que abre InviteListDialog em `packages/frontend/src/pages/Members.tsx`

**Checkpoint**: Líder gerencia convites — lista completa com ações de revogação

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, OpenAPI e validação final

- [x] T031 [P] Adicionar docstrings JSDoc em PT-BR em todos os arquivos novos (repository, services, controller, validators, types, components, hooks, pages) conforme regra CLAUDE.md
- [x] T032 [P] Documentar os 5 endpoints novos no `packages/backend/docs/openapi.json` seguindo formato existente
- [x] T033 [P] Atualizar `packages/backend/.claude/rules/backend-api.md` se novos padrões foram introduzidos (rotas públicas + autenticadas no mesmo arquivo)
- [x] T034 Executar smoke test completo via API conforme `specs/023-invite-link/quickstart.md` — gerar convite, validar token, aceitar convite, verificar login
- [x] T035 Executar `npm test` em ambos packages (backend + frontend) e corrigir falhas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 (model Prisma) — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: Depende de Phase 2 — pode iniciar imediatamente após foundational
- **US2+US3 (Phase 4)**: Depende de Phase 2 — pode rodar em paralelo com US1
- **US4 (Phase 5)**: Depende de Phase 2 — pode rodar em paralelo com US1 e US2+US3
- **Polish (Phase 6)**: Depende de todas as user stories estarem completas

### User Story Dependencies

- **US1** (gerar convite): Independente — apenas precisa de create service
- **US2+US3** (aceitar + validar): Independente de US1 — usa validate e accept services
- **US4** (gerenciar): Independente — usa list e revoke services

### Within Each User Story

- Backend services antes de frontend services
- Frontend services + hooks antes de componentes/páginas
- Controller conectado ao service antes de testar

### Parallel Opportunities

- T004 e T005 podem rodar em paralelo (types e validators)
- T012 e T013 podem rodar em paralelo (frontend service e hook — US1)
- T016 e T017 podem rodar em paralelo (validate e accept services)
- T020 e T021 podem rodar em paralelo (frontend services e hooks — US2)
- T024 e T025 podem rodar em paralelo (list e revoke services — US4)
- T027 e T028 podem rodar em paralelo (frontend services e hooks — US4)
- T031, T032, T033 podem rodar em paralelo (documentação)
- **US1, US2+US3 e US4 podem rodar em paralelo** após Phase 2

---

## Parallel Example: User Story 2+3

```text
# Backend services em paralelo:
Task: "Implementar ValidateInviteService em packages/backend/src/services/convites/validate-convite.service.ts"
Task: "Implementar AcceptInviteService em packages/backend/src/services/convites/accept-convite.service.ts"

# Frontend services + hooks em paralelo (após backend):
Task: "Criar services validateInvite e acceptInvite em packages/frontend/src/services/convites.ts"
Task: "Criar hooks useValidateInvite e useAcceptInvite em packages/frontend/src/hooks/use-convites.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (model + migration)
2. Complete Phase 2: Foundational (repository, types, validators, controller, routes)
3. Complete Phase 3: US1 — Gerar convite
4. **STOP and VALIDATE**: Testar via curl que convite é gerado com token e URL válidos
5. Entregar MVP: líder já pode gerar links

### Incremental Delivery

1. Setup + Foundational → infraestrutura pronta
2. US1 (gerar convite) → testar → **MVP!**
3. US2+US3 (aceitar + validar) → testar → fluxo completo gerar→aceitar
4. US4 (gerenciar) → testar → líder tem visibilidade e controle total
5. Polish → documentação + smoke test → **feature completa**

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si
- [Story] label mapeia task à user story para rastreabilidade
- Cada user story é independentemente completável e testável
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
- Docstrings JSDoc em PT-BR são obrigatórias em todo código novo (CLAUDE.md)
- OpenAPI deve ser atualizado ao final (T032)
