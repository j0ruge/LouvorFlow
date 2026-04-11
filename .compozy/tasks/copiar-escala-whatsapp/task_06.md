---
status: completed
title: Frontend — `lib/whatsapp-share.ts` pure formatter + Vitest unit tests
type: frontend
complexity: medium
dependencies:
    - task_04
---

# Task 06: Frontend — `lib/whatsapp-share.ts` pure formatter + Vitest unit tests

## Overview
Implements the heart of the share feature: a pure function that turns an `EventoShow` into a WhatsApp-formatted string, plus a small URL-builder helper and a clipboard helper. All three are exported from `packages/frontend/src/lib/whatsapp-share.ts` and fully covered by Vitest unit tests because the canonical layout is the most failure-sensitive part of the feature.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- The file MUST export `formatEscalaWhatsApp(evento: EventoShow): string` as a pure function with no side effects, returning text that exactly matches the canonical layout in PRD section "Core Features → WhatsApp-formatted message generator".
- The header line MUST use `*<Tipo de evento>*` (bold) followed by `— _<DD/MM/AAAA HH:mm>_` (italic), where the date is rendered with `Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })`.
- The "🎵 *Músicas* (n)" header MUST be followed by numbered song lines, each rendering `<n>. <nome> (<tom>)` and an optional second line containing the version link, indented with three spaces.
- The "(<tom>)" segment MUST be omitted entirely when the song has no `tonalidade`.
- The link line MUST be omitted entirely when `versao_selecionada === null` or when `versao_selecionada.link_versao === null`.
- The "👥 *Integrantes* (n)" header MUST be followed by member lines `<nome> — <funcao1>, <funcao2>` ordered alphabetically by `nome` (case-insensitive); members with no functions render as `<nome>` with no trailing dash.
- An empty escala (zero songs and zero members) MUST render the headers with `(0)` counts and no body lines.
- The file MUST export `buildWhatsAppShareUrl(message: string): string` returning `https://wa.me/?text=` + `encodeURIComponent(message)`.
- The file MUST export an async helper `copyEscalaToClipboard(evento: EventoShow): Promise<void>` that calls `navigator.clipboard.writeText(formatEscalaWhatsApp(evento))` and lets rejections bubble up so callers can show toast errors.
</requirements>

## Subtasks
- [ ] 6.1 Create `packages/frontend/src/lib/whatsapp-share.ts` with the three exports.
- [ ] 6.2 Write `packages/frontend/src/lib/whatsapp-share.test.ts` covering the cases listed below.
- [ ] 6.3 Verify the test suite passes with `npm run test` in `packages/frontend/`.

## Implementation Details
See TechSpec section "Core Interfaces" for the exact function signatures and PRD section "Core Features → WhatsApp-formatted message generator" for the canonical layout. Use template literals; do not pull in any markdown or templating dependency.

### Relevant Files
- `packages/frontend/src/schemas/evento.ts` — `EventoShow` and `MusicaEvento` types (extended in task_04)
- `packages/frontend/src/lib/` — directory for the new module
- `packages/frontend/vitest.config.ts` — created in task_04

### Dependent Files
- `packages/frontend/src/components/EscalaShareActions.tsx` — created in task_07, will import all three exports

### Related ADRs
- [ADR-003: Pure frontend formatter for the WhatsApp message](adrs/adr-003.md) — Mandates the pure-function location and Vitest coverage.

## Deliverables
- New `whatsapp-share.ts` module with the three exports.
- New `whatsapp-share.test.ts` covering all listed cases.
- Vitest unit tests with 80%+ coverage on the formatter **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] Full escala fixture (header + 3 songs with keys + selected versions with links + 4 members with multiple functions) renders an exact-match string.
  - [ ] Song without `tonalidade` omits the `(<Tom>)` segment in its line.
  - [ ] Song with `versao_selecionada === null` renders only the name + key line, no link line.
  - [ ] Song with `versao_selecionada.link_versao === null` renders only the name + key line, no link line.
  - [ ] Member with `funcoes: []` renders as `<nome>` with no trailing dash.
  - [ ] Members are sorted alphabetically by `nome`, case-insensitive (e.g., "ana" before "Bruno").
  - [ ] Empty escala renders `🎵 *Músicas* (0)` and `👥 *Integrantes* (0)` with no body lines.
  - [ ] Header date is formatted as Brazilian `DD/MM/YYYY HH:mm` and wrapped in `_..._`.
  - [ ] `buildWhatsAppShareUrl` returns `https://wa.me/?text=...` with the message URL-encoded (spaces become `%20`, line breaks become `%0A`).
  - [ ] `copyEscalaToClipboard` calls `navigator.clipboard.writeText` with the formatted output (mocked clipboard).
  - [ ] `copyEscalaToClipboard` rejects when `navigator.clipboard.writeText` rejects (regression: do not swallow the error).
- Integration tests:
  - [ ] N/A — pure functions only; end-to-end behavior is verified in task_08's smoke test.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npm run test` in `packages/frontend/` exits 0
- The full-escala test produces the exact byte sequence specified in the PRD example (visible diff in PR if it changes)
