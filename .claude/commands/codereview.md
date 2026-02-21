---
description: Automated pre-PR code review. Diffs current branch against main, analyzes all changed files, and produces a structured report with actionable findings.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). Valid inputs:

- Empty: full review of all changed files
- Focus area: `seguranca`, `performance`, `types`, `bugs`, `testes`
- File path or glob: review only matching changed files (e.g. `src/components/Quote*`)

## Goal

Perform a comprehensive, automated code review of all changes in the current branch compared to `main`. Produce a structured Markdown report with severity-rated findings, test coverage assessment, and a final grade. This replaces manual pre-PR review.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify, create, or delete any files. Do **not** run destructive commands. Do **not** run formatters, linters, or fixers. Output ONLY a structured analysis report in the conversation.

**No Code Rewrites**: Unlike a refactoring tool, this command identifies issues and suggests fixes in the report — it does NOT apply them.

## Execution Steps

### 1. Gather Git Context

Run these git commands to understand the branch state:

```bash
# Current branch name
git rev-parse --abbrev-ref HEAD

# Common ancestor with main
git merge-base main HEAD

# Files changed (names only)
git diff $(git merge-base main HEAD)...HEAD --name-only

# Change statistics
git diff $(git merge-base main HEAD)...HEAD --stat

# Commit log for this branch
git log $(git merge-base main HEAD)..HEAD --oneline --no-decorate
```

Capture and store:

- `BRANCH_NAME`: current branch
- `MERGE_BASE`: the ancestor commit hash
- `CHANGED_FILES`: list of changed file paths
- `DIFF_STAT`: insertions/deletions summary
- `COMMIT_LOG`: list of commits on this branch

If `CHANGED_FILES` is empty, output a short message: "No changes detected between this branch and main." and stop.

### 2. Filter and Classify Files

**Exclude** these files from analysis (still list them in the report header as "Excluded"):

- `**/package-lock.json`, `**/yarn.lock`, `**/pnpm-lock.yaml`
- `**/node_modules/**`
- `**/dist/**`, `**/build/**`, `**/.next/**`
- `**/*.min.js`, `**/*.min.css`
- Binary files (images, fonts, etc.)
- `**/.claude/**` (command files themselves)

**Classify** remaining files into categories:

| Category | Pattern | Review Rigor |
|----------|---------|--------------|
| `CODIGO` | `src/**/*.{ts,tsx}` excluding test files and UI lib | Full analysis |
| `UI_LIB` | `src/components/ui/**` (shadcn generated components) | Reduced rigor — only flag CRITICAL/HIGH issues |
| `TESTES` | `src/**/*.{test,spec}.{ts,tsx}`, `src/test/**` | Test quality analysis |
| `CONFIG` | `*.config.*`, `tsconfig*`, `.env*`, `package.json` | Config-specific checks only |
| `DOCS` | `*.md`, `*.txt` (excluding .claude/) | Skip analysis, note in header |
| `STYLES` | `**/*.css` | Minimal review |

If more than 15 files are classified as `CODIGO` or `TESTES`, prioritize files with the most changes (by diff stat lines changed). Note any deprioritized files in the report.

### 3. Load Context for Analysis

For each file, load the appropriate context:

- **CODIGO / TESTES**: Read the full git diff for the file AND the complete current file content. If the file imports local modules that were also changed, note the relationship.
- **UI_LIB**: Read only the git diff (not full file content).
- **CONFIG**: Read the git diff only.

Use the `Read` tool for file contents and `Bash` with `git diff` for diffs.

When a `CODIGO` file imports types or functions from other changed files, note these cross-file dependencies for coherence analysis.

### 4. Assess Test Coverage

Map production files to their test files using project conventions:

- `src/foo/Bar.tsx` → `src/test/Bar.test.tsx` or `src/foo/Bar.test.tsx` or `src/foo/__tests__/Bar.test.tsx`
- Check both exact matches and pattern-based matches

Classify each `CODIGO` file:

- **COM_TESTE**: A corresponding test file exists AND was updated in this branch
- **TESTE_DESATUALIZADO**: A test file exists but was NOT updated despite production code changes
- **SEM_TESTE**: No corresponding test file found

### 5. Zen Principles Analysis

Apply these 5 principles as analysis lenses to all `CODIGO` files (reduced rigor for `UI_LIB`):

