# Research: Frontend Auth & RBAC

**Feature**: 017-frontend-auth-rbac
**Date**: 2026-03-14

## R1: Token Storage Strategy

**Decision**: Access token em memória (variável JavaScript no AuthContext); refresh token em `localStorage`.

**Rationale**: Access tokens em memória são inacessíveis a XSS persistente (não sobrevivem a refresh de página, mas são renovados via refresh token). localStorage para refresh token é um trade-off aceitável para esta aplicação (ministério de louvor, não financeira). A alternativa httpOnly cookie exigiria mudanças significativas no backend (set-cookie header, CORS credentials, CSRF protection) sem benefício proporcional ao risco.

**Alternatives considered**:
- httpOnly cookie para refresh token: mais seguro contra XSS, mas requer backend changes e CSRF tokens. Desproporcional ao risco.
- sessionStorage para refresh token: mais seguro que localStorage (não persiste entre abas), mas impede "manter logado" entre sessões do navegador.
- Ambos em memória: máxima segurança, mas perde autenticação em cada refresh de página — péssima UX.

## R2: Token Refresh Pattern (Race Condition Prevention)

**Decision**: Padrão "singleton promise" — uma única promise de refresh é criada quando o primeiro 401 é detectado, e todas as requisições pendentes aguardam essa mesma promise.

**Rationale**: O backend usa token rotation (refresh token antigo é invalidado ao emitir novo). Se duas requisições tentam refresh simultaneamente, a segunda falharia porque o token já foi rotacionado. O singleton promise serializa isso naturalmente.

**Alternatives considered**:
- Queue/mutex: mais complexo, mesmo resultado. O singleton promise é o padrão mais simples.
- Interceptor com retry: sem serialização, causaria erros de token rotation.
- Proactive refresh (antes de expirar): complementar — pode ser adicionado depois, mas não elimina a necessidade do singleton para 401s inesperados.

## R3: Auth Context Architecture

**Decision**: React Context + Provider nativo, sem state management library adicional.

**Rationale**: O estado de autenticação é global mas simples (user, tokens, isAuthenticated, isAdmin). React Context é suficiente e já é usado pelo projeto (ThemeProvider). Adicionar zustand/redux seria over-engineering para este caso de uso. TanStack React Query lida com cache de dados do servidor (perfil, listas admin).

**Alternatives considered**:
- Zustand: mais leve que Redux, mas ainda é uma dependência extra desnecessária.
- React Query only: poderia armazenar user em query cache, mas tokens precisam de acesso síncrono (para interceptor), o que não combina bem com o modelo async do React Query.
- Redux Toolkit: muito pesado para auth state simples.

## R4: Protected Route Pattern

**Decision**: Componentes wrapper `<ProtectedRoute>` e `<AdminRoute>` que verificam auth state e redirecionam/bloqueiam conforme necessário.

**Rationale**: Padrão estabelecido no React Router 6. Simples, declarativo, e permite composição (uma rota pode ser protected + admin). O `<ProtectedRoute>` redireciona ao login preservando a URL original (`?redirect=`). O `<AdminRoute>` verifica `user.roles.includes('admin')` e renderiza `<Forbidden/>` se falhar.

**Alternatives considered**:
- Route middleware/loader (React Router 6.4+): mais elegante mas requer migrar para `createBrowserRouter` data API, o que mudaria toda a estrutura de rotas existente.
- HOC (Higher Order Component): funciona mas é um padrão mais antigo, menos idiomático em React 18.

## R5: Backend List Endpoints (Missing Dependency)

**Decision**: Implementar 3 endpoints GET de listagem no backend como parte desta feature.

**Rationale**: Os painéis admin (US6, US7) precisam listar usuários, roles e permissões. O backend spec 013 mencionava esses endpoints como opcionais, mas nunca foram implementados. São simples (Prisma findMany + serialização) e seguem o padrão existente dos controllers.

**Endpoints a implementar**:
- `GET /api/users` — Lista todos os usuários (sem senha), com roles. Protegido por `is(['admin'])`.
- `GET /api/roles` — Lista todas as roles com permissões. Protegido por `is(['admin'])`.
- `GET /api/permissions` — Lista todas as permissões. Protegido por `is(['admin'])`.

**Alternatives considered**:
- Usar endpoints existentes (GET ACL por userId): exigiria N+1 chamadas para listar todos os usuários. Inviável.
- Criar via seed/migration: não resolve a necessidade de CRUD dinâmico no frontend.

## R6: User Menu Component (GitHub-style Dropdown)

**Decision**: Componente `UserMenu` usando Radix `DropdownMenu` (já disponível via shadcn/ui) posicionado no header, com avatar do usuário como trigger.

**Rationale**: O usuário especificou estilo GitHub — avatar circular no header que abre dropdown com nome, e-mail, link para perfil e botão de logout. shadcn/ui já inclui `DropdownMenu` baseado em Radix, então não precisa de dependência extra.

**Alternatives considered**:
- Popover: menos semântico para menu de ações.
- Sheet/Drawer: muito pesado para 2-3 itens de menu.
- Sidebar footer: descartado pelo usuário na clarificação.

## R7: Admin Permission Check (Frontend)

**Decision**: Verificar `user.roles.some(r => r.name === 'admin')` no frontend para controle de visibilidade. Nenhuma permissão granular no frontend.

**Rationale**: O backend já protege todos os endpoints admin com `is(['admin'])`. O frontend apenas precisa esconder/exibir a seção "Administração" — uma verificação de role é suficiente e mais simples que verificar permissões individuais. Se no futuro houver roles admin diferentes (ex: "moderador"), a lógica pode ser expandida.

**Alternatives considered**:
- Verificar permissões específicas (ex: `can('users.create')`): over-engineering para o momento — apenas "admin" tem acesso a tudo.
- Endpoint dedicado para verificar permissões: latência extra desnecessária quando o login já retorna roles/permissions completas.
