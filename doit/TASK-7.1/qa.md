# Q&A — TASK-7.1

## Q-1 — Public equity API (D-1)
- Answer: **Recommended.** computeEquity({ hero: HoleCards, board: Card[] (0/3/4/5), opponents: Range[] (1–9) }) → { hero, opponents (input order), method: 'exact'|'sampled', trials }; PlayerEquity { win, tie, equity } as fractions 0–1; HoleCards = readonly [Card, Card]; Range = readonly HoleCards[] (unweighted combo list; known hand = 1-combo range).

## Q-2 — Seeded sampler (D-2)
- Answer: **Recommended.** Canonical key → FNV-1a 32-bit seed → SplitMix32-expanded xoshiro128**; exact when estimated work ≤ 200,000 evaluations, else 30,000 accepted trials with whole-deal rejection; 1/2520 integer pot shares.
- Orchestrator (Spec Detective) decision, told to the user: place the seeded PRNG in **src/engine/seeded-random.ts** (not src/advice) so TASK-1.3's shuffle can reuse it without the engine importing from advice.

## Q-3 — Reference set (D-3)
- Answer: **Recommended.** Offline generator tools/equity/generate-reference.js (exhaustive, uses only evaluate, no code shared with the equity module) → committed tests/advice/fixtures/equity-reference.json (121 cases as integer counts); published anchors asserted; 2 cases re-enumerated per test run.

## Q-4 — Latency targets (D-4)
- Answer: **Accept.** p95 on reference machine: HU preflop ≤15 ms; HU flop exact ≤2 ms; HU flop vs all combos ≤20 ms; HU turn vs all combos ≤15 ms; 3-way preflop ≤20 ms; 6-max preflop vs 5 ranges ≤50 ms; full-ring flop vs 9 ranges ≤80 ms. npm test uses EQUITY_PERF_SCALE=20 slack; separate command checks real targets.

## Assumptions logged during build (orchestrator-accepted)
- A-12: SPEC-08 river example arithmetic slip — spec says 1,035×1×2 = 2,070; with 45 unseen cards the live combos are C(45,2) = 990, so 990×1×2 = 1,980 (still exact). Test asserts 1,980.
- A-13: SPEC-05 input (b) has identical opponent ranges, so swapping is a no-op on canonical input; test asserts reordered result equals original exactly; mapping-back with distinct ranges is covered by the SPEC-09 property test.