#### 5.1 "Beautiful is better than ugly" & "Readability counts"

- Non-semantic variable/function names (single letters, abbreviations, misleading names)
- Inconsistent formatting within the changed code
- Magic numbers or strings without named constants
- Excessively long functions (>50 lines of logic)
- Missing or misleading JSDoc on exported functions

#### 5.2 "Explicit is better than implicit"

- Missing TypeScript types or using `any`
- Implicit return types on exported functions
- React component props without explicit interface/type
- `useEffect` with missing or incorrect dependency arrays
- Implicit boolean coercion that could mask bugs (e.g., `value && <Component />` where value could be `0`)

#### 5.3 "Simple is better than complex"

- Over-engineered abstractions for simple problems
- Unnecessary indirection (wrapper functions that just forward calls)
- Single Responsibility Principle violations (component doing too much)
- Custom hooks that could be replaced with simpler patterns
- Premature optimization without evidence of need

#### 5.4 "Flat is better than nested"

- Arrow code (>3 levels of nesting)
- Missing guard clauses (early returns)
- Deeply nested ternary operators in JSX
- Callback pyramids (nested `.then()` chains or nested callbacks)
- Complex conditional rendering that could be extracted

#### 5.5 "Errors should never pass silently"

- Empty `catch` blocks or catch with only `console.log`
- Unhandled Promise rejections
- Missing error boundaries for component trees
- API calls without error feedback to the user
- Silent fallbacks that hide bugs (e.g., `value ?? defaultValue` without logging)

### 6. Additional Detection Passes

#### 6.1 Bug Detection

- Potential null/undefined access without checks
- `useEffect` dependency array mismatches (missing deps or unnecessary deps)
- Race conditions in async operations (stale closure, unmounted component updates)
- Direct state mutation (modifying state objects/arrays without creating new references)
- Off-by-one errors in loops or array operations
- Incorrect equality checks (`==` instead of `===`)

#### 6.2 Security

- XSS vectors: `dangerouslySetInnerHTML`, unescaped user input in DOM
- Exposed secrets, API keys, tokens in code or config
- `eval()`, `new Function()`, or dynamic code execution
- Insecure data handling (sensitive data in localStorage without encryption)
- Missing input validation/sanitization at system boundaries

#### 6.3 Performance

- Unnecessary re-renders (missing `React.memo`, `useMemo`, `useCallback` where beneficial)
- Inline object/array/function creation in JSX props (new reference every render)
- Large components that should be split for code-splitting / lazy loading
- Expensive computations inside render without memoization
- Missing `key` props or using array index as `key` in dynamic lists

#### 6.4 Type Safety

- Usage of `any` type (explicit or implicit)
- Excessive type assertions (`as Type`) that bypass type checking
- Missing return types on exported functions
- Optional chaining chains longer than 3 levels (`a?.b?.c?.d?.e`)
- Missing discriminated union checks (switch without default/exhaustive check)

### 7. Assign Severities

Each finding gets one severity:

| Severity | Criteria | Action |
|----------|----------|--------|
| **CRITICO** | Security vulnerabilities, data loss risk, crashes in production, exposed secrets | Must fix before merge |
| **ALTO** | Bugs likely to manifest, missing error handling on user-facing flows, `any` on public API | Should fix before merge |
| **MEDIO** | Code smell, minor Zen violations, missing tests for new logic, performance concerns | Recommend fixing |
| **BAIXO** | Style preferences, minor readability improvements, suggestions for future improvement | Optional improvement |

### 8. Produce Structured Report

Output the following Markdown report directly in the conversation:

---

```
# Code Review: {BRANCH_NAME}
```

**Branch**: `{BRANCH_NAME}` → `main`
**Commits**: {number of commits}
**Files Changed**: {total} ({CODIGO}: {n}, UI_LIB: {n}, TESTES: {n}, CONFIG: {n}, Excluded: {n})
**Lines**: +{insertions} / -{deletions}

If `$ARGUMENTS` specified a focus area, note: **Focus**: {focus area}

---

### Findings Table

| # | Severity | Category | File | Line(s) | Finding | Suggested Action |
|---|----------|----------|------|---------|---------|-----------------|
| 1 | CRITICO | Security | src/api/client.ts | 23 | API key hardcoded | Move to environment variable |
| 2 | ALTO | Bug | src/hooks/useQuote.ts | 45-48 | Missing useEffect dep | Add `quoteId` to dependency array |
| ... | | | | | | |

