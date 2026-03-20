# Tasks: Frontend Auth & RBAC

**Input**: Design documents from `/specs/017-frontend-auth-rbac/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/consumed-api.md

**Tests**: Not explicitly requested — test tasks omitted. Tests can be added later.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `packages/frontend/src/`
- **Backend**: `packages/backend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Zod schemas e service layers que serão usados por múltiplas user stories

- [x] T001 [P] Criar Zod schemas de autenticação (login, refresh, profile, password, admin forms) em `packages/frontend/src/schemas/auth.ts`
- [x] T002 [P] Criar service de autenticação (login, logout, refreshToken, getProfile, updateProfile, forgotPassword, resetPassword) em `packages/frontend/src/services/auth.ts`
- [x] T003 [P] Criar service de admin (listUsers, createUser, getUserAcl, setUserAcl, listRoles, createRole, setRolePermissions, listPermissions, createPermission) em `packages/frontend/src/services/admin.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: AuthContext, interceptor de tokens e componentes de proteção de rota. DEVE estar completo antes de qualquer user story.

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa.

- [x] T036 [BLOCKING] Validar contrato: para cada endpoint marcado como "Implementado" em `consumed-api.md`, fazer um curl e parsear o response com o Zod schema correspondente do frontend. Se falhar, corrigir o backend ANTES de implementar o frontend. Verificar especialmente: (1) roles/permissions achatados (não junction), (2) avatar_url presente, (3) timestamps em nested objects.
- [x] T004 Modificar `apiFetch` para suportar injeção automática de Authorization header e refresh automático de token (singleton promise pattern) em `packages/frontend/src/lib/api.ts`
- [x] T005 Criar AuthContext com AuthProvider (estado de autenticação global: user, tokens, login, logout, refresh, isAdmin) em `packages/frontend/src/contexts/AuthContext.tsx`
- [x] T006 Criar hook `useAuth` como re-export do contexto em `packages/frontend/src/hooks/use-auth.ts`
- [x] T007 [P] Criar componente `ProtectedRoute` (redireciona ao login se não autenticado, preserva URL de destino) em `packages/frontend/src/components/ProtectedRoute.tsx`
- [x] T008 [P] Criar componente `AdminRoute` (exibe Forbidden se não admin) em `packages/frontend/src/components/AdminRoute.tsx`
- [x] T009 [P] Criar página `Forbidden` (403 - Acesso Negado) em `packages/frontend/src/pages/Forbidden.tsx`

**Checkpoint**: Foundation ready — AuthContext funcional, `apiFetch` com interceptor de tokens, rotas protegidas e admin prontas.

---

## Phase 3: User Story 1 — Login e Acesso Autenticado (Priority: P1) 🎯 MVP

**Goal**: Usuário pode fazer login com e-mail/senha e ser redirecionado ao Dashboard com token de acesso ativo.

**Independent Test**: Acessar a app → redireciona ao login → informar credenciais → Dashboard carrega com token nas requisições.

### Implementation for User Story 1

- [x] T010 [US1] Criar página de Login com formulário (e-mail + senha), validação Zod, mensagem de erro genérica, e redirecionamento pós-login em `packages/frontend/src/pages/Login.tsx`
- [x] T011 [US1] Modificar `App.tsx` para envolver com AuthProvider, adicionar rota `/login`, e proteger todas as rotas existentes com `ProtectedRoute` em `packages/frontend/src/App.tsx`

**Checkpoint**: Login funcional — acessar qualquer página redireciona ao login; após autenticar, Dashboard carrega e requisições à API incluem Bearer token.

---

## Phase 4: User Story 2 — Logout e Gerenciamento de Sessão (Priority: P1)

**Goal**: Usuário pode encerrar sessão via dropdown no header, com revogação de tokens no backend e limpeza local.

**Independent Test**: Após login, clicar em "Sair" no dropdown → redireciona ao login, requisições subsequentes rejeitadas.

### Implementation for User Story 2

- [x] T012 [US2] Criar componente `UserMenu` com avatar, nome/e-mail e botão "Sair" usando DropdownMenu (shadcn/ui) em `packages/frontend/src/components/UserMenu.tsx`
- [x] T013 [US2] Modificar `AppLayout.tsx` para integrar `UserMenu` no header (canto superior direito) em `packages/frontend/src/components/AppLayout.tsx`

**Checkpoint**: Logout funcional — avatar visível no header, dropdown com "Sair" funciona, sessão encerrada no backend.

---

## Phase 5: User Story 3 — Proteção de Rotas por Permissões (Priority: P1)

**Goal**: Sidebar exibe todos os itens de domínio para qualquer usuário autenticado e seção "Administração" apenas para admins. Acesso direto a rotas admin sem permissão exibe 403.

**Independent Test**: Login como admin → seção "Administração" visível. Login como usuário comum → seção não aparece. Acesso direto a URL admin → página 403.

### Implementation for User Story 3

- [x] T014 [US3] Modificar `AppSidebar.tsx` para adicionar seção "Administração" condicional (visível apenas para admins, com itens: Usuários, Roles, Permissões) em `packages/frontend/src/components/AppSidebar.tsx`
- [x] T015 [US3] Adicionar rotas admin protegidas com `AdminRoute` (`/admin/usuarios`, `/admin/roles`, `/admin/permissoes`) em `packages/frontend/src/App.tsx`

**Checkpoint**: RBAC no frontend funcional — admin vê seção extra no sidebar, não-admin vê 403 em rotas admin.

---

## Phase 6: User Story 4 — Perfil do Usuário (Priority: P2)

**Goal**: Usuário pode visualizar e editar seu perfil (nome, e-mail, avatar) acessando via dropdown do header.

**Independent Test**: Clicar no avatar → "Meu Perfil" → ver dados atuais → alterar nome → salvar → nome atualizado no header/sidebar.

### Implementation for User Story 4

- [x] T016 [P] [US4] Criar hooks de perfil (useProfile, useUpdateProfile) com React Query em `packages/frontend/src/hooks/use-profile.ts`
- [x] T017 [US4] Criar página de Perfil com formulário de edição (nome, e-mail, avatar, alteração de senha) em `packages/frontend/src/pages/Profile.tsx`
- [x] T018 [US4] Adicionar link "Meu Perfil" no dropdown do `UserMenu` e rota `/perfil` em `packages/frontend/src/App.tsx`

**Checkpoint**: Perfil funcional — edição de dados reflete na interface imediatamente.

---

## Phase 7: User Story 5 — Recuperação de Senha (Priority: P2)

**Goal**: Usuário pode solicitar recuperação de senha via e-mail e redefinir com token.

**Independent Test**: Na tela de login, clicar "Esqueci minha senha" → informar e-mail → mensagem de sucesso. Acessar link de reset → nova senha → redireciona ao login.

### Implementation for User Story 5

- [x] T019 [P] [US5] Criar página `ForgotPassword` com formulário de e-mail e mensagem de sucesso genérica em `packages/frontend/src/pages/ForgotPassword.tsx`
- [x] T020 [P] [US5] Criar página `ResetPassword` com formulário de nova senha + confirmação, validação de token na URL em `packages/frontend/src/pages/ResetPassword.tsx`
- [x] T021 [US5] Adicionar rotas públicas `/esqueci-senha` e `/redefinir-senha` e link "Esqueci minha senha" na página de Login em `packages/frontend/src/App.tsx` e `packages/frontend/src/pages/Login.tsx`

**Checkpoint**: Fluxo completo de recuperação de senha funcional (solicitar → redefinir → login).

---

## Phase 8: User Story 6 — Gerenciamento de Usuários (Priority: P3)

**Goal**: Admin pode listar, criar usuários e atribuir roles/permissões.

**Independent Test**: Login como admin → "Administração" → "Usuários" → ver lista → criar novo usuário → atribuir roles → novo usuário loga com permissões corretas.

### Backend Prerequisites for User Story 6

- [x] T022 [P] [US6] Implementar endpoint `GET /api/users` (listar usuários sem senha, com roles) no backend: service em `packages/backend/src/services/auth/list-users.service.ts`, método `list` no controller `packages/backend/src/controllers/auth/users.controller.ts`, rota GET em `packages/backend/src/routes/auth/users.routes.ts`
- [x] T023 [P] [US6/US7] Implementar endpoint `GET /api/roles` (listar roles com permissões) no backend: service em `packages/backend/src/services/auth/list-roles.service.ts`, método `list` no controller `packages/backend/src/controllers/auth/roles.controller.ts`, rota GET em `packages/backend/src/routes/auth/roles.routes.ts`
- [x] T024 [P] [US6/US7] Implementar endpoint `GET /api/permissions` (listar permissões) no backend: service em `packages/backend/src/services/auth/list-permissions.service.ts`, método `list` no controller `packages/backend/src/controllers/auth/permissions.controller.ts`, rota GET em `packages/backend/src/routes/auth/permissions.routes.ts`

### Frontend Implementation for User Story 6

- [x] T025 [US6] Criar hooks de admin (useUsers, useCreateUser, useUserAcl, useSetUserAcl, useRoles, usePermissions) com React Query em `packages/frontend/src/hooks/use-admin.ts`
- [x] T026 [US6] Criar página `Users` com lista de usuários (nome, e-mail, roles) e formulário de criação em `packages/frontend/src/pages/admin/Users.tsx`
- [x] T027 [US6] Criar página `UserAcl` com interface para atribuir roles e permissões a um usuário (impedir auto-remoção do role "admin" pelo próprio usuário logado) em `packages/frontend/src/pages/admin/UserAcl.tsx`

**Checkpoint**: Admin pode gerenciar usuários completo — listar, criar, atribuir ACL.

---

## Phase 9: User Story 7 — Gerenciamento de Roles e Permissões (Priority: P3)

**Goal**: Admin pode listar e criar roles, associar permissões a roles, e visualizar lista de permissões.

**Independent Test**: Login como admin → criar nova role → associar permissões → atribuir role a usuário → verificar que acesso funciona.

### Implementation for User Story 7

- [x] T028 [P] [US7] Criar página `Roles` com lista de roles (nome, descrição, permissões) e formulário de criação em `packages/frontend/src/pages/admin/Roles.tsx`
- [x] T029 [P] [US7] Criar página `RolePermissions` com interface para associar/remover permissões de uma role em `packages/frontend/src/pages/admin/RolePermissions.tsx`
- [x] T030 [P] [US7] Criar página `Permissions` com lista de permissões (nome, descrição) e formulário de criação em `packages/frontend/src/pages/admin/Permissions.tsx`

**Checkpoint**: RBAC admin completo — roles e permissões gerenciáveis via interface.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentação, atualização de rules e validação final

- [x] T031 [P] Atualizar `packages/backend/docs/openapi.json` com os 3 novos endpoints GET de listagem (users, roles, permissions)
- [x] T032 [P] Atualizar `.claude/rules/frontend-react.md` com padrões de auth (AuthContext, ProtectedRoute, AdminRoute, UserMenu, auth hooks)
- [x] T033 Atualizar `MEMORY.md` com novos padrões de autenticação frontend e estrutura de diretórios
- [x] T034 Validar quickstart.md — executar fluxo completo: login → navegação → perfil → logout → admin (se admin)
- [x] T035 Revisar docstrings JSDoc em PT-BR em todos os arquivos novos e modificados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 (T001-T003) — BLOQUEIA todas as user stories
- **US1 Login (Phase 3)**: Depende de Phase 2 — primeira funcionalidade visível
- **US2 Logout (Phase 4)**: Depende de US1 (precisa estar logado para deslogar)
- **US3 Route Protection (Phase 5)**: Depende de US1 (precisa de AuthContext funcional)
- **US4 Profile (Phase 6)**: Depende de US2 (UserMenu precisa existir para link "Meu Perfil")
- **US5 Password Recovery (Phase 7)**: Depende de US1 (página de Login precisa existir para links)
- **US6 Users Admin (Phase 8)**: Depende de US3 (rotas admin precisam existir) + backend endpoints
- **US7 Roles Admin (Phase 9)**: Depende de US6 (hooks de admin compartilhados)
- **Polish (Phase 10)**: Depende de todas as stories desejadas estarem completas

### User Story Dependencies

```text
Phase 1 (Setup)
    └── Phase 2 (Foundational)
          ├── US1 (Login) ─── MVP 🎯
          │     ├── US2 (Logout)
          │     │     └── US4 (Profile)
          │     ├── US3 (Route Protection)
          │     │     └── US6 (Users Admin) + backend T022-T024
          │     │           └── US7 (Roles Admin)
          │     └── US5 (Password Recovery)
          └── Phase 10 (Polish) — após stories desejadas
