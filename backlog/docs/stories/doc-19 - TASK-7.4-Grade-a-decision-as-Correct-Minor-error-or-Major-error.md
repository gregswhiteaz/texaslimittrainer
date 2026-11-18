---
id: doc-19
title: 'TASK-7.4: Grade a decision as Correct, Minor error or Major error'
type: other
created_date: '2026-11-18T20:00:00Z'
updated_date: '2026-11-18T20:00:00Z'
---
# TASK-7.4: Grade a decision as Correct, Minor error or Major error

Status: Built, Judge and CI pending · Completed: 2026-11-18 (build and review) · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: REQ-038.1–REQ-038.6, REQ-025.2, REQ-025.3 · Branch: doit/TASK-7.4

## What was asked
Add the grader that compares what the player did with what the advice said and returns Correct, Minor error or Major error by the REQ-038 rules. It must depend only on what the player could see at the decision point (a later card that makes a bad call win must not change the grade). Spec: doit/TASK-7.4/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Module `src/advice/grade.ts`; tests `grade.acceptance.test.ts` (locked) and `grade.test.ts` in `tests/advice/`. | yes | Same one-module-per-concern layout as `preflop.ts` and `postflop.ts`. | Move the file; update imports. |
| A-2 | Actions are compared by type only (fold, check, call, bet, raise). | yes | Fixed limit: each type has exactly one legal amount, so the type is the whole decision. | Compare full `Action` objects. |
| A-3 | Margins are computed in integer tenths of a point: `t(x) = Math.round(x * 10)`. A call/fold margin of 100 tenths or more is Major; a calling-range distance of 150 tenths or more is Major. | yes | Matches the TASK-7.3 decision that rules compare the rounded numbers the player sees. NOTE: the spec's example "26.7 − 16.7 is not exactly 10" is factually wrong (it is exactly 10 in floats). The rule is unaffected; the tests use 16.4 − 6.4 (9.999999999999998) and similar, which are real float traps. | Use raw float subtraction with an epsilon. |
| A-4 | If the margin points the wrong way for the recommendation (the advice says call but equity is below required, and the user folds), the grade is Minor. Only 10 or more points against the user's action is Major. | yes | The grader trusts the recommendation; close calls are never Major (REQ-038.5), and a negative margin is closer than any close call. | Throw on an inconsistent recommendation. |
| A-5 | Pairings that can never both be legal at one decision (check–fold, check–call, bet–fold, bet–call, bet–raise, either way round) throw `RangeError`. | yes | The engine never offers them together, so this is a caller bug; in particular "fold when a check was free" cannot occur. | Grade them Major or Minor. |
| A-6 | `gradeView` throws `RangeError` when the user's action is not legal in the view; errors from `recommend` propagate. | yes | Same convention as `recommendPreflop` and `recommendPostflop`. | Return an error grade. |
| A-7 | `marginPts` is the signed margin the deciding rule measured, one decimal; `null` for Correct and for preflop grades. | yes | Lets Review show the number behind the grade without recomputing. | Omit it, or always non-negative. |

## Clarifications and decisions
- Q-1, result shape and entry points. User approved the recommended shape: `GradeResult<R> { grade: 'correct'|'minor'|'major', ruleId, userAction, marginPts: number|null, recommendation: R }`. Stable codes in `grade`, display labels in `GRADE_LABELS` (Correct / Minor error / Major error), plain JSON, and two exports: pure `gradeDecision(recommendation, userAction)` and `gradeView(view, userAction, options?)`. Rule IDs: match, alternative, preflop-borderline, preflop-chart, call-fold-margin, aggression-margin, aggression-no-range.
- Q-2, bet or raise against a check/call recommendation before the calling-range number exists. User chose: grade Minor error with rule `aggression-no-range` and `marginPts: null`, until TASK-7.8 supplies `equityVsCallingRangePct`. Until then, every real postflop bet-versus-check or raise-versus-call deviation gets this grade.
- D-3 (no ask): preflop deviations grade by the chart's borderline flag only, since preflop recommendations carry no equity.
- D-4 (no ask): the 15-point calling-range distance is absolute, in either direction from 50%.
- D-5: margins use the rounded numbers the player sees (A-3).

## How the grading works (plain English)
Rules are tried in order; the first that applies decides.

| Situation | Grade | Example |
|---|---|---|
| You did the recommended action | Correct | Advice: raise. You raise. |
| You did the acceptable alternative | Correct | Chart cell says raise, alternative call. You call. |
| Preflop, you deviated, chart cell is borderline | Minor | Cell is a borderline raise (K9s UTG). You fold. |
| Preflop, you deviated, chart cell is not borderline | Major | Cell is a clear fold (72o). You raise. |
| Postflop, fold versus call/raise: you went against the advice and your equity was within 10 points of what the call needed | Minor | Advice: call, equity 26.6% vs 16.7% needed. You fold (9.9 points). |
| Same, but the gap is 10 points or more | Major | Equity 26.7% vs 16.7%. You fold (10.0 points). |
| Raise when advice said fold, or call when advice said fold: same 10-point rule | Minor under 10, Major at 10+ | Advice: fold, equity 6.8% vs 16.7%. You raise: Minor (9.9). At 6.7%: Major. |
| Postflop, bet/raise versus check/call: equity against the range that would call is within 15 points of 50% | Minor | Advice: bet. You check; equity vs calling range is 64.9% (14.9 away). |
| Same, 15 or more points from 50% | Major | 65.0% (or 35.0% when you bet but advice said check). |
| Bet/raise versus check/call but no calling-range number available (all real advice until TASK-7.8) | Minor | Advice: check. You bet. |
| Margin points the wrong way (advice inconsistent with its own numbers) | Minor | Advice: call, equity below required, you fold. |

