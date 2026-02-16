# Implementation Plan: Integração Frontend-Backend (Fase 1)

**Branch**: `005-frontend-backend-integration` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-frontend-backend-integration/spec.md`

## Summary

Conectar o frontend React (atualmente estático, com dados hardcoded) ao backend Express funcional, substituindo mocks por chamadas reais à API REST nos módulos de Integrantes, Músicas e Escalas. A abordagem técnica utiliza React Query v5 para gerenciamento de estado do servidor, Zod para validação de contratos, react-hook-form para formulários e Sonner para notificações de feedback. A camada de serviço será um wrapper leve sobre a Fetch API com tratamento global de erros.

## Technical Context

**Language/Version**: TypeScript 5.9, React 18.3
**Primary Dependencies**: @tanstack/react-query 5.83, zod 3.25, react-hook-form 7.61, sonner 1.7, react-router-dom 6.30
**Storage**: N/A (frontend consome API REST; dados persistidos via PostgreSQL 17 no backend)
**Testing**: Vitest 4
**Target Platform**: Web (mobile-first responsive, SPA)
**Project Type**: web (monorepo com backend/ e frontend/)
**Performance Goals**: Validação client-side <1s, auto-refresh de listas após mutação, loading states em 100% das operações assíncronas
**Constraints**: Sem autenticação nesta fase, CORS já habilitado no backend, paginação apenas em Músicas
**Scale/Scope**: 3 módulos (Integrantes, Músicas, Escalas), ~15 novos arquivos no frontend (services, hooks, schemas, componentes de formulário)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
| --------- | ------ | ------------- |
| I. Mobile-First & Cross-Platform Ready | ✅ PASS | Componentes utilizam shadcn/ui (Radix) que são mobile-first. Hooks de React Query são portáveis para React Native. Nenhuma API web-only nos hooks compartilhados. |
| II. Relational Data Integrity | ✅ PASS | Nenhuma modificação no banco de dados. Frontend consome endpoints existentes que já respeitam integridade referencial. |
| III. RESTful API as Single Source of Truth | ✅ PASS | Este é exatamente o propósito da feature — conectar frontend à API REST. Todo acesso a dados passa pela camada de API. Endpoints em português conforme convenção (`/api/integrantes`, `/api/musicas`, `/api/eventos`). |
| IV. Version-Centric Repertoire Model | ✅ PASS | A listagem de músicas exibe versões separadas (artista + BPM) distintas da composição. Schemas Zod refletem a separação Música vs Versão. |
| V. Simplicity & Pragmatism (YAGNI) | ✅ PASS | Fetch API nativo (sem Axios extra), wrapper mínimo para erros, hooks diretos sem abstrações intermediárias desnecessárias. |

**Resultado**: Todos os gates passam. Nenhuma violação de constituição.

### Post-Design Re-Check

| Princípio | Status | Nota |
| --------- | ------ | ---- |
| I. Mobile-First | ✅ PASS | Hooks e schemas não dependem de APIs web-only. Formulários usam componentes Radix (portáveis). |
| V. YAGNI | ✅ PASS | Camada de serviço tem apenas 1 arquivo (`api.ts`) com wrapper Fetch. Custom hooks são diretos (1 hook por operação CRUD). Sem repository pattern, sem abstrações extras. |

## Project Structure

### Documentation (this feature)

```text
specs/005-frontend-backend-integration/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Zod schemas & types
├── quickstart.md        # Phase 1: Setup & development guide
├── contracts/
│   └── api-endpoints.md # Phase 1: Frontend API contract reference
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/frontend/src/
├── lib/
│   └── api.ts                     # Fetch wrapper com tratamento global de erros
├── schemas/
│   ├── integrante.ts              # Zod schemas: resposta + formulário de integrante
│   ├── musica.ts                  # Zod schemas: resposta + formulário de música
│   ├── evento.ts                  # Zod schemas: resposta + formulário de evento
│   └── shared.ts                  # Zod schemas compartilhados (IdNome, Tonalidade, erro, paginação)
├── services/
│   ├── integrantes.ts             # Funções de chamada API: CRUD integrantes
│   ├── musicas.ts                 # Funções de chamada API: CRUD músicas
│   ├── eventos.ts                 # Funções de chamada API: CRUD eventos
│   └── support.ts                 # Funções de chamada API: tonalidades, funções, tipos-eventos
├── hooks/
│   ├── use-integrantes.ts         # React Query hooks: useIntegrantes, useCreateIntegrante
│   ├── use-musicas.ts             # React Query hooks: useMusicas, useCreateMusica
│   ├── use-eventos.ts             # React Query hooks: useEventos, useCreateEvento, useEventoDetail
│   └── use-support.ts             # React Query hooks: useTonalidades, useFuncoes, useTiposEventos
├── components/
│   ├── IntegranteForm.tsx         # Formulário de criação de integrante
│   ├── MusicaForm.tsx             # Formulário de criação de música
│   ├── EventoForm.tsx             # Formulário de criação de evento
│   ├── EventoDetail.tsx           # Tela de detalhes do evento (associar músicas/integrantes)
│   ├── EmptyState.tsx             # Componente reutilizável de estado vazio
│   └── ErrorState.tsx             # Componente reutilizável de estado de erro com retry
├── pages/
│   ├── Members.tsx                # Refatorado: dados do servidor + formulário
│   ├── Songs.tsx                  # Refatorado: dados do servidor + paginação + formulário
│   └── Scales.tsx                 # Refatorado: dados do servidor + formulário + detalhe
└── App.tsx                        # QueryClientProvider wrapping
```

**Structure Decision**: Estrutura web com separação clara em camadas (schemas → services → hooks → components → pages), seguindo o fluxo de dados definido no PDR. Cada camada tem responsabilidade única: schemas validam, services comunicam, hooks gerenciam estado, components renderizam.

## Complexity Tracking

Nenhuma violação de constituição a justificar. Todas as decisões seguem o caminho mais simples.
