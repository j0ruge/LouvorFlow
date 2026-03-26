# Implementation Plan: Intensidade de Música (por Versão)

**Branch**: `022-musica-intensidade` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/022-musica-intensidade/spec.md`

## Summary

Adicionar campo `intensidade` (calma/média/agitada) à entidade Versão (Artistas_Musicas). No backend: migration Prisma + campo em todas as camadas (types, validators, repository, service). No frontend: componente visual IntensidadeSelector com pill buttons e ícones de barras, inserido no MusicaForm (abaixo do nome) e VersaoForm, com exibição no MusicaDetail.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Node.js >=18 + Express 5 (backend)
**Primary Dependencies**: Prisma 6, React 18, Vite, TailwindCSS, shadcn/ui, Zod, React Query
**Storage**: PostgreSQL 17
**Testing**: Vitest 4
**Target Platform**: Web (mobile-first responsive)
**Project Type**: Web application (monorepo: packages/backend + packages/frontend)
**Performance Goals**: Standard web app — campo simples, sem impacto
**Constraints**: Nullable field, sem alteração em dados existentes
**Scale/Scope**: 3 valores fixos enum, ~15 arquivos modificados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Pill buttons mobile-friendly, componente portável para React Native |
| II. Relational Data Integrity | PASS | Campo nullable na tabela existente, migration via Prisma |
| III. RESTful API | PASS | Campo adicionado aos endpoints existentes, JSON consistente |
| IV. Version-Centric Model | PASS | Intensidade pertence à versão (Artistas_Musicas), não à música |
| V. Simplicity (YAGNI) | PASS | String nullable com validação Zod — sem tabela extra, sem enum PostgreSQL |

## Project Structure

### Documentation (this feature)

```text
specs/022-musica-intensidade/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Research decisions
├── data-model.md        # Data model changes
├── quickstart.md        # Implementation quickstart
├── contracts/
│   └── api.md           # API contract changes
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/backend/
├── prisma/schema.prisma                    # ADD intensidade to Artistas_Musicas
├── src/types/index.ts                      # ADD to interfaces + MUSICA_SELECT
├── src/validators/musicas.validators.ts    # ADD to 4 Zod schemas
├── src/repositories/musicas.repository.ts  # ADD to selects + create/update data
├── src/services/musicas.service.ts         # ADD to format + CRUD methods
└── docs/openapi.json                       # UPDATE Versao schemas

packages/frontend/
├── src/schemas/musica.ts                   # ADD to VersaoSchema + form schemas
├── src/components/IntensidadeSelector.tsx   # NEW component (pill buttons)
├── src/components/MusicaForm.tsx           # ADD IntensidadeSelector below Nome
├── src/components/VersaoForm.tsx           # ADD IntensidadeSelector
├── src/components/MusicaDetail.tsx         # ADD badge display per versão
└── src/services/musicas.ts                 # No changes needed (passes body through)
```

**Structure Decision**: Monorepo existente com packages/backend e packages/frontend. Novo componente `IntensidadeSelector.tsx` em components/ (reutilizável entre MusicaForm e VersaoForm).
