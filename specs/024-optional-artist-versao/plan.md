# Implementation Plan: Artista Opcional em Versão de Música

**Branch**: `024-optional-artist-versao` | **Date**: 2026-04-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/024-optional-artist-versao/spec.md`

## Summary

Tornar `artista_id` nullable na tabela `artistas_musicas` para permitir criação de versões sem artista. Envolve migration, atualização de validators/service/repository no backend, ajuste de schemas/componentes no frontend, e novos testes. Abordagem: null real no banco (não sentinela), com guard de duplicata na camada de serviço (max 1 versão sem artista por música por tenant).

## Technical Context

**Language/Version**: TypeScript 5.9 (backend via Sucrase, frontend nativo)
**Primary Dependencies**: Express 5.1, React 18, Prisma 6.19, Zod, shadcn/ui, TailwindCSS
**Storage**: PostgreSQL 17 (container `louvorflow_db`, porta 35432)
**Testing**: Vitest 4 (unit tests com fakes/mocks)
**Target Platform**: Web app, mobile-first responsive
**Project Type**: Monorepo web-service (backend + frontend)
**Performance Goals**: N/A (relaxamento de constraint, sem impacto de performance)
**Constraints**: Multi-tenant (isolamento lógico via `tenant_id`), partial unique index para manter integridade
**Scale/Scope**: Alteração pontual em 14 arquivos, ~150 linhas modificadas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Mobile-First | PASS | Componentes alterados (VersaoForm, MusicaDetail, MusicaForm) já são mobile-first. Mudanças são em labels/placeholders e null-handling — sem impacto em layout. |
| II. Relational Data Integrity | PASS | Migration via Prisma. FK com CASCADE mantida (Artistas? optional relation). Partial unique index substitui o full unique para manter integridade onde artista_id IS NOT NULL. Guard de serviço para max 1 null por música. |
| III. RESTful API | PASS | Mesmos endpoints, mesma estrutura JSON. Único delta: `artista` passa a ser nullable no response. |
| IV. Version-Centric Repertoire | PASS | Versão continua como entidade distinta de Música. A mudança apenas relaxa a obrigatoriedade do vínculo artista — não altera o modelo conceitual. |
| V. Simplicity & Pragmatism | PASS | Abordagem nullable é a mais simples (vs sentinela "Desconhecido"). Sem abstrações novas. |

**GATE RESULT: ALL PASS** — nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/024-optional-artist-versao/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contract deltas)
│   └── api-changes.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                          # Model Artistas_Musicas: artista_id nullable
│   │   └── migrations/<timestamp>_.../migration.sql
│   ├── src/
│   │   ├── types/index.ts                         # VersaoRaw, Musica: artista nullable
│   │   ├── validators/musicas.validators.ts       # addVersaoBodySchema: artista_id optional
│   │   ├── services/musicas.service.ts            # addVersao, createComplete: null-artist logic
│   │   ├── repositories/musicas.repository.ts     # createVersao, findVersaoWithoutArtist
│   │   └── controllers/musicas.controller.ts      # (sem alteração direta)
│   ├── tests/
│   │   ├── fakes/fake-musicas.repository.ts       # Handle null artista_id
���   │   ├── fakes/mock-data.ts                     # Mock entry com artista_id null
│   │   └── services/musicas.service.test.ts       # Novos testes
│   └── docs/openapi.json                          # Schemas atualizados
└── frontend/
    └── src/
        ├─�� schemas/musica.ts                      # VersaoSchema, CreateVersaoFormSchema nullable
        └── components/
            ├── VersaoForm.tsx                      # Select artista opcional
            ├── MusicaDetail.tsx                    # "Não informado" display
            └── MusicaForm.tsx                      # Label "(opcional)"
```

**Structure Decision**: Monorepo existente com `packages/backend` e `packages/frontend`. Nenhuma mudança estrutural — apenas alterações em arquivos existentes.

## Complexity Tracking

Nenhuma violação de constituição — seção não aplicável.