The result of a hand (the river card) is never an input. Impossible combinations (such as folding when a check was free) raise an error rather than getting a grade.

## What was built
- `src/advice/grade.ts` (135 lines) — types, `GRADE_LABELS`, `GRADE_RULE_IDS`, `gradeDecision` (pure, O(1), tenths arithmetic), `gradeView` (checks the action is legal, makes one `recommend` call, then grades). Input types are structural, so today's `PreflopRecommendation` and `PostflopRecommendation` and test fixtures all fit. The recommendation comes back by reference inside the result.
- `tests/advice/grade.acceptance.test.ts` (366 lines, locked) — AC#1–AC#8 and exact rounding boundaries in both directions.
- `tests/advice/grade.test.ts` (311 lines) — boundary tables at 0, 9.9, 10, 14.9, 15 for every pairing, missing calling-range equity, errors, determinism, plain data, type compatibility.
- No change to `src/engine`, `src/bots`, `src/ui`, advice rules or charts. No new dependency.

Example: `gradeView(view, 'fold')` on a turn view where advice is call with equity 26.7 against 16.7 needed returns `{ grade: 'major', ruleId: 'call-fold-margin', marginPts: 10, userAction: 'fold', recommendation }`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 to SPEC-08, SPEC-17 | AC#1–AC#8, rounding | acceptance tests (locked, 9 tests) | pass | gates/build-2.json |
| SPEC-09 to SPEC-12 | boundaries, Q-2 grade, errors, determinism | unit tests (24 tests) | pass | gates/build-2.json |
| SPEC-13 | lint, typecheck, test, coverage | `npm run lint && npm run typecheck && npm test` | pass: 52 files, 194 passed, 1 skipped; 100% lines | gates/fix-3.json |
| SPEC-14 | playtest | `npm run playtest -- --hands 10000 --seed 42` | 0 invariant violations (builder run) | build-log.md |
| SPEC-15 | CI, doc | CI on `doit/TASK-7.4`; this doc | pending | — |
| SPEC-16 | N/A DoD items | Judge checks no UI, e2e or chart files changed | pending | — |

- Gate runs: 3. Gate 1 failed: TASK-7.1's locked test (equity AC#5) scans advice files for banned substrings and found "Date" in a doc comment in `grade.ts`. Fixed by rewording the comment; gate 2 and the fix run passed.
- Judge: pending. CI: pending.

## Review
Round 1, code and security reviewers: no BLOCKER or MAJOR findings. The code reviewer ran 34 mutants of `grade.ts` (thresholds, comparisons, swapped grades, tenths rounding variants, Q-2 variants, pairing checks, legality check order, double recommend call); 33 were killed.

### Non-blocking review notes (deliberately not fixed)
- MINOR (security) `src/advice/grade.ts:103`: `gradeDecision` accepts non-finite equity values; a NaN grades Minor with a NaN margin (becomes null when saved as JSON). Not reachable through `gradeView`, since `recommend` always returns finite numbers.
- MINOR (code) `tests/advice/grade.test.ts:133`: the wrong-way margin is tested only at −5, so a `Math.abs(margin)` mutant survives.
- NIT `tests/advice/grade.test.ts:163`: the test name claims a float trap, but 26.7 − 16.7 is exactly 10; the 16.4/6.4 case in the same test is the real trap.

## How to try it
`npx vitest run tests/advice/grade.acceptance.test.ts tests/advice/grade.test.ts`, then the full `npm run lint && npm run typecheck && npm test`.

## Run metrics
Questions asked 2 · assumptions logged 7 · review rounds 1 (0 blocking) · judge rounds pending · gate runs 3 (1 failure) · escalations 0 · changed lines 812 vs budget 800 (warn; fails above 1600), 3 files.

## Known limitations and follow-ups
- Until TASK-7.8 adds `equityVsCallingRangePct`, bet/raise-versus-check/call deviations always grade Minor (`aggression-no-range`).
- Follow-ups (one line each, owner):
  - TASK-7.8: when `equityVsCallingRangePct` is added to `PostflopRecommendation`, make real recommendations grade by `aggression-margin` and retire `aggression-no-range` for them.
  - TASK-7.14: include graded examples at Correct, Minor and Major levels for preflop and postflop in the golden spots.
  - TASK-7.15 and TASK-8.2: pin that a hint's grade and the Review grade for the same decision are equal, across the 10,000-decision determinism run.
  - TASK-3.12: decide what a hand record stores of `GradeResult` (grade code and ruleId and marginPts, or the full recommendation).
  - Owner: this module (new task or AC on TASK-7.4 follow-up): make `gradeDecision` throw `RangeError` on non-finite equity inputs, with one unit test.
  - Owner: same: add a −15 wrong-way margin assertion at `grade.test.ts:133` to kill the `Math.abs` mutant.
  - Owner: same: fix the test name or comment at `grade.test.ts:163` (26.7/16.7 is not a float trap).

## Lessons for the factory (proposals — not applied)
- The spec's A-3 example (26.7 − 16.7) was wrong; the builder and reviewer caught it. Proposal: the spec template should ask for float-trap examples to be checked in a scratch script (`node -e`) before they are written into a spec.
- Gate 1 failed on a banned-substring scan from an earlier task's locked test ("Date" in a doc comment). Proposal: the spec for any new file under `src/advice/` should list the substring bans of existing scans (Math.random, Date, performance, crypto), so the builder avoids them from the start.
