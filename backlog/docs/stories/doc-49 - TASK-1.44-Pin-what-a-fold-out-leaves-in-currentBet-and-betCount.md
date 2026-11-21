---
id: doc-49
title: 'TASK-1.44: Pin what a fold-out leaves in currentBet and betCount'
type: other
created_date: '2026-11-21T01:50:00Z'
updated_date: '2026-11-21T01:50:00Z'
---
# TASK-1.44: Pin what a fold-out leaves in currentBet and betCount

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up from the TASK-1.4 review NIT, doc-39 / TASK-1.22) · Branch: doit/TASK-1.44

## What was asked
When a hand ends because everyone else folded, `foldOut` in `src/engine/hand.ts` leaves `currentBet` and `betCount` at 0. The task is to decide that this is the intended rule, document it, and pin it with a test. Spec: doit/TASK-1.44/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The pin goes in a new acceptance file, not in `hand.test.ts`. | yes | The lock then covers only this rule. It follows the `review-gaps.acceptance.test.ts` pattern. | Move the `it` blocks into `tests/engine/hand.test.ts`. |
| A-2 | The test copies the small `config`/`play` helper instead of sharing one. | yes | Every engine test file keeps its own copy, and extracting one would touch locked files. | Extract a helper into `tests/support/`. |

## Clarifications and decisions
- No questions were asked (autopilot run).
- D-1: keep the reset rule. It matches `endRound` and the `currentBet` field doc ("Highest streetContribution"), since `gather` zeroes every contribution. The bets stay recorded in `actions`.

## What was built
- `src/engine/hand.ts`: a 7-line JSDoc above `foldOut` states the rule, why, and which test pins it. No code change.
- `tests/engine/fold-out.acceptance.test.ts` (new, 60 lines): two cases. SPEC-01 is a preflop fold-out. SPEC-02 is a flop fold-out after a bet and a raise (state `currentBet 8, betCount 2` before the folds). Both assert `currentBet 0`, `betCount 0`, `toAct null`, zero street contributions, `endedBy 'fold'` and an unchanged `street`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | Preflop fold-out resets both fields | Acceptance test | PASS | Judge round 1 |
| SPEC-02 | Flop fold-out after a raise resets both | Acceptance test | PASS | Pre-fold (8,2), end (0,0) |
| SPEC-03 | Comment states the rule and why | grep above `foldOut` for the three tokens | PASS | Count 3 |
| SPEC-04 | No runtime change | Diff has no non-comment changes in `hand.ts`. Playtest of 10000 hands, seed 42, is identical to base | PASS | Invariant violations: 0 |

- `npm test`: 365 passed, 6 skipped, 102 files. Gate build-1 PASS. The Judge's mutation check showed the new tests fail if the reset is removed.
- Judge round 1: PASS, with no failures and no blocking findings.

## Review
Round 1 had no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- NIT: the `foldOut` comment is 7 lines and the spec asked for 3–6. The judge rated this LOW. It is not tracked.

## How to try it
`npx vitest run tests/engine/fold-out.acceptance.test.ts`

## Run metrics
Questions 0 · assumptions 2 (both in spec) · review rounds 1 · judge rounds 1 · gate runs 1 · escalations 0 · changed lines 67 (2 files).

## Known limitations and follow-ups
None. The comment length NIT is not tracked.

## Lessons for the factory (proposals — not applied)
None. The run was clean.
