# Spec: TASK-7.23 — Harden the decision grader's inputs and edge-case tests

Status: READY (approved 2026-11-20)
Task: TASK-7.23 · Parent/epic: TASK-7 (Get trustworthy advice) · Requirements: REQ-038.3 (follow-up of TASK-7.4, doc-19) · Dream: limit-holdem-trainer

## 1. Summary
`gradeDecision` currently grades a hand-built recommendation with a NaN/Infinity/missing equity as Minor
with a `NaN` margin, which would serialise as `null` in a hand record. This task makes the grader throw
`RangeError` when a number the deciding rule reads is not finite, adds a -15-point wrong-way margin test
that kills the `Math.abs` mutant, and corrects a unit test whose name claims a float trap that is exact.

## 2. Scope
- In scope: a finiteness guard inside the two margin rules of `gradeDecision`; a new acceptance test file for
  the guard and the -15 margin; a rename-plus-added-assertion edit of one unlocked unit test.
- Not doing: no change to grades, rule ids, margins or labels for finite inputs; no guard on rules that read
  no number (`match`, `alternative`, `preflop-*`, `aggression-no-range`); no range check (e.g. 0..100) on
  finite values; no change to `gradeView`, `recommendPostflop`, `review.ts` or any UI; no edit to the locked
  `tests/advice/grade.acceptance.test.ts`; no assertion is deleted or loosened.
- Scope budget: files=3, lines=120

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | The guard checks only the fields the deciding rule reads, at the point that rule runs: `equityPct` and `requiredEquityPct` for `call-fold-margin`; `equityVsCallingRangePct` for `aggression-margin` only when it is neither `undefined` nor `null`. A non-finite field no rule reads (e.g. on a `match`) does not throw. | yes | AC#1 says "used by the deciding rule"; `null`/`undefined` calling-range equity is the legitimate `aggression-no-range` input (`src/advice/grade.ts:114`). Keeps every existing grade unchanged. | Validate every numeric field up front (would make Correct grades throw on irrelevant fields) |
| A-2 | Error message follows the existing RangeError style (`src/advice/grade.ts:93`, `src/advice/equity.ts:74`): `` `${field} must be a finite number, got ${String(value)}` `` with `field` one of `equityPct`, `requiredEquityPct`, `equityVsCallingRangePct`. `equityPct` is checked before `requiredEquityPct`. | yes | Developer-facing only; never shown in the UI (review.ts lets grader errors propagate, `src/table/review.ts:37`). | Generic "invalid recommendation" message |
| A-3 | The unit test at `tests/advice/grade.test.ts:163` keeps its 26.7-16.7 case (a valid exact-10 Major) but is renamed so it no longer calls it a float trap, and gains `expect(26.7 - 16.7).toBe(10)` beside the existing `expect(16.4 - 6.4).toBeLessThan(10)`, so each case's float claim is asserted. | yes | AC#3 asks the name and cases to claim only real traps; renaming plus adding an assertion loosens nothing. This file is not locked by any task (only `grade.acceptance.test.ts` is locked, `doit/TASK-7.4/state.json`). | Drop the 26.7 case (forbidden: deletes an assertion) |