```

### Within Each User Story

- Schemas/services antes de hooks
- Hooks antes de pages
- Pages antes de integração no App.tsx
- Backend endpoints (se necessário) antes de frontend que os consome

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 podem rodar em paralelo (arquivos diferentes)
- **Phase 2**: T007, T008, T009 podem rodar em paralelo (após T004-T006)
- **US2 + US3**: Podem ser desenvolvidas em paralelo após US1
- **US4 + US5**: Podem ser desenvolvidas em paralelo
- **US6 backend**: T022, T023, T024 podem rodar em paralelo (endpoints independentes)
- **US7**: T028, T029, T030 podem rodar em paralelo (páginas independentes)

---

## Parallel Example: Phase 1 (Setup)

```text
# Todas as tasks de setup podem rodar em paralelo:
T001: "Criar Zod schemas em packages/frontend/src/schemas/auth.ts"
T002: "Criar auth service em packages/frontend/src/services/auth.ts"
T003: "Criar admin service em packages/frontend/src/services/admin.ts"
```

## Parallel Example: US6 Backend Prerequisites

```text
# Todos os endpoints de listagem podem ser criados em paralelo:
T022: "GET /api/users — list users endpoint"
T023: "GET /api/roles — list roles endpoint"
T024: "GET /api/permissions — list permissions endpoint"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: US1 Login (T010-T011)
4. **STOP and VALIDATE**: Login funcional, Dashboard acessível, token nas requisições
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Login) → **MVP!** App tem autenticação básica
3. US2 (Logout) + US3 (Route Protection) → App tem auth completo
4. US4 (Profile) + US5 (Password Recovery) → Self-service do usuário
5. US6 (Users Admin) + US7 (Roles Admin) → Gestão administrativa completa
6. Polish → Documentação e validação final

### Suggested Stopping Points

- **After US1-US3**: Auth core completo — suficiente para uso interno com admin seed
- **After US1-US5**: Self-service completo — usuários são autônomos
- **After US1-US7**: Feature completa — gestão administrativa via interface

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si
- [Story] label mapeia task à user story para rastreabilidade
- Cada user story é testável independentemente após seus checkpoints
- Commit após cada task ou grupo lógico
- Backend list endpoints (T022-T024) são pré-requisitos para pages admin mas não bloqueiam US1-US5
- Docstrings JSDoc em PT-BR são obrigatórias em todo código novo (CLAUDE.md)
