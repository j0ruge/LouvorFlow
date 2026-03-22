# Implementation Plan: Migração para Multi-Tenant

**Branch**: `020-multi-tenant` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-multi-tenant/spec.md`

## Summary

Migrar o LouvorFlow de single-tenant para multi-tenant usando a abordagem "Shared Database, Shared Schema". Todas as 13 tabelas de domínio + 2 tabelas de atribuição RBAC ganham coluna `tenant_id`. Isolamento automático via Prisma Client Extensions (`$extends` com `$allModels`/`$allOperations`). Login adaptado para suportar seleção de igreja quando o usuário pertence a múltiplos tenants. Nova role `super-admin` para gestão da plataforma.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js >=18
**Primary Dependencies**: Express 5, Prisma 6, Zod, bcryptjs, jsonwebtoken, dayjs
**Storage**: PostgreSQL 17 (containerizado via Docker Compose, porta 35432)
**Testing**: Vitest 4 (unitários com fakes)
**Target Platform**: Web (Linux server para API, SPA React no navegador)
**Project Type**: Web application (monorepo: backend API + frontend SPA)
**Performance Goals**: Filtro por `tenant_id` com impacto negligível (índices em todas as colunas `tenant_id`)
**Constraints**: Zero downtime na migração de dados existentes; zero perda de dados; backward-compatible para usuários single-tenant
**Scale/Scope**: Dezenas de igrejas, centenas de usuários — escala modesta

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
| --------- | ------ | ------------- |
| I. Mobile-First | PASS | Tela de seleção de tenant será mobile-first. Componentes portáveis para React Native. |
| II. Relational Data Integrity | PASS | UUID PKs, FK com CASCADE, junction tables explícitas, migrações via Prisma. |
| III. RESTful API | PASS | Novos endpoints seguem padrão REST com nomes em português: `/api/igrejas` (gestão de tenants), `/api/sessions/select-tenant` (seleção de igreja no login). |
| IV. Version-Centric Repertoire | PASS | Modelo versão-artista mantido. `Artistas_Musicas` recebe `tenant_id` sem alterar a lógica de domínio. |
| V. Simplicity & YAGNI | PASS | App-level filtering via `$extends` (mais simples que RLS). Sem abstrações prematuras. |

**Gate result**: PASS — nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/020-multi-tenant/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── sessions.md      # Login + select-tenant + switch-tenant
│   └── tenants.md       # CRUD tenants + user bindings
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── prisma/
│   ├── schema.prisma           # +Tenant, +TenantUsers, +tenant_id em 15 modelos
│   ├── cliente.ts              # Factory com $extends para tenant filtering
│   └── migrations/             # Migration multi-tenant (add columns, backfill, constraints)
├── seeds/
│   └── admin.ts                # +super-admin role, +system tenant, +default tenant, +bindings
├── src/
│   ├── middlewares/
│   │   ├── ensureAuthenticated.ts  # Extrair tenantId do JWT → req.user.tenantId
│   │   └── ensureSuperAdmin.ts     # Novo: proteger rotas de gestão de tenants
│   ├── routes/
│   │   ├── auth/sessions.routes.ts # +POST /select-tenant, +POST /switch-tenant
│   │   └── igrejas.routes.ts       # Novo: CRUD igrejas (super-admin only)
│   ├── controllers/
│   │   ├── auth/sessions.controller.ts  # Adaptar login, +selectTenant, +switchTenant
│   │   └── igrejas.controller.ts        # Novo
│   ├── services/
│   │   ├── auth/authenticate-user.service.ts  # Adaptar para multi-tenant login
│   │   └── igrejas.service.ts                 # Novo
│   ├── repositories/
│   │   ├── auth/users.repository.ts      # Queries RBAC com tenant_id
│   │   └── igrejas.repository.ts         # Novo
│   ├── validators/
│   │   └── igrejas.validators.ts         # Novo: Zod schemas
│   └── types/
│       └── express.d.ts                  # req.user.tenantId, req.prisma (tenant-scoped)
│
packages/frontend/
├── src/
│   ├── contexts/AuthContext.tsx     # +currentTenant, +switchTenant
│   ├── schemas/auth.ts             # +TenantSchema, +LoginResponse com tenants
│   ├── services/auth.ts            # +selectTenant(), +switchTenant()
│   ├── pages/SelectTenant.tsx      # Nova: tela de seleção de igreja
│   ├── components/
│   │   ├── TenantSwitcher.tsx      # Novo: dropdown no sidebar/header
│   │   └── AppSidebar.tsx          # Integrar TenantSwitcher
│   └── hooks/use-can.ts            # Ajustar para permissions por tenant
```

**Structure Decision**: Monorepo existente mantido (`packages/backend` + `packages/frontend`). Novos arquivos seguem a convenção de diretórios existente.

## Complexity Tracking

> Nenhuma violação de constitution — seção vazia.
