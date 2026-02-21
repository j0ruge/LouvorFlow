# Research: Enhanced Music Registration Form

**Feature**: `008-enhanced-musica-form`
**Date**: 2026-02-21

## R-001: Composite Backend Endpoint vs Frontend Orchestration

**Decision**: Add a composite `POST /api/musicas/complete` endpoint that handles music + version creation in a single Prisma transaction.

**Rationale**: Frontend orchestration would require 2-4 sequential HTTP calls (create tonalidade → create artista → create musica → add versão). If any intermediate step fails, the database is left in an inconsistent state (e.g., musica created but versão missing). A composite endpoint wraps the entire operation in a `prisma.$transaction()`, guaranteeing atomicity. This also simplifies frontend logic to a single mutation.

**Alternatives considered**:
- **Frontend orchestration with rollback**: Rejected — manual rollback (deleting created entities on failure) is error-prone and adds complexity.
- **Saga pattern**: Rejected — over-engineered for a small-scale app (Constitution V: YAGNI).

---

## R-002: Combobox Component Approach

**Decision**: Build a reusable `CreatableCombobox` component using the already-installed shadcn/ui `Command` (cmdk) + `Popover` primitives.

**Rationale**: The project already has `cmdk` (1.1.1), `@radix-ui/react-popover`, and the shadcn/ui `Command` and `Popover` components installed. Building a creatable combobox on top of these avoids adding new dependencies. The component accepts `options`, `onSelect`, `onCreate`, and `searchPlaceholder` props for reusability across tonalidade and artista fields.

**Alternatives considered**:
- **react-select/creatable**: Rejected — adds a new dependency and doesn't match the shadcn/ui design system.
- **Standard `<Select>` with separate "Add" button**: Rejected — breaks FR-014 (user must not leave form context) and is a worse UX than inline creation.
- **shadcn/ui Combobox recipe**: This IS the chosen approach — cmdk + Popover is the official shadcn/ui pattern for comboboxes.

---

## R-003: Form Schema Strategy

**Decision**: Create a new `CreateMusicaCompleteFormSchema` Zod schema that combines music fields (nome, fk_tonalidade) with optional version fields (artista_id, bpm, cifras, lyrics, link_versao). Add a `.superRefine()` validation: if any version field is filled, `artista_id` is required (FR-004).

**Rationale**: A single schema for the unified form keeps validation co-located and leverages the existing React Hook Form + Zod resolver pattern. The `.superRefine()` handles the cross-field validation (version fields require artista) that Zod's basic schema can't express per-field.

**Alternatives considered**:
- **Two separate forms composed in a wrapper**: Rejected — adds unnecessary component nesting and complicates cross-field validation.
- **Backend-only validation**: Rejected — user-facing validation must provide instant feedback (FR-004 requires blocking alert before submission).

---

## R-004: Cache Invalidation After Inline Creation

**Decision**: After inline creation of a tonalidade or artista via the combobox, invalidate the respective React Query cache key (`['tonalidades']` or `['artistas']`) to keep the combobox options fresh. Use the mutation's `onSuccess` callback to trigger invalidation.

**Rationale**: The existing `useCreateTonalidade()` and `useCreateArtista()` hooks already invalidate their respective query keys on success. The `CreatableCombobox` component's `onCreate` handler calls these existing mutations, inheriting the cache invalidation behavior automatically.

**Alternatives considered**:
- **Optimistic local update (add to list without refetch)**: Rejected — the API returns the created entity with its server-generated UUID, which is needed for form submission. Waiting for the mutation response is necessary anyway.
- **Refetch on popover open**: Rejected — unnecessary network calls; cache invalidation is more efficient.

---

## R-005: Edit Mode — Default Version Selection

**Decision**: When loading a music for editing, the backend's `getById` already returns all versions via the `Artistas_Musicas` relation. The frontend selects the default version by sorting versions by `created_at` ascending and taking the first one (oldest = the version created during initial registration).

**Rationale**: The clarification session confirmed "versão padrão" = oldest by `created_at`. No schema changes needed — `created_at` already exists on `artistas_musicas`. Frontend sorts client-side since the number of versions per music is small (typically 1-3).

**Alternatives considered**:
- **Add `is_default` boolean column**: Rejected — adds schema complexity and migration for something derivable from existing data (Constitution V: YAGNI).
- **Backend returns versions pre-sorted**: The backend already returns versions via Prisma include — adding an `orderBy: { created_at: 'asc' }` is a minor backend enhancement that could be done but isn't strictly required. Client-side sort is sufficient.
