# Fix brief — TASK-1.8 (review round 1)

Fix exactly these items. Nothing else: no MINOR/NIT changes, no refactors, no new features.
Acceptance tests and the spec are locked. If an item is wrong or impossible, write blocked.json and stop.

## 1. [MAJOR] tests/engine/invariants.test.ts:sub-check-clauses-unverified (code review)
- Where: tests/engine/invariants.test.ts:79
- Problem: SPEC-02 requires every sub-check to be proven by a corrupted state, but several spec-listed clauses within C1, C3, P1, P5, K2 and L5 have no case. Removing any of them leaves the whole suite green, so a broken implementation of these clauses would go unnoticed.
- Evidence: Mutation run on a scratch copy (invariants.test.ts + invariants.acceptance.test.ts + runner.test.ts). Each of these mutants SURVIVED: (1) C1 drop `streetContribution > totalContribution`; (2) C3 drop `|| !balanced` (per-award winner shares sum to award.amount); (3) K2 drop `players.some(p => p.holeCards.length !== 2)`; (4) P1 drop `playerAt(state, seat) !== undefined` (seat not dealt in), and without it P3's `as PlayerState` cast throws on a pot holding chips, which breaks 'never throws'; (5) P5 drop `|| p.totalContribution <= 0`; (6) L5 drop `last.street !== before.street`; (7) L5 drop `after.length !== before.actions.length + 1`. A C4 mutant was killed, which confirms the harness works.
- Expected fix: Add one stateCases/stepCases row per clause: C1 `withPlayers(S,{5:{streetContribution:5}})` (street > total); C3 a two-award foldOut result whose totals match but whose shares are moved between awards; K2 `withPlayers(S,{3:{holeCards:[10]}})`; P1 `withPot(S,16,[2,3,4,5,7])`; P5 a winner with totalContribution 0 who is listed as eligible; L5 a result whose last record has street 'preflop', and one with an extra duplicated record. Assert the exact message for each.

