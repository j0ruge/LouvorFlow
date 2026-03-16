# Quickstart: 019-frontend-acl-visibility

**Date**: 2026-03-15

## Prerequisites

- Docker running (PostgreSQL container `louvorflow_db`)
- Node.js 18+
- `npm install` done in both `packages/backend` and `packages/frontend`

## Getting Started

### 1. Start the database

```bash
cd infra/postgres && docker compose up -d
```

### 2. Run the seed (creates domain permissions)

```bash
cd packages/backend && npx tsx seeds/admin.ts
```

This will create the 4 new permissions (`configuracoes.write`, `integrantes.write`, `escalas.write`, `musicas.write`) and associate them to the admin role.

### 3. Start backend and frontend

```bash
# Terminal 1
cd packages/backend && npm run dev

# Terminal 2
cd packages/frontend && npm run dev
```

### 4. Test ACL visibility

1. **Login as admin** — should see all CRUD buttons everywhere
2. **Create a test user** via admin panel (`/admin/usuarios`)
3. **Create a role** (e.g., "lider_louvor") and assign specific permissions
4. **Assign the role** to the test user via ACL page
5. **Login as test user** — should only see CRUD buttons for permitted resources

### 5. Run tests

```bash
# Backend tests
cd packages/backend && npm test

# Frontend tests
cd packages/frontend && npm test
```

## Key Files Modified

### Backend
- `seeds/admin.ts` — adds 4 domain permissions + admin role associations
- `src/routes/artistas.routes.ts` — `ensureHasRole` → `can(['configuracoes.write'])`
- `src/routes/categorias.routes.ts` — same
- `src/routes/funcoes.routes.ts` — same
- `src/routes/tonalidades.routes.ts` — same
- `src/routes/tipos-eventos.routes.ts` — same
- `src/routes/integrantes.routes.ts` — `ensureHasRole` → `can(['integrantes.write'])`
- `src/routes/eventos.routes.ts` — `ensureHasRole` → `can(['escalas.write'])`
- `src/routes/musicas.routes.ts` — `ensureHasRole` → `can(['musicas.write'])`

### Frontend (new files)
- `src/hooks/use-can.ts` — `useCan()` hook + `useEffectivePermissions()`
- `src/components/Can.tsx` — `<Can permission="...">` wrapper component

### Frontend (modified files)
- `src/lib/api.ts` — 403 toast handling
- `src/pages/Settings.tsx` — permission check for ConfigCrudSection
- `src/components/ConfigCrudSection.tsx` — `readOnly` prop
- `src/pages/Members.tsx` — permission check for create/edit/delete buttons
- `src/pages/Scales.tsx` — permission check for create/edit/delete buttons
- `src/pages/Songs.tsx` — permission check for create button
- `src/components/MusicaDetail.tsx` — permission check for all write actions
- `src/components/EventoDetail.tsx` — permission check for all write actions
