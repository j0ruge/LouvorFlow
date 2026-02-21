# Implementation Plan: Enhanced Music Registration Form

**Branch**: `008-enhanced-musica-form` | **Date**: 2026-02-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-enhanced-musica-form/spec.md`

## Summary

Replace the current two-field music creation form (nome + tonalidade) with a unified form that captures all music and version data in one step. Add a composite backend endpoint that atomically creates the music and its default version in a single transaction. Implement creatable combobox components for tonalidade and artista fields that allow inline creation of new lookup entities without leaving the form. Extend the edit form with the same expanded fields, pre-populated from the default (oldest) version.

## Technical Context

**Language/Version**: TypeScript 5.9 (backend + frontend)
**Primary Dependencies**: Express 5.1, Prisma 6.19, React 18, Vite, TailwindCSS, shadcn/ui, React Query 5, React Hook Form 7, Zod 3, cmdk 1.1
**Storage**: PostgreSQL 17 via Docker Compose (port 35432)
**Testing**: Manual HTTP testing (Vitest 4 configured but no test suite active)
**Target Platform**: Web (mobile-first responsive), future React Native
**Project Type**: Web application (monorepo: `packages/backend` + `packages/frontend`)
**Performance Goals**: N/A (small-scale church ministry app)
**Constraints**: Mobile-first UI, Portuguese entity naming, UUID v4 PKs, Prisma migrations only
**Scale/Scope**: ~30 members, ~100 songs, ~50 events/year

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Mobile-First & Cross-Platform Ready | PASS | Form uses shadcn/ui responsive components. No web-only APIs in shared logic. Combobox works on mobile viewports. |
| II. Relational Data Integrity | PASS | No schema changes. Composite endpoint uses Prisma transaction to maintain referential integrity. Inline creation respects unique constraints. |
| III. RESTful API as Single Source of Truth | PASS | New composite endpoint follows `/api/musicas` pattern. All frontend data access goes through API. Portuguese entity naming preserved. |
| IV. Version-Centric Repertoire Model | PASS | Music (composition) and Version (arrangement) remain distinct. Version metadata (BPM, cifras, lyrics, link) belongs to `artistas_musicas`. Tonalidade stays on Music entity. |
| V. Simplicity & Pragmatism (YAGNI) | PASS | Composite endpoint is the simplest way to guarantee atomicity. Reuses existing service methods. CreatableCombobox builds on already-installed cmdk + Popover. |

## Project Structure

### Documentation (this feature)

```text
specs/008-enhanced-musica-form/
├── plan.md              # This file
├── research.md          # Phase 0: design decisions
├── data-model.md        # Phase 1: entity documentation
├── quickstart.md        # Phase 1: manual testing guide
├── contracts/           # Phase 1: API contracts
│   └── composite-create.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/backend/
├── src/
│   ├── controllers/
│   │   └── musicas.controller.ts        # MODIFY — add createComplete, updateComplete
│   ├── services/
│   │   └── musicas.service.ts           # MODIFY — add createComplete, updateComplete
│   ├── repositories/
│   │   └── musicas.repository.ts        # MODIFY — add createWithVersao, updateWithVersao
│   ├── routes/
│   │   └── musicas.routes.ts            # MODIFY — add POST /complete, PUT /:id/complete
│   └── types/
│       └── index.ts                     # MODIFY — add CreateMusicaCompleteInput, UpdateMusicaCompleteInput

packages/frontend/
├── src/
│   ├── components/
│   │   ├── MusicaForm.tsx               # MODIFY — expand to unified form with all fields
│   │   ├── CreatableCombobox.tsx         # NEW — reusable combobox with inline creation
│   │   └── MusicaDetail.tsx             # MODIFY — use expanded form for edit mode
│   ├── schemas/
│   │   └── musica.ts                    # MODIFY — add CreateMusicaCompleteFormSchema
│   ├── hooks/
│   │   └── use-musicas.ts              # MODIFY — add useCreateMusicaComplete, useUpdateMusicaComplete
│   └── services/
│       └── musicas.ts                   # MODIFY — add createMusicaComplete, updateMusicaComplete
```

**Structure Decision**: Existing monorepo web application structure (`packages/backend` + `packages/frontend`). No new directories needed — all changes extend existing files plus one new component (`CreatableCombobox.tsx`).

## Complexity Tracking

> No constitution violations. No complexity justification needed.
