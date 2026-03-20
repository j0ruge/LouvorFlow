# Implementation Plan: Frontend Auth & RBAC

**Branch**: `017-frontend-auth-rbac` | **Date**: 2026-03-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-frontend-auth-rbac/spec.md`

## Summary

Implementar autenticação (login/logout), renovação automática de tokens, proteção de rotas, perfil do usuário, recuperação de senha e painéis administrativos de RBAC no frontend React. O backend já está totalmente implementado (spec 013). O frontend precisa de: contexto de autenticação global, interceptor de tokens no `apiFetch`, páginas de login/perfil/admin, e adaptação do sidebar/header para exibir informações do usuário e controlar visibilidade de rotas por permissão.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend SPA)
**Primary Dependencies**: React 18, React Router 6, TanStack React Query 5, react-hook-form 7, Zod 3, shadcn/ui, Radix UI, TailwindCSS 3, Lucide React, Sonner
**Storage**: N/A (tokens em memória + localStorage para refresh token)
**Testing**: Vitest 4 + Playwright (e2e)
**Target Platform**: Web browser (mobile-first responsive)
**Project Type**: SPA (Single Page Application) dentro de monorepo
**Performance Goals**: Login completo em <5s; renovação de token transparente ao usuário
**Constraints**: Tokens de acesso em memória (não em localStorage) para segurança; serialização de refresh para evitar race conditions com token rotation
**Scale/Scope**: ~8 novas páginas, ~15 novos componentes, ~6 novos hooks, ~4 novos services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First & Cross-Platform Ready | **PASS** | Componentes shadcn/ui já são mobile-first. Toda a lógica de auth será em hooks/services puros, portáveis para React Native. Nenhuma API web-only na lógica de negócio. |
| II. Relational Data Integrity | **N/A** | Nenhuma alteração no schema Prisma. O backend já possui os modelos de auth. |
| III. RESTful API as Single Source of Truth | **PASS** | Frontend consumirá exclusivamente a API REST existente via `apiFetch`. Nenhum acesso direto ao banco. |
| IV. Version-Centric Repertoire Model | **N/A** | Feature não afeta o modelo de repertório. |
| V. Simplicity & Pragmatism (YAGNI) | **PASS** | Sem abstrações prematuras. Auth context usa React Context nativo. Token refresh usa padrão singleton promise. Sem state management adicional (zustand/redux). |

**Gate Result**: PASS — nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/017-frontend-auth-rbac/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (consumed API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/frontend/src/
├── contexts/
│   └── AuthContext.tsx           # AuthProvider + useAuth hook
├── components/
│   ├── ProtectedRoute.tsx       # Wrapper: redireciona ao login se não autenticado
│   ├── AdminRoute.tsx           # Wrapper: exibe 403 se não admin
│   ├── UserMenu.tsx             # Avatar dropdown no header (perfil + logout)
│   └── ui/                      # shadcn/ui (existente, sem alteração)
├── pages/
│   ├── Login.tsx                # Tela de login
│   ├── ForgotPassword.tsx       # Solicitar recuperação de senha
│   ├── ResetPassword.tsx        # Redefinir senha via token
│   ├── Profile.tsx              # Visualizar/editar perfil
│   ├── Forbidden.tsx            # Página 403 (Acesso Negado)
│   ├── admin/
│   │   ├── Users.tsx            # Listar/criar usuários
│   │   ├── UserAcl.tsx          # Atribuir roles/permissões a usuário
│   │   ├── Roles.tsx            # Listar/criar roles
│   │   ├── RolePermissions.tsx  # Associar permissões a role
│   │   └── Permissions.tsx      # Listar/criar permissões
│   └── (páginas existentes: Dashboard, Songs, etc.)
├── services/
│   ├── auth.ts                  # Funções de API: login, logout, refresh, profile, password
│   └── admin.ts                 # Funções de API: users, roles, permissions (CRUD admin)
├── hooks/
│   ├── use-auth.ts              # Re-export do useAuth do contexto
│   ├── use-profile.ts           # React Query hooks para perfil
│   └── use-admin.ts             # React Query hooks para admin CRUD
├── schemas/
│   └── auth.ts                  # Zod schemas: login, profile, password, users, roles, permissions
├── lib/
│   └── api.ts                   # apiFetch MODIFICADO: interceptor de Authorization header + refresh automático
├── App.tsx                      # MODIFICADO: AuthProvider + rotas protegidas + novas rotas
├── components/
│   ├── AppLayout.tsx            # MODIFICADO: integrar UserMenu no header
│   └── AppSidebar.tsx           # MODIFICADO: seção "Administração" condicional
└── tests/
    └── (testes unitários e e2e para auth)

packages/backend/src/
├── routes/auth/
│   ├── users.routes.ts          # MODIFICADO: adicionar GET /api/users (listar)
│   ├── roles.routes.ts          # MODIFICADO: adicionar GET /api/roles (listar)
│   └── permissions.routes.ts    # MODIFICADO: adicionar GET /api/permissions (listar)
├── controllers/auth/
│   ├── users.controller.ts      # MODIFICADO: adicionar método list
│   ├── roles.controller.ts      # MODIFICADO: adicionar método list
│   └── permissions.controller.ts # MODIFICADO: adicionar método list
└── services/auth/
    ├── list-users.service.ts     # NOVO: listar usuários
    ├── list-roles.service.ts     # NOVO: listar roles
    └── list-permissions.service.ts # NOVO: listar permissões
```

**Structure Decision**: Feature é primariamente frontend, seguindo a estrutura existente do monorepo (`packages/frontend/src/`). Novos arquivos seguem os padrões estabelecidos: services para chamadas API, hooks para React Query, schemas para Zod, pages para componentes de página. Pequenas adições no backend para endpoints de listagem que faltam (GET list).

## Complexity Tracking

> Nenhuma violação de constitution detectada. Tabela não aplicável.

## Dependencies & Blockers

### Backend: Endpoints de Listagem Faltantes

O backend **não implementa** os endpoints de listagem necessários para os painéis administrativos:

| Endpoint Faltante | Necessário Para | Prioridade |
|--------------------|-----------------|------------|
| `GET /api/users` | US6 - Gerenciamento de Usuários | P3 |
| `GET /api/roles` | US7 - Gerenciamento de Roles | P3 |
| `GET /api/permissions` | US7 - Gerenciamento de Permissões | P3 |

**Decisão**: Implementar esses endpoints como parte desta feature (são simples: query Prisma + serialização). Serão tasks iniciais antes das pages admin.

### Decisões Técnicas Chave

1. **Token Storage**: Access token em variável JavaScript (memória do AuthContext). Refresh token em `localStorage` — aceitável para esta aplicação (não é bancário/financeiro). Alternativa (httpOnly cookie) exigiria mudanças no backend e CORS config.

2. **Refresh Token Flow**: Padrão "singleton promise" — quando um 401 é recebido, uma única promise de refresh é criada e compartilhada por todas as requisições pendentes. Evita race conditions com token rotation.

3. **Permissão Admin**: O frontend usa a role "admin" (verificada via `user.roles`) para controlar visibilidade da seção "Administração". Não requer permissões granulares no frontend — o backend já valida via `is(['admin'])`.

4. **Auth State Initialization**: No carregamento inicial, se há refresh token em localStorage, tenta obter novo access token via `/sessions/refresh-token`. Se falha, redireciona ao login. Enquanto carrega, exibe loading spinner.
