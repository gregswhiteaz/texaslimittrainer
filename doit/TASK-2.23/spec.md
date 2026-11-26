# Spec: TASK-2.23 — Tidy the end-session hardening tests

Status: READY (approved 2026-11-26)
Task: TASK-2.23 · Parent/epic: TASK-2 · Requirements: n/a (follow-up from TASK-2.21 review, doc-147) · Dream: limit-holdem-trainer

## 1. Summary
Two test-only tidies from the TASK-2.21 review (doc-147). Each case in the "already-ended" unit test calls
`endSession` twice (once per matcher), so the two matchers check two different calls; it must call once and
assert both `DOMException` and the `ConstraintError` name on that one rejection. The hardening e2e reads the
new session's id with `started?.sessionId as string`; the cast must become an asserted, narrowed value. No
production code changes and every existing assertion is kept.

## 2. Scope
- In scope:
  - `tests/storage/end-recheck.acceptance.test.ts`, test `an already-ended session is not ended again`: per
    case, one `endSession` call whose promise is asserted with both `.rejects.toBeInstanceOf(DOMException)`
    and `.rejects.toMatchObject({ name: 'ConstraintError' })` (D-1); the label stays on both matchers; the
    after-checks (sessions JSON, `endedAt`, reports JSON) are unchanged.
  - `e2e/end-session-hardening.spec.ts`, test `the Table opens only after the paused session is ended`:
    replace `const id = started?.sessionId as string;` with an assertion that fails the test unless the
    value is a string, then use the narrowed value (D-2).
- Not doing:
  - No change to `src/` or docs.
  - No change to the second unit test (`endPausedSessions rejects …`) — it already calls once (A-1).
  - No change to the first e2e test, to helpers, test names, or any other assertion.
  - No edit to TASK-2.7's locked `e2e/new-game-confirm.spec.ts` (its SPEC-08 stays as is; the stronger check
    already lives in `e2e/end-session-hardening.spec.ts`).
  - No other locked file is touched; only the two files unlocked for this task in `qa.md`.
- Scope budget: files=2, lines=20

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Each case" in AC#1 means the three cases of `an already-ended session is not ended again` (the only test that calls `endSession` twice); the `endPausedSessions` test is left alone. | yes | Only lines 97-104 call `endSession` twice; the second test calls `endPausedSessions` once (line 120). | Also add a `DOMException` matcher to the second test (extra strengthening, outside the AC). |
| A-2 | The non-null assertion for AC#2 is a type guard that throws (`if (typeof id !== 'string') throw new Error(...)`), not a `!` or another cast. | yes | `storedSessions` returns `Record<string, unknown>[]` (`e2e/support/hand-records.ts:125`), so `sessionId` is `unknown`; only a runtime guard both asserts and narrows. Same idiom as `e2e/cards.spec.ts:194`. | `expect(id).toEqual(expect.any(String))` followed by a guard (redundant). |

## 3. Current system
- `tests/storage/end-recheck.acceptance.test.ts:91-110`: loop over 3 cases; lines 97-100 call
  `openHandStore(factory).endSession(value.sessionId, NOW)` and assert `.rejects.toMatchObject({ name:
  'ConstraintError' })`; lines 101-104 call it again and assert `.rejects.toBeInstanceOf(DOMException)`.
  Lines 106-109 check the stores are unchanged after both calls.
- `tests/storage/end-recheck.acceptance.test.ts:120-122`: `endPausedSessions` called once (out of scope).
- `e2e/end-session-hardening.spec.ts:142-143`: `const [started] = await fresh(); const id =
  started?.sessionId as string;` — `id` is then used at lines 148 and 152.
- `e2e/support/hand-records.ts:125-126`: `storedSessions` returns `Promise<Record<string, unknown>[]>`.
- Both files are owned/locked by TASK-2.21 and unlocked for this task (`doit/TASK-2.23/qa.md`).
- Tests: `npm test` (vitest, includes `*.acceptance.test.*`), `npx playwright test` (chromium + webkit,
  `playwright.config.ts:13-16`), `npm run lint` (eslint + prettier check), `npm run typecheck` (tsc).
- Existing code to reuse:
  - `e2e/cards.spec.ts:194` → `if (!x) throw new Error('…')` guard idiom for narrowing in e2e.
  - Vitest `expect(promise).rejects` → a promise can be awaited by several matchers; store it once.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | `const result = openHandStore(factory).endSession(value.sessionId, NOW);` then `await expect(result, label).rejects.toBeInstanceOf(DOMException);` and `await expect(result, label).rejects.toMatchObject({ name: 'ConstraintError' });` | Catch into a variable (`.then(() => null, (e: unknown) => e)`) and assert synchronously. | Smallest diff; keeps both original matchers verbatim; a settled promise can be awaited twice, so one call feeds both. | no | n/a |
