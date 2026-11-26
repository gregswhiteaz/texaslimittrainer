# Spec: TASK-10.16 — Pin the Hints used tile wording in e2e and reject hints without errors

Status: READY (approved 2026-11-26)
Task: TASK-10.16 · Parent/epic: TASK-10 · Requirements: REQ-044.3, REQ-040.4 (via TASK-10.7) · Dream: limit-holdem-trainer

## 1. Summary
Two follow-ups from the TASK-10.7 review/judge (doc-132). The e2e Hints used check gets its expected tile text from
`hintTile` itself, so a wording regression in `hintTile` would still pass. It will build the expected text from the
stored counts with the literal wording `N of M decisions (P%)` instead. Also, `parseSessionReport` currently accepts
a stored report that has `hints` but no `errors`. That report shows no tile, because the tile sits inside the
`errors`-gated "Volume and errors" list. The app never writes that combination. It will now be rejected with
`RangeError('Invalid session report: hints')`.

## 2. Scope
- In scope:
  - `e2e/report-hints.spec.ts`: the tile assertion uses a test-local expected string built from `stored.hints`.
    The `hintTile` import is removed.
  - `parseSessionReport` (`src/table/session-report.ts`) rejects `hints` present with `errors` absent.
  - One new unit test for the rejection, in `tests/table/session-report-hints.test.ts`.
- Not doing:
  - No change to `hintTile`, its wording, rounding or the `ReportScreen` markup.
  - No other cross-field presence rules (for example `leakCounts` iff `errors`, or `errors` without `hints`).
    Reports stored before TASK-10.7 have `errors` without `hints` and must stay valid.
  - No change to `sessionReport` (the writer), the DB schema or stored data. No migration.
  - No change to any other locked test.
