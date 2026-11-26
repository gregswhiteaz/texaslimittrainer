---
id: doc-168
title: >-
  TASK-11.14: Harden the BB/100 trend against tampered stakes and type its cash
  summaries
type: other
created_date: '2026-11-26T17:48:00Z'
updated_date: '2026-11-26T17:48:00Z'
---
# TASK-11.14: Harden the BB/100 trend against tampered stakes and type its cash summaries

Status: Done · Completed: 2026-11-26 · Epic: TASK-11 · Milestone: m-1 · Requirements: REQ-048 (via TASK-11.2) · Branch: doit/TASK-11.14

## What was asked
Follow-up from the TASK-11.2 review (doc-135). A tampered store with many unusual big bets pushed `bb100Value`'s LCM to Infinity. `gcd` then recursed until the stack overflowed, and the Statistics screen never left loading. AC#1: finite BB/100 for tampered stakes. AC#2: `trendHand` needs no cast for cash fields. AC#3: a unit case for an all-negative chart. Spec: doit/TASK-11.14/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Fallback only when the running LCM would exceed MAX_SAFE_INTEGER. Real stakes (LCM 120) take the unchanged exact path. | yes | Normal output stays identical. | Change the threshold in `bb100Value`. |
| A-2 | Fallback value is Σ(net/bigBet)/n × 100, rounded half away from zero to tenths, never -0. | yes | Matches `bbPer100` in the Session Report. | Swap the rounding function. |
| A-3 | "Top of the plot" (AC#3) means the break-even line sits above every point, not at y=10. Today's +1 head-room is kept. | yes | Moving it to y=10 would change the chart for real all-negative histories. **Please review.** | Change hi to max(0, values), which alters the geometry. |

## Clarifications and decisions
No questions asked (autopilot).

## What was built
- `src/stats/trends.ts`: iterative `gcd`. `bb100Value` stays exact while the LCM is a safe integer and falls back to the float per-hand sum above that. `TrendSource` is now `CashTrendSource | OtherTrendSource`, so `trendHand` has no cast.
- `tests/stats/bb100-tampered.acceptance.test.tsx` (new, locked): 500 prime-big-bet cash hands in fake-indexeddb render one finite BB/100 point.
- `tests/stats/trends.test.ts`: unit cases for exact vs fallback values, ties, never -0, the switch point, groupings, `@ts-expect-error` type cases and all-negative geometry.
- `docs/stats/trends.md`: states the fallback rule.
- `App.tsx` is untouched. With a finite value nothing in `statisticsView` throws.

## How it was verified
| SPEC | Covers | Verification | Result |
|---|---|---|---|
| SPEC-01 | AC#1 | acceptance test, store through `renderToString` | pass |
| SPEC-02 | AC#1 | unit: exact vs fallback values | pass |
| SPEC-03 | AC#1 | unit: every grouping finite | pass |
| SPEC-04 | AC#2 | type-error cases, typecheck, and a grep that `trendHand` has no `as` | pass |
| SPEC-05 | AC#3 | unit: all-negative geometry | pass |

Judge round 1: PASS, 5 of 5, no blockers. CI run 45869869473 is green. Gate runs: 2.

## Review
Round 1 had 2 MAJOR findings and 1 MINOR, all test-strength gaps. The tests did not pin the -0 guard or half-away-from-zero rounding (MAJOR), nor the safe-LCM switch point (MINOR). Fixed in commit 1cbe8ad with tests only. Round 2 re-ran each mutant on its own, and each failed on the intended assertion. No blockers remain.

### Non-blocking review notes
- NIT: `netOf` in the locked acceptance test re-derives `netResult` instead of importing it.
- One further NIT from the review rounds is not described in the artifacts I read.

## How to try it
`npm test -- tests/stats` and `npm run typecheck`.

## Run metrics
Questions 0 · assumptions 3 · review rounds 2 · judge rounds 1 · gate runs 2 · escalations 0.

## Known limitations and follow-ups
- Tampered stakes remain valid records. Their fallback values are float-based, not exact, by design.
- No follow-ups.

## Lessons for the factory (proposals — not applied)
- Test-strength gaps (-0, rounding mode, threshold) were caught only in review. A spec rule "every guard or rounding rule needs a mutation-style pinning case" would catch them at build time.
