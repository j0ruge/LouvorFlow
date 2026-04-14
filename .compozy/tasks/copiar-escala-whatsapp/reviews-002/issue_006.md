---
status: resolved
file: packages/backend/scripts/reconcile-migration-split.ts
line: 35
severity: low
author: claude-code
provider_ref:
---

# Issue 006: reconcile-migration-split.ts lacks ops guardrails

## Review Comment

The reconcile script is idempotent and only touches `_prisma_migrations`,
which limits the blast radius. But it runs against whatever `DB_URL` the
environment provides, with no confirmation, no dry-run mode, and no
protection against being pointed at the wrong database. Specific gaps:

1. **No `DB_URL` echo or confirmation prompt.** If a developer has the
   production URL exported (e.g., via a recently-used shell from a
   troubleshooting session), running `npx tsx scripts/reconcile-migration-split.ts`
   silently mutates the production `_prisma_migrations` table. The
   production migrations table is small and the mutations are reversible,
   but it is still an unintended state change on prod without so much as
   a "are you sure?".
2. **No dry-run mode.** There is no flag to print the intended
   transaction without committing it. Useful both for reviewing what the
   script will do and for CI sanity checks.
3. **No check that `DB_URL` points to a tenant-scoped dev DB.** A cheap
   safety net is to refuse to run unless `DB_URL` contains `localhost`,
   `127.0.0.1`, or an explicit opt-in env var like
   `RECONCILE_ALLOW_REMOTE=1`.
4. **No log of what the pre-reconcile state looked like.** If the script
   does run and turns out to have been a mistake, the operator has no
   record of the prior `checksum` values for the `032857` row it updated.

The script is a one-shot recovery tool so these gaps are low severity —
but precisely because it's a one-shot tool, the cost of making it safer
is nearly zero and the cost of getting it wrong (on the wrong DB) is
concrete.

### Sugestão de correção

Add three small pieces:

1. **Print the target DB URL host + db name** before the transaction:

   ```ts
   const dbUrl = new URL(process.env.DB_URL ?? '');
   console.log(`Target: ${dbUrl.hostname}:${dbUrl.port}${dbUrl.pathname}`);
   ```

2. **Remote guard** unless explicitly opted in:

   ```ts
   const isLocal = ['localhost', '127.0.0.1', '::1', 'louvorflow_db'].includes(dbUrl.hostname);
   if (!isLocal && process.env.RECONCILE_ALLOW_REMOTE !== '1') {
     console.error('Refusing to run against non-local DB. Set RECONCILE_ALLOW_REMOTE=1 to override.');
     process.exit(2);
   }
   ```

3. **Pre-state log**: before the UPDATE, log the existing `032857`
   checksum so the operator can reverse the change manually if needed.

Optionally add a `--dry-run` flag that runs the transaction inside a
`BEGIN ... ROLLBACK` wrapper and prints the SQL that would have been
committed.

## Triage

- Decision: `valid`
- Notes: Confirmed. The script has no DB target echo, no remote guard, and no pre-state logging. All three suggestions are low-cost and appropriate for a one-shot recovery tool. Implementing: (1) print target DB host+dbname, (2) remote guard unless `RECONCILE_ALLOW_REMOTE=1`, (3) pre-state log of existing checksum before UPDATE. Skipping `--dry-run` flag as optional and out of scope for a minimal fix.
