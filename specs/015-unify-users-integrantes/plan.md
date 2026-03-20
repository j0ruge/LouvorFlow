# Implementation Plan: Unificação das Tabelas Users e Integrantes

**Branch**: `018-unify-users-integrantes` | **Date**: 2026-03-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-unify-users-integrantes/spec.md`

## Summary

Unificar as tabelas `integrantes` e `users` em uma única tabela `users`, migrando campos de domínio (`telefone`) e relações (eventos, funções musicais) para o model `Users`. A migração usa transação única com merge por email, preservando 100% dos vínculos. Os endpoints `/api/integrantes` são mantidos para retrocompatibilidade, operando sobre `users` com mapeamento de campos. Frontend atualizado para consumir o model unificado.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend via Sucrase, frontend via Vite)
**Primary Dependencies**: Express 5.1, Prisma 6.19, React 18, React Query, Zod, bcryptjs
**Storage**: PostgreSQL 17 (Docker, port 35432)
**Testing**: Vitest 4
**Target Platform**: Web (Node.js server + SPA)
**Project Type**: Web application (monorepo: backend + frontend)
**Performance Goals**: N/A (small-scale church ministry app)
**Constraints**: Migration must be transactional (rollback total em caso de falha)
**Scale/Scope**: ~50 users max, 14 domain models + 8 auth models → reduz para 12+8=20 models

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | ✅ PASS | Frontend changes are minimal — same UI components, same responsive design |
| II. Relational Data Integrity | ✅ PASS | UUID PKs preserved, CASCADE FKs maintained, junction tables renamed (not removed), Prisma migration |
| III. RESTful API as Single Source of Truth | ✅ PASS | Endpoints mantidos com naming português (`/api/integrantes`), contrato de resposta preservado |
| IV. Version-Centric Repertoire | ✅ PASS | Not affected — music/version model untouched |
| V. Simplicity & Pragmatism | ✅ PASS | Merge two tables into one IS simplification — removes duplication, single source of truth |

**Gate result**: ALL PASS — no violations, no justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/018-unify-users-integrantes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── integrantes-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # MODIFY: Users model + new junctions, remove Integrantes
│   │   ├── cliente.ts             # MODIFY: remove integrantes $extends filter
│   │   └── migrations/            # NEW: data migration script
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── integrantes.controller.ts  # MODIFY: operate on Users model
│   │   │   └── eventos.controller.ts      # MODIFY: update integrantes references
│   │   ├── services/
│   │   │   ├── integrantes.service.ts     # MODIFY: use Users model, hash password on create
│   │   │   ├── eventos.service.ts         # MODIFY: update junction references
│   │   │   └── relatorios.service.ts      # No change (doesn't count integrantes)
│   │   ├── repositories/
│   │   │   ├── integrantes.repository.ts  # MODIFY: query Users table with field mapping
│   │   │   └── eventos.repository.ts      # MODIFY: update junction table references
│   │   ├── routes/
│   │   │   └── integrantes.routes.ts      # MODIFY: add validators (Zod)
│   │   ├── types/
│   │   │   └── index.ts                   # MODIFY: update types and INTEGRANTE_PUBLIC_SELECT
│   │   └── validators/
│   │       └── integrantes.validators.ts  # NEW: Zod schemas for integrantes endpoints
│   └── tests/                             # MODIFY: update all integrantes-related tests
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Members.tsx                # MODIFY: minimal — same UI, updated types
│   │   │   └── Dashboard.tsx              # MODIFY: count by funcoes (Users_Funcoes)
│   │   ├── components/
│   │   │   ├── IntegranteForm.tsx          # MODIFY: password field on create
│   │   │   └── EventoDetail.tsx           # MODIFY: update type references
│   │   ├── services/
│   │   │   ├── integrantes.ts             # MODIFY: update schemas
│   │   │   └── eventos.ts                 # MODIFY: update schemas
│   │   ├── hooks/
│   │   │   └── use-integrantes.ts         # MODIFY: update types
│   │   └── schemas/
│   │       ├── integrante.ts              # MODIFY: align with unified model
│   │       └── evento.ts                  # MODIFY: update integrante references
│   └── tests/                             # MODIFY: update integrantes tests
└── docs/
    └── openapi.json                       # MODIFY: update schemas and endpoints
```

**Structure Decision**: Existing monorepo structure (packages/backend + packages/frontend) is preserved. No new directories needed — only modifications to existing files plus one new migration script and one new validator file.

## Complexity Tracking

> No violations — table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
