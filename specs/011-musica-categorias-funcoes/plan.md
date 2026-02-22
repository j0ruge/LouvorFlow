# Implementation Plan: Categorias e Funções Requeridas no Formulário de Música

**Branch**: `011-musica-categorias-funcoes` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-musica-categorias-funcoes/spec.md`

## Summary

Adicionar campos multi-seleção de Categorias e Funções Requeridas ao formulário de cadastro/edição de música (`MusicaForm`), com busca e criação inline. A infraestrutura de backend (schema Prisma, endpoints CRUD, endpoints de junção, hooks React Query) já existe. O trabalho foca em: (1) criar um componente `CreatableMultiCombobox` para seleção múltipla com criação inline, (2) estender os endpoints `/musicas/complete` para aceitar arrays de IDs de categorias/funções, (3) integrar os novos campos no `MusicaForm`, e (4) atualizar schemas Zod de validação.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), JavaScript ES Modules via Sucrase (backend)
**Primary Dependencies**: React 18, react-hook-form, Zod, shadcn/ui (Command, Popover, Badge), Express 5, Prisma 6
**Storage**: PostgreSQL 17 (tabelas `musicas_categorias`, `musicas_funcoes` já existem)
**Testing**: Vitest 4
**Target Platform**: Web (mobile-first responsive)
**Project Type**: Web application (monorepo packages/backend + packages/frontend)
**Performance Goals**: Standard web app — combobox filtering client-side, sem latência perceptível
**Constraints**: Nenhuma constraint adicional — campos opcionais, lookup tables pequenas
**Scale/Scope**: Dezenas de categorias e funções; centenas de músicas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First | PASS | Componente multi-select usa shadcn/ui (portável); sem DOM manipulation direta |
| II. Relational Data Integrity | PASS | Junction tables `musicas_categorias` e `musicas_funcoes` já existem com UUID PKs e ON DELETE CASCADE |
| III. RESTful API | PASS | Estende endpoints existentes `/api/musicas/complete`; endpoints de junção já seguem padrão REST |
| IV. Version-Centric Model | PASS | Categorias e funções são atributos da Música (composição), não da Versão — correto |
| V. Simplicity (YAGNI) | PASS | Novo componente `CreatableMultiCombobox` em vez de abstrair sobre o existente; extensão mínima do backend |

**Post-Design Re-check**: Todos os princípios continuam satisfeitos. Nenhuma violação.

## Project Structure

### Documentation (this feature)

```text
specs/011-musica-categorias-funcoes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── musicas-complete-extended.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── src/
│   ├── controllers/musicas.controller.ts   # Sem mudança (já delega ao service)
│   ├── services/musicas.service.ts         # Estender createComplete/updateComplete
│   └── repositories/musicas.repository.ts  # Estender createWithVersao/updateWithVersao
└── tests/
    └── unit/
        └── musicas.service.test.ts         # Novos testes para campos de categorias/funcoes

packages/frontend/
├── src/
│   ├── components/
│   │   ├── CreatableMultiCombobox.tsx       # NOVO: Componente multi-select com criação inline
│   │   └── MusicaForm.tsx                  # Estender com campos de categorias e funções
│   ├── schemas/musica.ts                   # Estender schemas com categoria_ids/funcao_ids
│   ├── hooks/use-musicas.ts                # Sem mudança (hooks de junção já existem)
│   └── services/musicas.ts                 # Estender payloads de create/update
└── tests/
    └── unit/
        └── CreatableMultiCombobox.test.tsx  # Testes do novo componente
```

**Structure Decision**: Web application monorepo existente (`packages/backend` + `packages/frontend`). Apenas arquivos existentes são estendidos, exceto pelo novo componente `CreatableMultiCombobox.tsx`.

## Complexity Tracking

> Nenhuma violação de constitution. Tabela não aplicável.
