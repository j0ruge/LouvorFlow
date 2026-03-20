# Implementation Plan: Visibilidade ACL no Frontend

**Branch**: `019-frontend-acl-visibility` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-frontend-acl-visibility/spec.md`

## Summary

Implementar controle de visibilidade granular no frontend e backend para ocultar botões CRUD (criar, editar, excluir) de usuários sem permissão adequada. O backend migra de `ensureHasRole` (qualquer role permite escrita em tudo) para `can(['<recurso>.write'])` (permissão específica por domínio). O frontend ganha um hook `useCan()` e componente `<Can>` para renderização condicional baseada em permissões efetivas do usuário. Quatro novas permissões de domínio são criadas via seed: `configuracoes.write`, `integrantes.write`, `escalas.write`, `musicas.write`.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend + frontend)
**Primary Dependencies**: Express 5.1, Prisma 6.19, React 18, Vite, TailwindCSS, shadcn/ui
**Storage**: PostgreSQL 17 (via Docker Compose, porta 35432)
**Testing**: Vitest 4 (backend unit + frontend)
**Target Platform**: Web (mobile-first responsive)
**Project Type**: Web application (monorepo: `packages/backend` + `packages/frontend`)
**Performance Goals**: N/A (UI visibility toggles, no performance-critical paths)
**Constraints**: Fail-closed (hide buttons while loading), no flicker
**Scale/Scope**: 8 domain route files (backend), 8 page/component files (frontend), 1 seed file, 2 new frontend utilities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First & Cross-Platform Ready | PASS | No new UI components; existing buttons are conditionally rendered. `useCan` hook is portable to React Native. |
| II. Relational Data Integrity | PASS | No schema changes. New seed data uses existing Permission/Role tables with UUID PKs. |
| III. RESTful API as Single Source of Truth | PASS | No API response changes. Authorization middleware swap only. Profile endpoint already returns permissions. |
| IV. Version-Centric Repertoire Model | N/A | Feature does not touch music/version domain model. |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Reuses existing `can()` middleware and existing user data shape. No new abstractions beyond a single hook + wrapper component. |

**Post-Phase 1 re-check**: All gates still pass. No new patterns or abstractions beyond `useCan` hook and `<Can>` component, both minimal utilities.

## Project Structure

### Documentation (this feature)

```text
specs/019-frontend-acl-visibility/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: seed data + permission mapping
├── quickstart.md        # Phase 1: getting started guide
├── contracts/
│   └── api-changes.md   # Phase 1: route authorization changes
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── seeds/
│   └── admin.ts                    # MODIFIED: add 4 domain permissions + admin associations
├── src/
│   ├── routes/
│   │   ├── artistas.routes.ts      # MODIFIED: ensureHasRole → can(['configuracoes.write'])
│   │   ├── categorias.routes.ts    # MODIFIED: ensureHasRole → can(['configuracoes.write'])
│   │   ├── funcoes.routes.ts       # MODIFIED: ensureHasRole → can(['configuracoes.write'])
│   │   ├── tonalidades.routes.ts   # MODIFIED: ensureHasRole → can(['configuracoes.write'])
│   │   ├── tipos-eventos.routes.ts # MODIFIED: ensureHasRole → can(['configuracoes.write'])
│   │   ├── integrantes.routes.ts   # MODIFIED: ensureHasRole → can(['integrantes.write'])
│   │   ├── eventos.routes.ts       # MODIFIED: ensureHasRole → can(['escalas.write'])
│   │   └── musicas.routes.ts       # MODIFIED: ensureHasRole → can(['musicas.write'])
│   └── middlewares/
│       └── can.ts                  # UNCHANGED (already works perfectly)
└── tests/
    └── services/                   # MODIFIED: update tests that mock ensureHasRole

