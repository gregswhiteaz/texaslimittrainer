---
id: doc-166
title: 'TASK-7.33: Harden the TASK-7.32 advice fields and river-bet clause'
type: other
created_date: '2026-11-26T16:05:00Z'
updated_date: '2026-11-26T16:05:00Z'
---
# TASK-7.33: Harden the TASK-7.32 advice fields and river-bet clause

Status: Done · Completed: 2026-11-26 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: n/a (follow-up from doc-129) · Branch: doit/TASK-7.33

## What was asked
Close the TASK-7.32 review follow-ups. (1) `requiredCountsRiverBet` and `valueThresholdPct` become required on `PostflopRecommendation`. (2) The river-bet clause in turn explanations comes from its own template, so wording drift fails a test. (3) Grading rejects a non-finite `valueThresholdPct` like the other percent fields. (4) Fix the value-bet AC#6 test title (65.1%) and the golden spot id `6max-flop-co-raise-jj`. Spec: doit/TASK-7.33/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | `GoldenNumbers` keeps `valueThresholdPct` optional | yes | AC#1 targets `recommendPostflop` output; absent already means 50 in grading; required would force edits to locked golden tests | Make it required and add `valueThresholdPct: 50` at the 5 hand-built sites |
| A-2 | New golden id is `6max-flop-co-raise-jj-3way` | yes | Same hand/street/seat/action, so a suffix is needed; suggested by the TASK-7.32 code review | Rename in `tests/golden/postflop-spots.json` and the log |
| A-3 | Clause template is `', counting the big bet you will likely face on the river'`, in a `{riverBet}` slot right after `{def:pot-odds}` | yes | Output is byte-identical to before | Change the constant |
| A-4 | When both aggression numbers are non-finite, the existing `equityVsCallingRangePct` error wins | yes | Keeps existing error messages unchanged | Validate threshold first |

## Clarifications and decisions
No questions asked. Locked-test edits (title, one JSON id, factory fields; no assertion added or removed) were auto-accepted in autopilot: `tests/golden/postflop-spots.json` (TASK-7.14), `tests/advice/value-bet.acceptance.test.ts` (TASK-7.8), `tests/advice/value-copy.acceptance.test.ts` (TASK-8.1).
Decisions: D-1 clause is a `{riverBet}` slot in the 5 owed-bet templates; D-2 `explainPostflop(rec, valueThresholdPct)` signature unchanged; D-3 the id re-pin is logged as a new "Changes from TASK-7.33" section in `docs/advice/golden-spots.md`.

## What was built
- `src/advice/postflop.ts` — both fields required; comments updated.
- `src/advice/explanations.ts` — `{riverBet}` slot in `value-raise`, `pot-odds-call`, `implied-odds-call`, `pot-odds-fold`, `pot-odds-fold-implied`; new `POT_ODDS_RIVER_BET_CLAUSE`; removed `POT_ODDS_LEAD` and `POT_ODDS_RIVER_BET_LEAD`.
- `src/advice/explain.ts` — fills `riverBet` from the clause template; no `.replace`.
- `src/advice/grade.ts` — `finitePct` accepts `valueThresholdPct`; non-finite gives `RangeError('valueThresholdPct must be a finite number, got NaN')`. Absent or null still means 50.
- `src/advice/golden.ts` — comment/type per A-1.
- Tests: new `tests/advice/advice-hardening.acceptance.test.ts`; edits to `explain.test.ts`, `hint.test.ts` and the three locked files above.
- Docs: `docs/advice/golden-spots.md` (re-pin log), `docs/advice/explanations.md` (one sentence).
- All explanation text is byte-identical to before.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03, 05, 06 | AC#1-3 | new acceptance file (type assertions, clause on all 5 templates, slot-loss guard, grader errors) | PASS | judge round 1 |
| SPEC-04 | AC#2 | unit test in `explain.test.ts` | PASS | judge round 1 |
| SPEC-07, 08 | AC#4 | renamed title; golden acceptance test titled with new id | PASS | judge round 1 |
| SPEC-09 | nothing else moves | full `npm test` incl. typecheck | PASS | gates/build-1.json |

Gate run 1 PASS (284 changed lines). Judge round 1 PASS (9/9, no findings, no unproven AC).

## Review
One review round; no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- NIT: one-letter variable `t` in `grade.ts`.
- NIT: one fixture self-check assertion in the new tests.
- NIT (security): `valueThresholdPct` is checked finite but not range-checked, same as the other percent fields.
- Note: the TASK-7.32 history row in `golden-spots.md` calls `6max-flop-co-raise-jj` a "three-way limped pot" though it is a raised pot. Left as history.

## How to try it
`npm test` (includes typecheck); `npx vitest run tests/advice/advice-hardening.acceptance.test.ts`.

## Run metrics
Questions 0 · assumptions 4 · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 284.

## Known limitations and follow-ups
- [trainer] Optional: range-check percent fields (`valueThresholdPct` must be 50 or 65; other percents 0-100) in `grade.ts`. Low value; no owning task known.

## Lessons for the factory (proposals — not applied)
None; the run was clean.