| D-2 | `const id = started?.sessionId; if (typeof id !== 'string') throw new Error('no new session id');` | `as string` (current), `!` (does not narrow `unknown`). | Fails the test with a clear message if no session was found and gives `id` type `string` without a cast. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/storage/end-recheck.acceptance.test.ts` — one `endSession` call per case, both matchers on it (D-1).
- `e2e/end-session-hardening.spec.ts` — guard replaces the `as string` cast (D-2).

### Components, interfaces and data
- No production interfaces change.

### Rules and algorithms
- AC#1 after the change: in the file, `endSession(` appears exactly once; `toBeInstanceOf(DOMException)`
  appears once and `name: 'ConstraintError'` twice (once in each test), so no matcher is lost.
- AC#2 after the change: `e2e/end-session-hardening.spec.ts` contains no ` as string` and no
  `sessionId as`.

### Error handling and configuration
- If no fresh session is found, the e2e fails with `Error: no new session id` (previously it would pass
  `undefined` on and fail later at a poll timeout).

## 6. Behaviour specification

### SPEC-01: Each already-ended case ends once and checks both the type and the name
- Verifies: AC#1
- Behaviour: Given each of the three ended-session cases (`no report`, `0 hands`, `with report`), When the
  test runs, Then `endSession(value.sessionId, NOW)` is called exactly once for that case, its rejection is
  asserted to be an instance of `DOMException` and to have `name: 'ConstraintError'` (both labelled), and the
  sessions JSON, `endedAt` of `2026-11-22T09:00:00.000Z` and reports JSON are still asserted unchanged.
- Verification: acceptance `tests/storage/end-recheck.acceptance.test.ts::an already-ended session is not ended again`

### SPEC-02: No unit check is lost and endSession is called once in the source
- Verifies: AC#1
- Behaviour: Given the edited unit file, When counted, Then `endSession(` occurs 1 time,
  `toBeInstanceOf(DOMException)` 1 time, `name: 'ConstraintError'` 2 times, and `toBe(ENDED_AT)` 2 times.
- Verification: command `grep -c "endSession(" tests/storage/end-recheck.acceptance.test.ts` → 1; `grep -c "toBeInstanceOf(DOMException)" tests/storage/end-recheck.acceptance.test.ts` → 1; `grep -c "name: 'ConstraintError'" tests/storage/end-recheck.acceptance.test.ts` → 2; `grep -c "toBe(ENDED_AT)" tests/storage/end-recheck.acceptance.test.ts` → 2

### SPEC-03: The hardening e2e uses an asserted session id, not a cast
- Verifies: AC#2
- Behaviour: Given the hardening e2e, When read, Then the new session's id is taken from
  `started?.sessionId`, a guard throws `no new session id` unless it is a string, and no `as string` cast
  remains; When run, Then the test still passes in chromium and webkit with all its other assertions intact.
- Verification: acceptance `e2e/end-session-hardening.spec.ts::the Table opens only after the paused session is ended` plus command `grep -c " as string" e2e/end-session-hardening.spec.ts` → 0

### SPEC-04: Gates stay green
- Verifies: AC#1, AC#2
- Behaviour: Given the change, When the gates run, Then vitest, lint, typecheck and both e2e tests in the
  hardening file pass on both Playwright projects.
- Verification: command `npm test && npm run lint && npm run typecheck && npx playwright test e2e/end-session-hardening.spec.ts`

## 7. Edge cases
- `endSession` resolving instead of rejecting: both `.rejects` matchers fail (unchanged behaviour of the test).
- No fresh session found in the e2e: guard throws a clear error (SPEC-03).
- Other edge cases (input, concurrency, permissions): N/A — test-only change.

## 8. Security considerations
N/A — test-only edits; no new input, dependencies, secrets or randomness.

## 9. Non-functional
- Unit file does one fewer `endSession` per case (slightly faster); e2e runtime unchanged.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — test-only change; run `npx vitest run tests/storage/end-recheck.acceptance.test.ts` and `npx playwright test e2e/end-session-hardening.spec.ts`
- New tests: none; edited `tests/storage/end-recheck.acceptance.test.ts` → SPEC-01, SPEC-02;
  `e2e/end-session-hardening.spec.ts` → SPEC-03.
- Judge scenario: run the two commands above (both green), then the greps in SPEC-02/SPEC-03, and diff both
  files against `main` to confirm only the described lines changed and no assertion was removed.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-2.23/qa.md`.
