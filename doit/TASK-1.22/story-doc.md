# TASK-1.22: Close engine test gaps found in review

Status: Done · Completed: 2026-11-19 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up to TASK-1.2 / TASK-1.4) · Branch: doit/TASK-1.22

## What was asked
Three engine behaviours were correct but not pinned by a test: the third kicker deciding a one-pair comparison (TASK-1.2 judge J-1-01), a folded seat being ineligible for pots while its chips stay in (TASK-1.4 review), and the small blind equal to the big blind being accepted. Spec: doit/TASK-1.22/spec.md. Test-only; no `src/` change.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | All three tests go in one new file `tests/engine/review-gaps.acceptance.test.ts` | yes | Keeps the diff isolated from other stories' tests | Move the `it` blocks into `hand.test.ts` / `hand-evaluator.test.ts` |
| A-2 | Tests are tagged `acceptance` and locked after first green (orchestrator decision, overriding the drafted `unit`) | yes | Later stories must not silently drop these behaviours | Retag as `unit` |
| A-3 | AC#3 pinned as "accept": SB == BB is valid | yes | Documented rule is `smallBlind <= bigBlind <= smallBet < bigBet` (doc-10, `src/engine/hand.ts:142`) | n/a, the rule decides it |

## Clarifications and decisions
No questions asked (autopilot run). D-1: the seven-card example uses K-K-A-9-7 vs K-K-A-9-6 (a third kicker of 3 is impossible with seven cards), plus the judge's five-card pair. D-2: fold retention is checked mid-hand and via `result.awards`, because `pots[0].amount` is zeroed at completion (TASK-1.4 A-13).

## What was built
- `tests/engine/review-gaps.acceptance.test.ts` (112 lines, new), one `describe('engine review gaps')` with three tests:
  - SPEC-01: seven-card and five-card one-pair hands differing only in the third kicker compare 1 / -1.
  - SPEC-02: six-seat $2/$4 hand, seat 4 folds on the flop after calling 4. Every pot's `eligible` is `[1,2,3,5,6]`, `totalContribution` is 4, pot is 44 = sum of contributions after the turn, and awards total 44 with seat 4 absent. Also the SB-fold variant (eligible `[1,3,4,5,6]`, contribution 2).
  - SPEC-03: stakes `{2,2,4,8}` accepted (blinds 2, `currentBet` 2, SB legal actions check / raise to 6, flop pot 12); `{3,2,4,8}` throws `RangeError('Invalid stakes')`.
- No `src/` changes, no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance `...::the third kicker decides between equal pairs` | PASS | Mutation (pack only 2 kickers) fails only this test; holdouts pass |
| SPEC-02 | AC#2 | acceptance `...::a folded seat leaves every pot but its chips stay in` | PASS | Mutations (keep eligible on fold; skip totalContribution) fail only this test; BB river-fold holdout passes |
| SPEC-03 | AC#3 | acceptance `...::small blind equal to big blind is accepted` | PASS | Mutation `>` to `>=` fails only this test; `{4,4,4,8}` holdout passes |

- `npm test`: 333 passed, 5 pre-existing skips; lint, typecheck, format clean. New file: 3 passed in 98 ms. `git diff -- src` empty.
- Gates: build-1 PASS, fix-2 PASS. Judge round 1: PASS, no findings. Test file is locked (one unlock for the review fix, which only strengthened it).

## Review
No BLOCKER or MAJOR. Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR `pots-every-vacuous-on-empty`: the blind-fold `pots.every(...)` check passes on an empty `pots`. Fixed in-story (commit 4677430) by asserting `pots.length > 0` first. Nothing outstanding.

## How to try it
`npx vitest run tests/engine/review-gaps.acceptance.test.ts`, or `npm test`.

## Run metrics
Questions 0 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 113 (one test file).

## Known limitations and follow-ups
- NIT `fold-out-resets-bet-counters` (TASK-1.4 review round 1) is still present: `foldOut` in `src/engine/hand.ts:320-321` sets `currentBet` and `betCount` to 0 on a fold-out although the street is unchanged. Not moot, and no existing task owns it (backlog searched). It was out of scope here. Proposed one-liner: keep the street's `currentBet`/`betCount` in the final state when a hand ends by fold-out, or document the reset, and pin it with a test. Needs a new task (low priority, parent TASK-1).
- TASK-1.4 spec §5 wording that `pots[0].amount` is reset at completion: moot. It is accurate to the shipped behaviour (A-13; `foldOut` sets `amount: 0` and the pot moves to `result.awards`), and this story's tests work around it (D-2). Spec §5 is locked history, so no task is needed.
- Side pots: SPEC-02 uses `pots.every(...)`, so it should keep holding when TASK-1.10 adds side pots. Owner: TASK-1.10 (re-run these tests; extend if per-pot eligibility changes).

## Lessons for the factory (proposals — not applied)
- The only review finding (vacuous `every()` on a possibly empty list) is a common test pattern. Add to the test-writer checklist: pair every `.every(...)` with a non-empty assertion.
