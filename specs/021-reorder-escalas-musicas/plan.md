# Implementation Plan: Reordenacao de Musicas na Escala

**Branch**: `021-reorder-escalas-musicas` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-reorder-escalas-musicas/spec.md`

## Summary

Adicionar campo `ordem` a tabela pivot `Eventos_Musicas` e implementar reordenacao de musicas nas escalas via drag-and-drop no frontend (mobile-first com `@dnd-kit`), com persistencia via novo endpoint `PATCH /api/eventos/:eventoId/musicas/reorder` e estrategia optimistic UI.

## Technical Context

**Language/Version**: TypeScript 5.9, Node.js >= 18
**Primary Dependencies**: Express 5, Prisma 6, React 18, @dnd-kit/core + @dnd-kit/sortable (NEW), React Query, Zod, sonner (toasts)
**Storage**: PostgreSQL 17 via Prisma ORM
**Testing**: Vitest 4 (unit tests com fakes)
**Target Platform**: Web App, mobile-first responsive design
**Project Type**: Monorepo web-service (backend API + frontend SPA)
**Performance Goals**: Reordenacao salva em < 1s, UI responde em < 100ms (optimistic)
**Constraints**: Listas pequenas (5-15 musicas), last-write-wins para concorrencia
**Scale/Scope**: Multi-tenant, escalas tipicamente com 5-15 musicas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First & Cross-Platform Ready | PASS | @dnd-kit tem sensores touch/mouse. Sem APIs web-only no shared logic. Compativel com futura migracao React Native. |
| II. Relational Data Integrity | PASS | Campo `ordem` na junction table existente. UUID mantido. Migracao via Prisma. |
| III. RESTful API as Single Source of Truth | PASS | Novo endpoint `PATCH /api/eventos/:eventoId/musicas/reorder` segue padrao REST. Nomes em portugues. |
| IV. Version-Centric Repertoire Model | N/A | Feature nao altera modelo de versoes. |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Inteiros sequenciais (nao fractional indexing). Sem WebSocket. Sem concurrency control. Minimo necessario. |

**Re-check after Phase 1**: PASS — nenhuma violacao introduzida pelo design.

## Project Structure

### Documentation (this feature)

```text
specs/021-reorder-escalas-musicas/
├── spec.md
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── reorder-musicas.md     # Phase 1 output
├── checklists/
│   └── requirements.md        # Spec quality checklist
└── tasks.md                   # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # ADD: campo 'ordem' em Eventos_Musicas
│   │   └── migrations/               # ADD: nova migracao
│   ├── src/
│   │   ├── repositories/
│   │   │   └── eventos.repository.ts  # MODIFY: reorderMusicas(), orderBy, auto-ordem
│   │   ├── services/
│   │   │   └── eventos.service.ts     # MODIFY: reorderMusicas(), ajuste em add/remove
│   │   ├── controllers/
│   │   │   └── eventos.controller.ts  # MODIFY: handler reorderMusicas()
│   │   ├── routes/
│   │   │   └── eventos.routes.ts      # MODIFY: PATCH route
│   │   ├── validators/
│   │   │   └── eventos.validators.ts  # MODIFY: reorderMusicasBodySchema
│   │   └── types/
│   │       └── index.ts               # MODIFY: EVENTO_SHOW_SELECT com ordem
│   ├── tests/
│   │   └── services/
│   │       └── eventos.service.test.ts # MODIFY: testes de reorder
│   └── docs/
│       └── openapi.json               # MODIFY: novo endpoint + campo ordem
│
└── frontend/
    ├── package.json                   # MODIFY: add @dnd-kit deps
    ├── src/
    │   ├── components/
    │   │   └── EventoDetail.tsx       # MODIFY: sortable list com DnD
    │   ├── hooks/
    │   │   └── use-eventos.ts         # MODIFY: useReorderMusicas()
    │   └── services/
    │       └── eventos.ts             # MODIFY: reorderMusicas()
    └── tests/                         # ADD: testes do hook/componente se aplicavel

```

**Structure Decision**: Monorepo existente com `packages/backend` e `packages/frontend`. Nenhuma nova pasta ou camada introduzida — todas as mudancas sao em arquivos existentes, respeitando a arquitetura em camadas atual.

## Complexity Tracking

Nenhuma violacao da Constitution. Tabela nao aplicavel.
