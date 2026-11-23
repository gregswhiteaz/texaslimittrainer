# Fix brief — TASK-7.13 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/advice/observed-ranges.acceptance.test.ts:range-width-pct-never-checked-against-a-value (code review)
- Where: tests/advice/observed-ranges.acceptance.test.ts:133
- Problem: d (A-2: default-range combos / 1326 x 100, before dead cards) is never asserted against an independent number. AC#2 computes the expected width with the same rangeWidthPct the implementation uses, so a broken rangeWidthPct (counting classes / 169, counting after dead-card removal, or dividing by the wrong total) leaves every test green.
- Evidence: rangeWidthPct appears only as the oracle in AC#2 (line 133) and inside estimateOpponentRanges (src/advice/ranges.ts:319, 610). No test pins a concrete value. Recomputed: UTG open-raise default = 162 combos = 12.217...%, BB check = 90.35%.
- Expected fix: Add a unit assertion with a hand-computed value, e.g. rangeWidthPct(new Set(['AA','AKs','AKo'])) toBeCloseTo((6+4+12)/1326*100, 9), and in AC#2 or the unit file assert the typical estimate's widthPct for the UTG open-raiser equals the default classes' summed comboCount / 1326 * 100 computed in the test (no rangeWidthPct call), on a view whose dead cards intersect the default range so the 'before dead cards' rule is exercised.

## 2. [MAJOR] tests/advice/observed-ranges.acceptance.test.ts:hands-over-100-cap-untested (code review)
- Where: tests/advice/observed-ranges.acceptance.test.ts:185
- Problem: The min(n, 100) cap (spec section 7 edge case 'n > 100 is capped at 100') has no test that can fail. All formula and AC#6 cases use n = 30 or n = 100, where removing Math.min gives identical results.
- Evidence: scaledWidthPct(20, 60, 100) = 60 with or without the cap; AC#6 uses hands: 100. No test uses n > 100.
- Expected fix: Add a unit case scaledWidthPct(20, 60, 250) toBeCloseTo(60, 9) (and optionally an estimateOpponentRanges case with hands: 150 giving the same widthPct as hands: 100).


## Orchestrator additions (same round; strengthen only)
- MINOR: test the stat choice (PFR vs VPIP) for limp, three-bet, four-bet and call-three-bet lines too (unit file).
- MINOR: break the ranges.ts ↔ explain.ts circular import (import the basis strings from explanations.ts or move basisText there).
- MINOR (docs only): add a short note to docs/advice/range-model.md and the hand-order justification that ranking by equity vs one random hand values offsuit high-card hands (e.g. Q2o) above suited connectors (e.g. 76s), and that PFR scaling widens re-raise ranges a lot; a follow-up decision task tracks whether to change it. No ordering or code change.
Never drop or loosen an assertion. npm run format, lint, then the gate.
