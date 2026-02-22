# Implementation Plan: Histórico com Dados Reais

**Branch**: `010-live-historico` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-live-historico/spec.md`

## Summary

Substituir os dados hardcoded da página de Histórico (`/historico`) por dados reais obtidos da API de eventos existente. A página passará a usar o hook `useEventos()` para buscar eventos, filtrar apenas os com data passada, e exibi-los com estados de loading, erro e vazio. O botão "Ver Detalhes" navegará para a página de detalhe de evento já existente (`/escalas/:id`).

## Technical Context

**Language/Version**: TypeScript 5.9
**Primary Dependencies**: React 18, React Router DOM, TanStack React Query, shadcn/ui, Lucide React
**Storage**: PostgreSQL 17 (via API REST existente — sem acesso direto)
**Testing**: Vitest 4
**Target Platform**: Web (SPA), mobile-first responsive
**Project Type**: Web application (monorepo com backend + frontend)
**Performance Goals**: Carregamento percebido como instantâneo em condições normais de rede
**Constraints**: Frontend-only — nenhuma alteração no backend
**Scale/Scope**: 1 página modificada, ~1-2 arquivos tocados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Layout existente já é mobile-first; nenhuma alteração de layout proposta |
| II. Relational Data Integrity | PASS | Nenhuma alteração no banco; dados consumidos via API existente |
| III. RESTful API as Single Source | PASS | Página usará `useEventos()` que consome `GET /api/eventos` |
| IV. Version-Centric Repertoire | PASS | Sem impacto — página exibe contagens, não manipula versões |
| V. Simplicity & Pragmatism | PASS | Reutiliza hooks, schemas, serviços e componentes existentes; nenhuma nova abstração |

**Gate Result**: PASS — Nenhuma violação. Pode prosseguir.

## Project Structure

### Documentation (this feature)

```text
specs/010-live-historico/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/                     # NÃO MODIFICADO nesta feature
│   └── src/
│       ├── routes/eventos.routes.ts     # GET /api/eventos (existente)
│       ├── controllers/eventos.controller.ts
│       ├── services/eventos.service.ts
│       └── repositories/eventos.repository.ts
│
└── frontend/
    └── src/
        ├── pages/
        │   └── History.tsx              # MODIFICADO — substituir hardcoded por dados reais
        ├── hooks/
        │   └── use-eventos.ts           # REUTILIZADO — useEventos(), useEvento()
        ├── services/
        │   └── eventos.ts               # REUTILIZADO — getEventos(), getEvento()
        ├── schemas/
        │   └── evento.ts                # REUTILIZADO — EventoIndex, EventoShow
        └── components/
            ├── EmptyState.tsx           # REUTILIZADO
            ├── ErrorState.tsx           # REUTILIZADO
            └── EventoDetail.tsx         # REUTILIZADO (rota /escalas/:id)
```

**Structure Decision**: Frontend-only modification. O arquivo principal é `packages/frontend/src/pages/History.tsx`. Todos os demais são reutilizados sem modificação.
