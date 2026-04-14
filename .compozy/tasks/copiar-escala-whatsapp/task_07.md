---
status: completed
title: Frontend — `EscalaShareActions` component + integration into `EventoDetail` header
type: frontend
complexity: medium
dependencies:
  - task_05
  - task_06
---

# Task 07: Frontend — `EscalaShareActions` component + integration into `EventoDetail` header

## Overview
Adds the user-facing share action group: two buttons in the `EventoDetail` header (`Copiar texto` and `Abrir no WhatsApp`) gated on `escalas.write`. The buttons consume the formatter and helpers from task_06, show Sonner toast feedback, and handle clipboard / popup failures gracefully.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- A new component `packages/frontend/src/components/EscalaShareActions.tsx` MUST render two `Button` elements ("Copiar texto" + icon, "Abrir no WhatsApp" + icon), accepting a single `evento: EventoShow` prop.
- The "Copiar texto" button MUST call `copyEscalaToClipboard(evento)` from `lib/whatsapp-share.ts`. On success it MUST show `toast.success("Escala copiada para a área de transferência")` and briefly flip its icon to a check (3 seconds, mirroring `InviteGenerateDialog.tsx`). On failure it MUST show `toast.error('Não foi possível copiar. Use o botão "Abrir no WhatsApp".')`.
- The "Abrir no WhatsApp" button MUST call `window.open(buildWhatsAppShareUrl(formatEscalaWhatsApp(evento)), '_blank', 'noopener,noreferrer')`. If `window.open` returns null (popup blocked), it MUST show `toast.error("Pop-up bloqueado. Habilite pop-ups para este site ou use 'Copiar texto'.")`.
- The component MUST be inserted into the existing header action group of `EventoDetail.tsx` (lines 338-357 area), positioned between `Editar` and `Excluir`, and MUST be gated on `canWrite` like the surrounding buttons.
- The component MUST handle `evento === undefined` defensively by rendering the buttons disabled (the parent already guards against this, but the prop type allows it for safety).
- The buttons MUST be keyboard reachable and labeled for screen readers via the existing `Button` component's accessibility props.
- A small set of unit tests using Vitest's `vi.spyOn` to mock `navigator.clipboard.writeText` and `window.open` MUST cover the success and failure branches of both buttons.
</requirements>

## Subtasks
- [x] 7.1 Create `components/EscalaShareActions.tsx` with both buttons and the toast/icon-flip logic.
- [x] 7.2 Insert `<EscalaShareActions evento={evento} />` between `Editar` and `Excluir` in `EventoDetail.tsx`.
- [x] 7.3 Verify the existing `Editar`/`Excluir` and `MusicaVersaoPicker` (from task_05) layouts are unchanged.
- [x] 7.4 Write Vitest tests covering clipboard success/failure and `window.open` success/blocked branches.
- [x] 7.5 Verify `npm run test` in `packages/frontend/` exits 0.

## Implementation Details
Reuse the icon-flip pattern from `InviteGenerateDialog.tsx` (lines 88-109). The Sonner toast import is already used elsewhere in `use-eventos.ts`. The `buildWhatsAppShareUrl` and `copyEscalaToClipboard` helpers come from task_06; the component never re-implements the format string.

### Relevant Files
- `packages/frontend/src/components/EventoDetail.tsx` — header action group (lines 338-357 area)
- `packages/frontend/src/components/InviteGenerateDialog.tsx` — clipboard pattern (lines 88-109)
- `packages/frontend/src/lib/whatsapp-share.ts` — created in task_06
- `packages/frontend/src/components/ui/button.tsx` — existing Button component
- `packages/frontend/src/hooks/use-can.ts` — `useCan` for permission gating (verify the parent already handles this; if so, do not duplicate)

### Dependent Files
- None — this is the terminal UI integration task; the only follow-up is the smoke test in task_08.

### Related ADRs
- [ADR-003: Pure frontend formatter for the WhatsApp message](adrs/adr-003.md) — Establishes that the share component delegates the format logic to the pure helper.

## Deliverables
- New `EscalaShareActions.tsx` component with both buttons.
- Wired into `EventoDetail.tsx` header.
- Vitest unit tests with 80%+ coverage on the click handlers **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] Clicking "Copiar texto" calls `navigator.clipboard.writeText` exactly once with the formatter output.
  - [ ] Clicking "Copiar texto" shows a success toast on resolved clipboard write.
  - [ ] Clicking "Copiar texto" shows the "Não foi possível copiar..." error toast when `navigator.clipboard.writeText` rejects.
  - [ ] Clicking "Copiar texto" flips the icon to a check immediately and reverts after ~3 seconds.
  - [ ] Clicking "Abrir no WhatsApp" calls `window.open` with `https://wa.me/?text=` followed by the URL-encoded formatter output.
  - [ ] Clicking "Abrir no WhatsApp" passes `_blank` and `noopener,noreferrer` features.
  - [ ] Clicking "Abrir no WhatsApp" shows the popup-blocked error toast when `window.open` returns `null`.
  - [ ] Both buttons render disabled when `evento` is `undefined`.
- Integration tests:
  - [ ] Verified end-to-end during the smoke test in task_08.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `npm run test` in `packages/frontend/` exits 0
- The two buttons appear in the header for users with `escalas.write`
- Clicking "Copiar texto" places the canonical message on the clipboard; clicking "Abrir no WhatsApp" opens a tab with the message pre-filled