- Scope budget: files=3, lines=45

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The e2e expected string uses the singular noun `decision` when M = 1, matching the shipped wording (`tests/table/session-report-hints.test.ts:107`, `1 of 1 decision (100.0%)`). Otherwise it uses the literal `decisions`. | yes | The pinned-seed session's decision count is not asserted anywhere. A bare plural would fail if it were 1, and the singular form is shipped TASK-10.7 wording (D-2). | Plural only, plus an assertion that M ≥ 2 |
| A-2 | The e2e computes P with its own integer arithmetic (round half up to tenths), not with `bbPer100` from `src`. | yes | The point of AC#1 is to stop the expected text depending on app formatting code. `hinted ≥ 1` (already asserted) guarantees M ≥ 1, so there is no division by zero. | Import `bbPer100` |
| A-3 | The hints/errors check runs before `parseHints`. A report with `hints` (well-formed or not) and no `errors` fails with field `hints`. | yes | "Naming hints" (AC#2). The field name is the same either way. | Validate the shape first, then presence |

## 3. Current system
- `src/table/session-report.ts:206-207`: `sessionReport` builds `errors`, `leakCounts` and `hints` together, and
  only when every hand carries `decisions`. Otherwise it returns before any of them (`:192`). So `hints` without
  `errors` is never produced, even for a session with zero graded decisions, which gets `errors {0,0}` and
  `hints {0,0}`.
- `src/storage/hand-store.ts:143`: the only writer of the `reports` store calls `sessionReport`. No other code path
  writes reports (grep for `REPORTS_STORE` and `sessionReport(` under `src`). Rejecting the combination therefore
  cannot lose a report the app wrote. Only hand-edited or corrupted data is affected.
- `src/storage/hand-store.ts:274-276`: `getReport` returns `parseSessionReport(value)`, so a rejected report
  surfaces as a RangeError, the same as every other invalid field.
- `src/table/session-report.ts:271-275`: `parseHints`. `:278-309`: `parseSessionReport` (`:308` validates hints
  only when present). `:142`: `invalid(field)` gives `RangeError('Invalid session report: <field>')`.
- `src/table/session-report.ts:358-365`: `hintTile` wording `${hinted} of ${decisions} ${noun} (${pct}%)`, where
  pct is rounded half up to one decimal via `bbPer100(hinted, 1, decisions)`.
- `src/ui/report/ReportScreen.tsx:104-117`: the hint tile renders inside `rates.length > 0`, and `rateTiles` is `[]`
  without `errors` (`session-report.ts:348-349`). That is why the combination shows no tile.
- `e2e/report-hints.spec.ts:4,59`: imports `hintTile` and asserts `toHaveText(hintTile(stored)?.value ?? '')`.
- Locked tests: `e2e/report-hints.spec.ts` is locked by TASK-10.7 (`doit/TASK-10.7/state.json`, sha `d45dd2e7…`).
  It must change for AC#1. Its owner is TASK-10.7. Every existing assertion stays. Only the expected value's
  source changes, and the unused import goes. `tests/table/session-report-hints.test.ts` is not locked.
- Tests: Vitest (`npm test`), Playwright (`npm run e2e`). Existing fixture `BASE` in
  `tests/table/session-report-hints.test.ts:57-67` has `errors`, so all existing hints parse cases still throw their
  current field names.
- Existing code to reuse:
  - `tests/table/session-report-hints.test.ts` → `BASE` fixture and the JSON round-trip pattern of
    `'parseSessionReport validates hints'`.
  - `src/table/session-report.ts` → `invalid()` for the error.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Reject `hints` without `errors` rather than also checking the reverse. | Enforce `hints` iff `errors` | The reverse would invalidate real reports stored before TASK-10.7 (write-once, REQ-052.5; TASK-10.7 A-5). | no | n/a |
| D-2 | Edit the TASK-10.7-locked `e2e/report-hints.spec.ts` under its owner, with no assertion dropped. | New e2e file | AC#1 targets this very check, and a duplicate e2e would add CI time. | no | n/a |

## 5. Design

### Files to create / modify
- `src/table/session-report.ts` — in `parseSessionReport`, reject `hints` present with `errors` absent. Update
  the doc comment.
- `e2e/report-hints.spec.ts` — pin the tile wording from the stored counts and drop the `hintTile` import.
- `tests/table/session-report-hints.test.ts` — new unit test for the rejection.

### Components, interfaces and data
- `parseSessionReport(value: unknown): SessionReport`. The signature is unchanged. New rule: if `report.hints !==
  undefined && report.errors === undefined`, throw `RangeError('Invalid session report: hints')`. It sits in the
  same place as the current `:308` check (after the `style`, `errors` and `leakCounts` checks), before `parseHints`.
- e2e expected string (test-local):
  ```ts
  const { hinted, decisions } = hints;
  const tenths = Math.floor((2000 * hinted + decisions) / (2 * decisions));
  const expected = `${hinted} of ${decisions} ${decisions === 1 ? 'decision' : 'decisions'} (${Math.floor(tenths / 10)}.${tenths % 10}%)`;
  await expect(tile.locator('dd')).toHaveText(expected);
  ```

### Rules and algorithms
- Percentage: tenths = floor((2000·h + d) / (2·d)), which rounds 1000·h/d half up. Examples: h=1, d=16 →
  floor(2016/32)=63 → `6.3`. h=2, d=3 → floor(4003/6)=667 → `66.7`. h=4, d=4 → 1000 → `100.0`.

### Error handling and configuration
- `RangeError('Invalid session report: hints')`. No new configuration.

## 6. Behaviour specification

### SPEC-01: e2e pins the Hints used wording from stored counts
- Verifies: AC#1
- Behaviour: Given the pinned-seed session in `e2e/report-hints.spec.ts` where the user opens a hint in hand 1 and
  then leaves the table, When the test compares the "Hints used" tile's `dd`, Then the expected text is
  `` `${hinted} of ${decisions} ${decisions === 1 ? 'decision' : 'decisions'} (${P}%)` ``. Here P is computed in
  the test from `stored.hints` with the integer formula in §5. The file no longer imports or calls `hintTile`, and
  every other existing assertion is kept.
- Verification: acceptance `e2e/report-hints.spec.ts::Leave table shows how many decisions used a hint`

### SPEC-02: a stored report with hints but no errors is rejected
- Verifies: AC#2
- Behaviour: Given `BASE` without `errors` plus `hints: { hinted: 1, decisions: 2 }`, JSON round-tripped, When
  `parseSessionReport` reads it, Then it throws `new RangeError('Invalid session report: hints')`. The same happens
  with `hints: { hinted: 0, decisions: 0 }`. `BASE` without `errors` and without `hints` still parses and equals
  itself (a pre-TASK-10.4 report). `BASE` (with `errors`, no `hints`) still parses (a pre-TASK-10.7 report).
- Verification: unit `tests/table/session-report-hints.test.ts::parseSessionReport rejects hints without errors`

## 7. Edge cases
- Zero decisions (`hints {0,0}`) with no errors: rejected (SPEC-02).
- Old reports with `errors` but no `hints`, or with neither: still valid (SPEC-02).
- Malformed `hints` with no errors: fails with field `hints` (A-3). It is the same field, so SPEC-02 covers it.
- M = 1 in e2e: singular noun (A-1).
- Concurrency, permissions, dependency failure: N/A, because this is a pure validation function plus a test.

## 8. Security considerations
- Trust boundary: stored IndexedDB values read via `getReport`. This change tightens validation there. No new
  dependencies, secrets, logging or randomness.

## 9. Non-functional
- N/A. One constant-time check, and the e2e runtime is unchanged.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npm run e2e -- e2e/report-hints.spec.ts`
- New tests (path → SPEC ids):
  - `e2e/report-hints.spec.ts` (modified, locked by TASK-10.7) → SPEC-01
  - `tests/table/session-report-hints.test.ts` (new `it`) → SPEC-02
- Judge scenario: run `npm run e2e -- e2e/report-hints.spec.ts` and confirm it passes. Temporarily change the
  `hintTile` wording (for example `of` → `/`) and confirm the e2e fails, then revert. Run
  `npx vitest run tests/table/session-report-hints.test.ts` and confirm the new rejection test passes.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-10.16/qa.md`.
