# Fix brief — TASK-7.3 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/advice/postflop.test.ts:rounded-comparison-not-pinned (code review)
- Where: tests/advice/postflop.test.ts:97
- Problem: D-2 (user-approved Q-2) says the rules compare the one-decimal rounded percentages, so an equity that rounds up to the required % must call. No test pins this down. Every call case (4/24, 0.1667, 0.5, 1, turn 0.25) is also >= the unrounded required equity, and every fold case is also below the rounded required %.
- Evidence: Mutation in a scratch copy: replacing `equityPct >= requiredEquityPct` at src/advice/postflop.ts:96 with `result.hero.equity >= callAmount / (pot + callAmount)` (unrounded comparison) left all 12 tests in postflop.acceptance.test.ts and postflop.test.ts passing.
- Expected fix: In describe('rule pot-odds-call'), add a flop case with equity 0.1665 (rounds to 16.7, below the unrounded 0.16667) and expect action 'call', equityPct 16.7, requiredEquityPct 16.7.