## 3. Current system
- `src/advice/grade.ts:73-123` `gradeDecision`: `match`/`alternative` return first (`:86-87`), impossible pairs throw RangeError (`:88-94`), chart basis returns (`:96-100`), call-fold rule converts both percentages with `tenths` (`:102-111`), aggression rule returns `aggression-no-range` for `undefined`/`null` (`:113-116`) else measures `Math.abs(tenths(v) - 500)` (`:117`). `tenths(NaN)` is `NaN`, so `NaN >= 100` is false → Minor with `marginPts: NaN` (the bug).
- Real callers: the only production caller is `gradeView` (`src/advice/grade.ts:126-135`), used only by `reviewEntries` (`src/table/review.ts:45`); bots and session do not import the grader (`grep gradeDecision|gradeView src tools` → only these). `gradeView` passes `recommend(view)`: postflop values are `toPct(result.hero.equity)` and `owed > 0 ? toPct(callAmount / (pot + callAmount)) : 0` (`src/advice/postflop.ts:88-89`) — `callAmount > 0` whenever `owed > 0`, and hero equity is a win/tie fraction over > 0 trials, so both are finite; `equityVsCallingRangePct` is never set by any producer (`grep` → only `grade.ts:41`). Preflop recommendations are `basis: 'chart'` and never reach the guard. So no real decision can hit the new throw, and grades for real decisions are unchanged.
- Tests: Vitest; `tests/advice/grade.test.ts` (unit, unlocked) has the `-5` wrong-way case at `:133` and the misnamed float test at `:163-173`; `tests/advice/grade.acceptance.test.ts` is locked by TASK-7.4 and is not touched.
- Existing code to reuse:
  - `tests/advice/grade.test.ts:82-92` `equity(action, numbers)` fixture shape → copy the same small builder into the new test file (it is not exported).
  - `Number.isFinite` → the guard (it is false for `NaN`, `±Infinity` and `undefined`).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | New behaviour is tested in a new file `tests/advice/grade-hardening.acceptance.test.ts`; the only edit to an existing test is A-3 (rename + one added assertion, unlocked file). | Add cases to the locked acceptance file | Prefer new test files; never edit locked tests. | no | n/a |
| D-2 | Guard lives in a private helper `finitePct(field, value): number` in `grade.ts` that returns `value` or throws, called inside the two margin rules. | Validate at `gradeView` | `gradeDecision` is the exported entry the bug report targets. | no | n/a |

## 5. Design

### Files to create / modify
- `src/advice/grade.ts` — add `finitePct`, call it in the call-fold and aggression-margin rules; extend the `gradeDecision` doc comment to mention the non-finite RangeError.
- `tests/advice/grade-hardening.acceptance.test.ts` — new: SPEC-01..SPEC-04.
- `tests/advice/grade.test.ts` — A-3 rename + added assertion (SPEC-05).

### Components, interfaces and data
- `function finitePct(field: 'equityPct' | 'requiredEquityPct' | 'equityVsCallingRangePct', value: number | undefined): number` — returns `value` if `Number.isFinite(value)`, else throws `RangeError(`${field} must be a finite number, got ${String(value)}`)`.
- `gradeDecision` signature, return type and JSON shape are unchanged.

### Rules and algorithms
- Call-fold rule: `const equity = tenths(finitePct('equityPct', rec.equityPct)); const required = tenths(finitePct('requiredEquityPct', rec.requiredEquityPct));` then unchanged.
- Aggression rule: after the `undefined`/`null` early return, `const distance = Math.abs(tenths(finitePct('equityVsCallingRangePct', vsCallingRange)) - 500);` then unchanged.
- Worked examples: `{action:'call', equityPct: NaN, requiredEquityPct: 40}` + `fold` → RangeError `equityPct must be a finite number, got NaN`. `{action:'call', equityPct: NaN}` + `call` → Correct `match` (no rule reads it). `{action:'call', equityPct: 25, requiredEquityPct: 40}` + `fold` → Minor, `marginPts: -15`.

### Error handling and configuration
- RangeError only, message per A-2. No configuration.

## 6. Behaviour specification

### SPEC-01: Non-finite or missing call-fold inputs throw RangeError
- Verifies: AC#1
- Behaviour: Given an equity recommendation for each call-fold pairing (rec call/user fold, rec fold/user call, rec fold/user raise, rec raise/user fold) whose `equityPct` or `requiredEquityPct` is `NaN`, `Infinity`, `-Infinity` or missing (`undefined`, other field finite), When `gradeDecision` runs, Then it throws `RangeError` with message `<field> must be a finite number, got <String(value)>` (e.g. `requiredEquityPct must be a finite number, got Infinity`).
- Verification: acceptance `tests/advice/grade-hardening.acceptance.test.ts::non-finite call-fold equity throws RangeError`

