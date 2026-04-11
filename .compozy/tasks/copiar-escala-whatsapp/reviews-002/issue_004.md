---
status: resolved
file: packages/frontend/tests/unit/components/EscalaShareActions.test.ts
line: 65
severity: low
author: claude-code
provider_ref:
---

# Issue 004: EscalaShareActions tests leak navigator.clipboard state

## Review Comment

Review-001 fix #18 replaced the leaky `Object.assign(navigator, { clipboard })`
pattern with `vi.stubGlobal('navigator', ...)` + `vi.unstubAllGlobals()` in
`src/lib/whatsapp-share.test.ts`. The same pattern is still present —
unchanged — in the component test file:

```ts
// tests/unit/components/EscalaShareActions.test.ts
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn() },
  });
});

// No afterEach — the stub persists across tests in the same file and
// potentially across suites running in the same worker.
```

Specific problems:

1. **No `afterEach` cleanup.** Later tests in the same file (and other
   tests sharing the same vitest worker) see whatever `clipboard` mock the
   previous test installed. Today the suites happen to each install their
   own mock before reading, masking the leak.
2. **Three separate `Object.assign` calls inside test bodies**
   (`lines 77, 89, 98`) do the same mutation redundantly, reinforcing the
   inconsistent pattern.
3. **Window.open handling uses a different leak pattern**
   (`globalThis.window.open = openMock`) with its own
   `beforeEach`/`afterEach` save/restore (good), proving the file already
   knows how to do cleanup — just not for navigator.

This is a low-severity test hygiene issue today because all current tests
re-install their mocks. But as soon as someone adds a test that reads
`navigator.clipboard` without re-installing it, the test will see stale
state from the previous test and silently pass or fail for the wrong
reason.

### Sugestão de correção

Mirror the pattern already applied to `src/lib/whatsapp-share.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('EscalaShareActions — handler: Copiar texto', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn();
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      clipboard: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the formatted message', async () => {
    writeTextMock.mockResolvedValueOnce(undefined);
    await copyEscalaToClipboard(makeEvento());
    expect(writeTextMock).toHaveBeenCalledOnce();
  });
});
```

Apply to all three `describe` blocks in the file. While you're there,
delete the redundant `Object.assign(navigator, { clipboard: ... })` calls
inside individual `it` bodies — one assignment per `beforeEach` is enough.

## Triage

- Decision: `valid`
- Notes: Confirmed. The file uses `Object.assign(navigator, { clipboard })` in `beforeEach` (line 66) with no `afterEach` cleanup, and repeats the same `Object.assign` inside three individual test bodies (lines 77, 89, 98). The sibling file `whatsapp-share.test.ts` was already fixed in review-001 to use `vi.stubGlobal` + `vi.unstubAllGlobals`. This file should mirror that pattern for consistency and test hygiene.
