---
id: doc-55
title: 'TASK-7.23: Harden the decision grader''s inputs and edge-case tests'
type: other
created_date: '2026-11-21T03:35:00Z'
updated_date: '2026-11-21T03:35:00Z'
---
# TASK-7.23: Harden the decision grader's inputs and edge-case tests

Status: Done · Completed: 2026-11-20 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: REQ-038.3 · Branch: doit/TASK-7.23

## What was asked
`gradeDecision` graded a hand-built recommendation with a NaN/Infinity/missing equity as Minor with a `NaN` margin, which would serialise as `null` in a hand record. Make it throw instead, add a -15-point wrong-way margin test (kills the `Math.abs` mutant), and fix a unit test whose name claims a float trap that is actually exact. Spec: doit/TASK-7.23/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Guard checks only the fields the deciding rule reads: `equityPct` and `requiredEquityPct` for `call-fold-margin`; `equityVsCallingRangePct` for `aggression-margin` unless `undefined`/`null`. Non-finite unread fields (e.g. on a `match`) do not throw. | yes | AC says "used by the deciding rule"; `null`/`undefined` is the legitimate `aggression-no-range` input. Existing grades unchanged. | Validate all numeric fields up front in `gradeDecision` |
| A-2 | Message style: `<field> must be a finite number, got <value>`; `equityPct` checked before `requiredEquityPct`. | yes | Matches existing RangeError style; developer-facing only. | Change `finitePct` message |
| A-3 | The float unit test keeps its 26.7-16.7 case, is renamed to `exactly 10 points is Major whether float subtraction is exact (26.7-16.7) or falls short (16.4-6.4)`, and gains `expect(26.7 - 16.7).toBe(10)`. | yes | Names only real traps; nothing deleted or loosened. File not locked. | Revert the test edit |

## Clarifications and decisions
No questions asked. D-1: new tests in a new file, not the locked `grade.acceptance.test.ts`. D-2: guard is a private helper `finitePct` in `grade.ts`, called inside the two margin rules.

## What was built
- `src/advice/grade.ts` — private `finitePct(field, value)` returns the value or throws `RangeError`; used in the call-fold rule and the aggression-margin rule (after the undefined/null early return). Doc comment updated. Signature and result shape unchanged.
- `tests/advice/grade-hardening.acceptance.test.ts` (new) — SPEC-01..04.
- `tests/advice/grade.test.ts` — rename plus one added assertion (SPEC-05).
- No real caller can hit the throw: the only production caller is `gradeView`, whose postflop values are always finite, and preflop recommendations never reach the guard.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 call-fold non-finite/missing throws | AC#1 | acceptance test | Pass | gates/build-1.json |
| SPEC-02 calling-range non-finite throws; null/undefined stays `aggression-no-range` | AC#1 | acceptance test | Pass | gates/build-1.json |
| SPEC-03 unread numbers not checked | AC#1 | acceptance test (match case also asserts grade `correct`, judge J-1-01) | Pass | judge/round-1.json |
| SPEC-04 -15 margin is Minor | AC#2 | acceptance test | Pass | gates/build-1.json |
| SPEC-05 float test claims only real traps | AC#3 | unit test | Pass | gates/build-1.json |
| SPEC-06 real-decision grades unchanged | AC#1 | full suite | Pass | gates/fix-3.json: 382 passed, 6 skipped |

- Gates: build-1 PASS, fix-2 PASS, fix-3 FAIL on lint only (Prettier formatting of the acceptance test after the J-1-01 edit); tests, typecheck, scope and test-integrity passed. Prettier was re-run afterwards and passes.
- Judge round 1: PASS 6/6, one LOW finding J-1-01 (assert grade `correct` in the all-NaN match case), applied in-story by the orchestrator (test unlocked and re-locked, logged in state.json history). The judge's holdout also confirmed the `equityPct`-before-`requiredEquityPct` order.

## Review
No blocking findings (round 1: code and security).

### Non-blocking review notes (deliberately not fixed)
- MINOR: `toThrow(new RangeError(...))` might check only the message. Disproven by the judge: vitest 5.1.0 also checks the class (Error/TypeError mutants fail).
- NIT: match-case grade not asserted — fixed by J-1-01.
- NIT: builder's tests do not exercise the `equityPct`-before-`requiredEquityPct` order; the judge's holdout did. Not tracked.

## How to try it
`npx vitest run tests/advice/grade-hardening.acceptance.test.ts tests/advice/grade.test.ts tests/advice/grade.acceptance.test.ts tests/table`

## Run metrics
Questions 0 · assumptions logged 3 (in spec) · review rounds 1 · judge rounds 1 · gate runs 3 · escalations 0 · changed lines 111 (3 files).

## Known limitations and follow-ups
- No range check (0..100) on finite values and no guard on rules that read no number, by design.
- No follow-ups.

## Lessons for the factory (proposals — not applied)
- Applying a judge LOW to a locked test left a Prettier failure in gate fix-3. Run `npm run format` after any unlock-and-edit of a test file before re-gating.
