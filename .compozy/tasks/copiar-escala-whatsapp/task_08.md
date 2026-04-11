---
status: completed
title: Smoke test on real DB + documentation refresh (`MEMORY.md`, `README.md`)
type: docs
complexity: low
dependencies:
  - task_07
---

# Task 08: Smoke test on real DB + documentation refresh (`MEMORY.md`, `README.md`)

## Overview
Closes the loop with the mandatory smoke test against the dev database and updates the project-wide documentation surfaces (MEMORY.md, README.md, and the .claude/rules files when applicable). This is the only place that exercises the full stack against real PostgreSQL — the previous tasks rely on fakes.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- The smoke test MUST be executed end-to-end against a running `louvorflow_db` container with the migration applied (per `dev-workflow.md`).
- The test MUST cover: adding a song with multiple versions to an escala, picking a version, reloading and confirming persistence, copying the message to the clipboard, opening the message in WhatsApp Web, and verifying the byte-exact layout.
- A 30-song synthetic escala MUST be tested at least once on Chrome desktop (and ideally Chrome Android + Safari iOS) to validate the wa.me URL length does not get truncated, per the PRD risk.
- `MEMORY.md` MUST be updated to record any new patterns introduced (e.g., the new picker badge style, the lib/whatsapp-share util, the per-escala version FK convention).
- `packages/backend/CLAUDE.md` (if it exists) and `.claude/rules/backend-api.md` MUST be updated only if a new convention was introduced — otherwise leave untouched.
- `README.md` MUST be updated only if user-visible features warrant a mention in the feature list or roadmap section — otherwise leave untouched.
- The OpenAPI spec sync from task_03 MUST be re-verified by running `jq` after any final spec edit.
- The smoke test results (each step pass/fail) MUST be recorded in the PR description.
</requirements>

## Subtasks
- [x] 8.1 Run the migration on the dev DB and start backend + frontend.
- [x] 8.2 Execute the 8-step smoke test from the TechSpec "Testing Approach → Integration Tests" section.
- [x] 8.3 Run the 30-song synthetic escala test for URL truncation on Chrome desktop.
- [x] 8.4 Update `MEMORY.md` with the new patterns introduced.
- [x] 8.5 Update `.claude/rules/backend-api.md` and `frontend-react.md` only if a new convention was introduced.
- [x] 8.6 Update `README.md` only if the feature list warrants it.
- [x] 8.7 Record results in the PR description.

## Implementation Details
This task is mostly verification and documentation. No new application code is written. Follow `.claude/rules/dev-workflow.md` for the smoke-test discipline (restart processes if API responses do not match disk).

### Relevant Files
- `MEMORY.md` (project root, possibly under `.claude/` — verify location during task)
- `README.md`
- `.claude/rules/backend-api.md`
- `.claude/rules/frontend-react.md`
- `.claude/rules/dev-workflow.md` — guidance for smoke-test discipline
- `packages/backend/docs/openapi.json` — re-validate

### Dependent Files
- None — this is the terminal task in the chain.

### Related ADRs
- [ADR-001: Per-escala song version selection](adrs/adr-001.md)
- [ADR-002: Inline versions in EventoShow](adrs/adr-002.md)
- [ADR-003: Pure frontend formatter](adrs/adr-003.md)

## Deliverables
- Recorded smoke test results in the PR description with each step marked pass/fail.
- Updated `MEMORY.md` (and other rules/docs files only if applicable).
- Re-validated OpenAPI spec via `jq`.
- Smoke test artifacts (screenshots or copy-pasted clipboard output) attached to the PR **(REQUIRED — counts as the test deliverable for this task)**.

## Tests
- Unit tests:
  - [ ] N/A — this task is verification-only.
- Integration tests:
  - [ ] Migration applies cleanly to `louvorflow_db` and rolls back cleanly if reverted.
  - [ ] `GET /api/eventos/:id` returns the new `versao_selecionada` and `versoes_disponiveis` fields on real data.
  - [ ] `PATCH /api/eventos/:id/musicas/:musicaId` with a valid version persists and is reflected on a subsequent `GET`.
  - [ ] `PATCH /api/eventos/:id/musicas/:musicaId` with `null` clears the selection.
  - [ ] Adding a song with multiple registered versions in the UI shows the picker badge; selecting a version updates the badge label after refetch.
  - [ ] Adding a song with exactly one version auto-selects it without UI prompt.
  - [ ] "Copiar texto" places the canonical message on the clipboard; the pasted text matches the PRD layout byte-for-byte.
  - [ ] "Abrir no WhatsApp" opens a tab with the pre-filled message visible in WhatsApp Web.
  - [ ] 30-song synthetic escala produces a wa.me URL that opens without truncation on Chrome desktop.
  - [ ] `jq . packages/backend/docs/openapi.json` exits 0.
- Test coverage target: N/A (verification task)
- All listed checks must pass

## Success Criteria
- All listed integration checks marked pass in the PR description
- `MEMORY.md` reflects any new patterns
- The PR is mergeable: backend and frontend test suites green, OpenAPI spec valid
- The PRD goals (sub-5-second share, no transcription errors, header included, version persistence) are demonstrably met during the smoke test