packages/frontend/
├── src/
│   ├── hooks/
│   │   └── use-can.ts              # NEW: useCan() hook + useEffectivePermissions()
│   ├── components/
│   │   ├── Can.tsx                 # NEW: <Can permission="..."> wrapper
│   │   ├── ConfigCrudSection.tsx   # MODIFIED: add readOnly prop
│   │   ├── MusicaDetail.tsx        # MODIFIED: wrap CRUD actions with useCan
│   │   └── EventoDetail.tsx        # MODIFIED: wrap CRUD actions with useCan
│   ├── pages/
│   │   ├── Settings.tsx            # MODIFIED: pass readOnly based on useCan
│   │   ├── Members.tsx             # MODIFIED: conditional create/edit/delete + self-edit
│   │   ├── Scales.tsx              # MODIFIED: conditional create/edit/delete
│   │   ├── Songs.tsx               # MODIFIED: conditional create button
│   │   └── SongDetail.tsx          # UNCHANGED (delegates to MusicaDetail)
│   └── lib/
│       └── api.ts                  # MODIFIED: 403 toast handling
└── tests/                          # NEW: useCan hook tests
```

**Structure Decision**: Existing monorepo structure (`packages/backend` + `packages/frontend`). No new directories needed. Two new files in frontend (`use-can.ts`, `Can.tsx`), rest are modifications to existing files.

## Implementation Approach

### Layer 1: Backend — Seed + Route Migration

**1.1 Extend seed script** (`seeds/admin.ts`):
- Add 4 `Permissions.upsert()` calls for domain permissions
- Add 4 `PermissionsRoles.upsert()` calls associating them to admin role
- Idempotent, follows existing pattern

**1.2 Migrate domain routes** (8 files):
- Replace `import { ensureHasRole }` with `import { can }`
- Replace `ensureHasRole` middleware calls with `can(['<recurso>.write'])`
- GET endpoints remain `ensureAuthenticated` only
- Each file: ~3 lines changed (import + middleware calls)

**1.3 Update backend tests**:
- Tests that reference `ensureHasRole` in domain service tests may need updating
- Verify `can()` middleware tests cover the new permission names

### Layer 2: Frontend — Permission Utilities

**2.1 Create `useCan` hook** (`hooks/use-can.ts`):
- `useEffectivePermissions()`: computes Set of all permission names from `user.roles[].permissions[]` + `user.permissions[]`
- `useCan(permission: string)`: returns `{ can: boolean, isLoading: boolean }`
- Admin bypass: if effective permissions include `admin_full_access`, return `true` for any check
- While `isLoading` (auth context loading), return `{ can: false, isLoading: true }` (fail-closed)

**2.2 Create `<Can>` component** (`components/Can.tsx`):
- Props: `permission: string`, `children: ReactNode`, optional `fallback?: ReactNode`
- Uses `useCan()` internally
- Renders children if allowed, fallback (or nothing) if not
- Does not render during loading (fail-closed)

### Layer 3: Frontend — 403 Handling

**3.1 Add 403 toast** (`lib/api.ts`):
- In `apiFetch`, after checking for 401 (refresh logic), add 403 check
- Import toast from shadcn/sonner
- Show "Permissão negada" toast on 403 response
- Do not throw — let the mutation error handler in React Query also fire

### Layer 4: Frontend — Page Modifications

**4.1 ConfigCrudSection** — add `readOnly?: boolean` prop:
- When `readOnly=true`: hide create input field, hide edit (Pencil) icons, hide delete (Trash2) icons
- List items render as read-only text

**4.2 Settings.tsx** — use `useCan('configuracoes.write')`:
- Pass `readOnly={!canWrite}` to each `ConfigCrudSection`

**4.3 Members.tsx** — use `useCan('integrantes.write')` + self-edit:
- Hide "Novo Integrante" button if `!canWrite`
- Hide edit/delete buttons on other members' cards if `!canWrite`
- Always show "Editar" on own card (compare `integrante.id === user.id`)
- "Contatar" button always visible

**4.4 Scales.tsx** — use `useCan('escalas.write')`:
- Hide "Nova Escala" button if `!canWrite`
- Hide "Editar" and "Excluir" buttons on cards if `!canWrite`
- "Ver Detalhes" always visible

**4.5 EventoDetail.tsx** — use `useCan('escalas.write')`:
- Hide "Editar" and "Excluir" buttons in header if `!canWrite`
- Hide add/remove controls for músicas and integrantes if `!canWrite`

**4.6 Songs.tsx** — use `useCan('musicas.write')`:
- Hide "Nova Música" button if `!canWrite`

**4.7 MusicaDetail.tsx** — use `useCan('musicas.write')`:
- Hide inline edit (Pencil) on name if `!canWrite`
- Hide "Excluir" (delete) button if `!canWrite`
- Hide "Nova Versão" button if `!canWrite`
- Hide edit/remove icons on versions if `!canWrite`
- Hide add/remove controls for categorias and funções if `!canWrite`

### Layer 5: Documentation

- Update `packages/backend/docs/openapi.json` to reflect new authorization requirements (403 on domain write endpoints without specific permission)
- Update `CLAUDE.md` or rules if new patterns introduced

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
