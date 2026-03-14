# Quickstart: Frontend Auth & RBAC

**Feature**: 017-frontend-auth-rbac
**Date**: 2026-03-14

## Pré-requisitos

1. Backend rodando (`packages/backend` com `npm run dev`)
2. PostgreSQL acessível (Docker: `docker compose up -d`)
3. Admin seed executado (`npx prisma db seed` no backend)
4. Frontend (`packages/frontend` com `npm run dev`)

> **Nota**: Os scripts `dev.ps1` (Windows) e `dev.sh` (Linux/Mac) automatizam todos estes passos, incluindo o seed do admin. **OBRIGATÓRIO**: scripts de dev DEVEM executar o seed após `prisma migrate`, garantindo que o admin sempre existe.

## Credenciais de Teste

```text
Admin: Definido por ADMIN_EMAIL / ADMIN_PASSWORD no .env do backend
```

## Fluxo de Desenvolvimento

### 1. Backend — Endpoints de Listagem (Pré-requisito)

Adicionar 3 endpoints GET no backend (necessários para painéis admin):

```text
GET /api/users        → Lista usuários (admin only)
GET /api/roles        → Lista roles (admin only)
GET /api/permissions  → Lista permissões (admin only)
```

Cada um segue o padrão existente:
- Route com `ensureAuthenticated` + `is(['admin'])`
- Controller com método `list`
- Service com `prisma.model.findMany()`

### 2. Frontend — Auth Core (P1)

Ordem de implementação:

```text
1. schemas/auth.ts         — Zod schemas para todas as entidades/forms de auth
2. services/auth.ts        — Funções apiFetch para sessions, profile, password
3. lib/api.ts              — Modificar: adicionar Authorization header + refresh automático
4. contexts/AuthContext.tsx — Provider com user state, login, logout, refresh
5. components/ProtectedRoute.tsx — Wrapper de rota autenticada
6. pages/Login.tsx         — Tela de login com e-mail/senha
7. App.tsx                 — Envolver com AuthProvider, proteger rotas existentes
```

### 3. Frontend — Layout Updates (P1)

```text
8. components/UserMenu.tsx   — Dropdown de avatar no header
9. components/AppLayout.tsx  — Integrar UserMenu no header
10. components/AppSidebar.tsx — Adicionar seção "Administração" condicional
11. components/AdminRoute.tsx — Wrapper para rotas admin-only
12. pages/Forbidden.tsx      — Página 403
```

### 4. Frontend — Profile & Password (P2)

```text
13. hooks/use-profile.ts       — React Query hooks para perfil
14. pages/Profile.tsx          — Visualizar/editar perfil
15. pages/ForgotPassword.tsx   — Solicitar recuperação
16. pages/ResetPassword.tsx    — Redefinir senha com token
```

### 5. Frontend — Admin Pages (P3)

```text
17. services/admin.ts          — Funções apiFetch para CRUD admin
18. hooks/use-admin.ts         — React Query hooks para admin
19. pages/admin/Users.tsx      — Lista/criar usuários
20. pages/admin/UserAcl.tsx    — Atribuir roles/permissões
21. pages/admin/Roles.tsx      — Lista/criar roles
22. pages/admin/RolePermissions.tsx — Associar permissões a role
23. pages/admin/Permissions.tsx — Lista/criar permissões
```

## Testando

### Login Manual

```bash
# Backend deve estar rodando em http://localhost:3333
# Frontend deve estar rodando em http://localhost:5173

# 1. Abrir http://localhost:5173 → deve redirecionar ao /login
# 2. Logar com credenciais admin
# 3. Verificar: Dashboard carrega, avatar aparece no header
# 4. Clicar no avatar → dropdown com "Meu Perfil" e "Sair"
# 5. Se admin: seção "Administração" visível no sidebar
```

### Smoke Test — Contratos de API

Após implementar endpoints, validar que os contratos retornam o formato correto:

```bash
# 1. Obter token de autenticação
TOKEN=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@louvorflow.com","password":"Admin@123"}' \
  | jq -r '.token')

# 2. Verificar que login retorna roles e avatar_url (campos achatados):
curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@louvorflow.com","password":"Admin@123"}' \
  | jq '.user | keys'
# Esperado: ["avatar","avatar_url","created_at","email","id","name","permissions","roles","updated_at"]

# 3. Verificar que GET /api/users retorna avatar_url e roles flat:
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[0] | keys'
# Esperado: ["avatar","avatar_url","created_at","email","id","name","permissions","roles","updated_at"]

# 4. Verificar que GET /api/roles retorna permissions flat:
curl -s http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data[0].permissions[0] | keys'
# Esperado: ["created_at","description","id","name","updated_at"]

# 5. Verificar profile:
curl -s http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  | jq 'keys'
# Esperado: ["avatar","avatar_url","created_at","email","id","name","permissions","roles","updated_at"]
```

### Testes Automatizados

```bash
cd packages/frontend
npm test          # Vitest unit tests
npx playwright test  # E2E tests (se configurados)
```

## Variáveis de Ambiente (Frontend)

```text
VITE_API_BASE_URL=http://localhost:3333/api   # URL base da API (já existente)
```

Nenhuma variável nova necessária no frontend. Tokens são gerenciados em runtime.