### SPEC-02: Non-finite calling-range equity throws; absent calling-range equity still grades Minor
- Verifies: AC#1
- Behaviour: Given an aggression pairing (rec bet/user check, rec raise/user call, rec check/user bet, rec call/user raise), When `equityVsCallingRangePct` is `NaN`, `Infinity` or `-Infinity`, Then `gradeDecision` throws `RangeError` `equityVsCallingRangePct must be a finite number, got <value>`; When it is `undefined` or `null`, Then the result is `{ grade: 'minor', ruleId: 'aggression-no-range', marginPts: null }` as before.
- Verification: acceptance `tests/advice/grade-hardening.acceptance.test.ts::non-finite calling-range equity throws RangeError`

### SPEC-03: Numbers the deciding rule does not read are not checked
- Verifies: AC#1
- Behaviour: Given `equityPct: NaN, requiredEquityPct: NaN, equityVsCallingRangePct: NaN`, When the user action equals the recommended action or its alternative, Then the result is Correct (`match` / `alternative`); Given a finite call-fold pair with `equityVsCallingRangePct: NaN` and rec call/user fold at 50 vs 40, Then the result is `{ grade: 'major', ruleId: 'call-fold-margin', marginPts: 10 }`.
- Verification: acceptance `tests/advice/grade-hardening.acceptance.test.ts::unused non-finite numbers do not throw`

### SPEC-04: A -15-point wrong-way margin is Minor with marginPts -15
- Verifies: AC#2
- Behaviour: Given each of the four call-fold pairings with the user's action 15 points on the right side of the line (e.g. rec call, `equityPct: 25, requiredEquityPct: 40`, user fold; rec fold, `equityPct: 55, requiredEquityPct: 40`, user call), When graded, Then the result is `{ grade: 'minor', ruleId: 'call-fold-margin', marginPts: -15 }`.
- Verification: acceptance `tests/advice/grade-hardening.acceptance.test.ts::a -15 wrong-way margin is Minor`

### SPEC-05: The float-subtraction unit test only claims real float traps
- Verifies: AC#3
- Behaviour: Given `tests/advice/grade.test.ts`, When read, Then the test formerly named `one-decimal inputs are exactly 10 points apart despite float subtraction` is named `exactly 10 points is Major whether float subtraction is exact (26.7-16.7) or falls short (16.4-6.4)`, still asserts both Major/10 results and `16.4 - 6.4 < 10`, and additionally asserts `26.7 - 16.7 === 10`; no other assertion in the file changes.
- Verification: unit `tests/advice/grade.test.ts::exactly 10 points is Major whether float subtraction is exact (26.7-16.7) or falls short (16.4-6.4)`

### SPEC-06: Grades for real decisions are unchanged
- Verifies: AC#1
- Behaviour: Given the existing grader, review and session suites (including the locked `tests/advice/grade.acceptance.test.ts`, unchanged), When the full test suite runs, Then every test passes.
- Verification: command `npx vitest run tests/advice tests/table`

## 7. Edge cases
- Invalid input: NaN / ±Infinity / missing — SPEC-01, SPEC-02. `null` for `equityPct` is not representable through the type and behaves like missing via `Number.isFinite(null) === false` (covered by the same guard; not separately tested).
- Boundary: -15 margin — SPEC-04; 10/15 boundaries already locked in TASK-7.4 tests.
- Fields not read by the rule — SPEC-03.
- Concurrency, interruption, permissions, dependency failure: N/A — pure synchronous function.

## 8. Security considerations
No new trust boundary: inputs come from in-process recommenders. The guard prevents `NaN` margins from reaching
persisted hand records as `null`. No dependencies, secrets, logging or randomness involved.

## 9. Non-functional
Two `Number.isFinite` checks per graded deviation; no measurable cost. Full suite time unchanged.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: N/A — internal grader hardening; no user-facing change (review panel output is identical, covered by `tests/table/review*.test.ts`)
- New tests: `tests/advice/grade-hardening.acceptance.test.ts` → SPEC-01..SPEC-04; edited `tests/advice/grade.test.ts` → SPEC-05. Judge scenario: run `npx vitest run tests/advice/grade-hardening.acceptance.test.ts tests/advice/grade.test.ts tests/advice/grade.acceptance.test.ts tests/table`; confirm `git diff main -- tests/advice/grade.acceptance.test.ts` is empty and the `grade.test.ts` diff only renames one test and adds one assertion.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-7.23/qa.md`.
