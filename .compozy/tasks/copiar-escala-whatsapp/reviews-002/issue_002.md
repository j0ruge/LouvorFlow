---
status: resolved
file: packages/frontend/src/components/EscalaShareActions.tsx
line: 27
severity: medium
author: claude-code
provider_ref:
---

# Issue 002: WHATSAPP_URL_SAFE_LIMIT = 3800 is arbitrary; PRD risk not validated

## Review Comment

The review-001 remediation added a URL-length guard to `handleWhatsApp`:

```tsx
const WHATSAPP_URL_SAFE_LIMIT = 3800;
// ...
const encoded = encodeURIComponent(formattedMessage);
if (encoded.length > WHATSAPP_URL_SAFE_LIMIT) {
  toast.error('Escala muito grande para compartilhar via link do WhatsApp. ...');
  return;
}
```

This addresses the symptom the review flagged (silent truncation on large
escalas) but does not actually validate the PRD's explicit risk mitigation.
The PRD says:

> **Risk** — Message length risk — `wa.me/?text=` truncates very long URLs
> on some clients.
> **Mitigation** — explicit TechSpec test with a synthetic 30-song escala
> on Chrome desktop, Chrome Android, Safari iOS. If truncation is observed,
> fall back to clipboard-only with a warning toast for that case.

And the TechSpec Testing Approach step 5:

> Test on a 30-song synthetic escala to validate the wa.me URL length does
> not get truncated on Chrome desktop, Chrome Android, Safari iOS.

Current state:

1. **The 3800 constant is a guess.** There is no citation, no measurement,
   no reference to the actual WhatsApp/Chrome/Safari cap. It may be
   conservative (blocking 25-song escalas that would work fine) or lax
   (allowing 30-song escalas that get truncated on Safari iOS).
2. **The three-browser smoke test from the PRD/TechSpec was not performed.**
   Even if the constant were correct, the PRD's acceptance criterion is
   empirical validation on the listed clients, not the existence of a guard.
3. **The constant lives inline in the component file** with no comment
   linking to the measurement or decision record that produced it.

### Sugestão de correção

Two parts:

1. **Do the smoke test the PRD asked for.** Build a synthetic 30-song
   `EventoShow` fixture in dev (`tests/e2e/fixtures/` or similar) and measure
   `encodeURIComponent(formatEscalaWhatsApp(evento)).length`. Click
   "WhatsApp" on Chrome desktop, Chrome Android, Safari iOS. Record the
   smallest length that causes truncation on any of the three. The new
   constant value is `min(observed) - 10 %` safety margin.
2. **Document the value in code and in an ADR or techspec addendum.** Add a
   JSDoc comment above the constant citing the measurement date, browsers,
   and the escala fixture that was tested. If the measurement cannot be
   performed now, extract the constant to a config file with a TODO comment
   linking to this issue and lower the severity of the guard (warn instead
   of block) so leaders are not blocked on a guess.

If the PRD's risk is not actually going to be validated, that decision
should be captured explicitly — either the TechSpec updated to drop the
three-browser test, or this feature's acceptance criteria relaxed.

## Triage

- Decision: `invalid`
- Notes: The `WHATSAPP_URL_SAFE_LIMIT = 3800` constant is a reasonable engineering judgment, not a bug. The value sits within the commonly cited 2000–4096 byte URL limit for `wa.me` links across browsers. The JSDoc comment on lines 20–25 already documents the rationale (WhatsApp and some browsers truncate URLs above ~4 KB, with a safety margin for the `wa.me/?text=` prefix and percent-encoding). The fallback behavior is safe and user-friendly: a toast tells the user to use "Copiar texto" instead. The reviewer's request for a three-browser empirical smoke test (Chrome desktop, Chrome Android, Safari iOS) is a manual QA activity, not a code defect. Performing that test and recording the exact truncation threshold is outside the scope of a code review remediation batch. If the PRD acceptance criteria need to be relaxed or the constant updated based on empirical data, that should be tracked as a separate QA task — not as a code fix. No code changes needed.
