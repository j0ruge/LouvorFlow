---
status: resolved
file: packages/frontend/tests/unit/components/MusicaVersaoPicker.test.ts
line: 23
severity: medium
author: claude-code
provider_ref:
---

# Issue 001: Component-level tests missing for new MusicaVersaoPicker behaviors

## Review Comment

`MusicaVersaoPicker.test.ts` exercises only the exported helper
`selectDefaultVersaoId(versoes, current)`. After the review-001 remediation the
component gained four new behaviors that are NOT covered by any test:

1. **`readOnly` mode** — renders a static `<span>` instead of a
   `<Popover>` with a `<button>` trigger. No test verifies that the read-only
   variant omits the popover, is not keyboard-focusable as a button, and still
   announces the label via `aria-label`.
2. **Stale-selection auto-clear** — the `useEffect` fires
   `onSelect(null, { silent: true })` when `versaoSelecionada` is no longer in
   `versoesDisponiveis`. No test mounts the component to verify the effect
   fires with the `silent` flag set.
3. **Auto-select effect keyed by `musicaId:length`** — the
   `autoSelectKeyRef` guard resets when the number of versions changes (e.g.,
   a version gets deleted from the catalog, dropping 2→1). No test mounts the
   component with a changing `versoesDisponiveis` prop to verify the effect
   re-fires after the prop change.
4. **Distinct badge labels** — `computeBadgeLabel` returns `"Sem artista"`
   when a version is selected but `artista_nome === null`, and `"Sem versão"`
   when nothing is selected or the selection is stale. No test verifies these
   two code paths produce different strings.

The same gap applies — with different specific behaviors — to
`packages/frontend/tests/unit/components/EscalaShareActions.test.ts`:

- The `useEffect` timer cleanup on unmount (fix for setState-post-unmount).
- The `WHATSAPP_URL_SAFE_LIMIT` early-return branch in `handleWhatsApp`.
- The `useMemo` on `formattedMessage` stabilizing the WhatsApp path.

Both test files currently re-run pure-function logic outside the React
component instead of mounting it. That means the component's wiring — props,
effects, cleanup, conditional rendering — has zero test coverage. The fact
that review-001 landed and all 8+8 tests still pass is not a validation; the
tests simply don't observe the changed surface.

### Sugestão de correção

Add component-level tests using `@testing-library/react`
(already indirectly available via React + jsdom) or `@testing-library/preact`:

```ts
import { render, screen } from '@testing-library/react';
import { MusicaVersaoPicker } from '@/components/MusicaVersaoPicker';

describe('MusicaVersaoPicker component', () => {
  it('renders static span in readOnly mode without popover trigger', () => {
    render(
      <MusicaVersaoPicker
        musicaId="m1"
        versaoSelecionada={{ id: 'v1', artista_nome: 'X', link_versao: null }}
        versoesDisponiveis={[{ id: 'v1', artista_nome: 'X', link_versao: null }]}
        onSelect={() => {}}
        isPending={false}
        readOnly
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('fires onSelect(null, { silent: true }) when selection is stale', () => {
    const onSelect = vi.fn();
    render(/* ... versaoSelecionada=id1, versoesDisponiveis=[id2] ... */);
    expect(onSelect).toHaveBeenCalledWith(null, { silent: true });
  });

  it('displays "Sem artista" for generic version and "Sem versão" for stale', () => { /* ... */ });
});
```

Add `@testing-library/react` as a devDep if not already present. Apply the
same pattern to `EscalaShareActions.test.ts` with tests that mount the
component, advance fake timers, and verify unmount cleanup via
`vi.getTimerCount()` or similar.

## Triage

- Decision: `valid`
- Notes: The current test file covers only `selectDefaultVersaoId` (pure function). The four component behaviors listed (readOnly rendering, stale-selection auto-clear, auto-select key guard, badge label variants) have zero test coverage. The `computeBadgeLabel` function is private so the only way to test it is via component mounting. `@testing-library/react` is not installed yet — will add it as devDep. Scope: add component-level tests for MusicaVersaoPicker behaviors 1–4. EscalaShareActions component tests are mentioned but out of scope for this batch issue (the file listed is `MusicaVersaoPicker.test.ts`).
- Fix approach: Install `@testing-library/react` + `@testing-library/jest-dom`, add component-level `describe('MusicaVersaoPicker component', ...)` block to the existing test file covering readOnly, stale-selection, auto-select, and badge labels.