Order by: CRITICO first, then ALTO, MEDIO, BAIXO. Within same severity, group by file.

If more than 50 findings, show top 50 and add: "_{n} additional BAIXO findings omitted. Run with specific file path to see all._"

---

### Zen Principles Summary

| Principle | Violations | Worst Severity | Key Example |
|-----------|-----------|----------------|-------------|
| Readability | {n} | ALTO | `src/components/Quote.tsx:34` - magic number |
| Explicit > Implicit | {n} | MEDIO | Missing prop types |
| Simple > Complex | {n} | BAIXO | Over-abstracted hook |
| Flat > Nested | {n} | MEDIO | 4-level ternary |
| Error Handling | {n} | ALTO | Empty catch block |

---

### Bug / Security / Performance / Types Summary

| Category | Findings | CRITICO | ALTO | MEDIO | BAIXO |
|----------|---------|---------|------|-------|-------|
| Bugs | {n} | {n} | {n} | {n} | {n} |
| Security | {n} | {n} | {n} | {n} | {n} |
| Performance | {n} | {n} | {n} | {n} | {n} |
| Type Safety | {n} | {n} | {n} | {n} | {n} |

---

### Test Coverage

| Production File | Test Status | Test File | Notes |
|----------------|------------|-----------|-------|
| src/components/Quote.tsx | COM_TESTE | src/test/Quote.test.tsx | Updated in this branch |
| src/hooks/useCalc.ts | SEM_TESTE | — | New file, needs tests |
| src/utils/format.ts | TESTE_DESATUALIZADO | src/test/format.test.tsx | Test not updated |

**Coverage of changed files**: {n}/{total} files have up-to-date tests ({percentage}%)

---

### Overall Grade

Rate each criterion A through F:

| Criterion | Grade | Rationale |
|-----------|-------|-----------|
| Code Quality (Zen) | | |
| Type Safety | | |
| Error Handling | | |
| Security | | |
| Performance | | |
| Test Coverage | | |
| **Overall** | **{grade}** | |

Grading scale:

- **A**: No CRITICO/ALTO findings; at most minor MEDIO/BAIXO items
- **B**: No CRITICO; few ALTO findings that are straightforward to fix
- **C**: No CRITICO; multiple ALTO findings or systemic MEDIO patterns
- **D**: Has CRITICO findings or pervasive ALTO issues
- **F**: Multiple CRITICO findings, security vulnerabilities, or fundamentally broken code

---

### Recommended Actions

**Must Fix (CRITICO)**:

- List each critical finding with file:line and concrete fix instruction

**Should Fix (ALTO)**:

- List each high finding with file:line and suggested approach

**Consider Fixing (MEDIO/BAIXO)**:

- Brief summary of improvements, grouped by theme

---

### 9. Handle Special Cases

- **Zero findings**: Output a congratulatory report. Grade A across all criteria. Still show the header, test coverage table, and grade table.
- **$ARGUMENTS matches a focus area**: Only run the matching detection passes from steps 5-6. Still show full report structure but mark non-analyzed sections as "Not analyzed (focused review on {area})".
- **$ARGUMENTS matches a file path/glob**: Only analyze matching files from the changed files list. Show only those files in the report.
- **UI_LIB files**: Apply only CRITICO and ALTO severity checks. Note in findings: "(UI_LIB - reduced rigor)".
- **More than 50 findings**: Truncate the findings table at 50 rows. Add overflow count. Recommend running focused reviews per file.

## Operating Principles

### Context Efficiency

- **Load diffs before full files**: Only read complete file content when the diff suggests deeper analysis is needed
- **Prioritize by change size**: Files with more changes get more thorough analysis
- **Cap analysis scope**: Maximum 15 full file reads to avoid context exhaustion
- **Be specific**: Every finding must reference a specific file and line number from the actual diff

### Analysis Integrity

- **NEVER modify files** — this is strictly read-only analysis
- **NEVER hallucinate line numbers** — only reference lines you actually read from the diff or file
- **NEVER invent findings** — if the code is clean, say so
- **Be fair to generated code** — UI_LIB (shadcn) files get reduced scrutiny
- **Acknowledge context limits** — if you couldn't fully analyze a file, say so in the report
- **Ground findings in evidence** — quote the problematic code snippet in the finding description when helpful
