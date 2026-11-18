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
- A-14 (review r1): Security MAJOR — the pre-sampling feasibility search (spec §5 step 5) is unbounded and can run exponentially for infeasible large ranges, contradicting the spec §8 invariant "work per call is bounded". Resolution: cap the feasibility search (e.g. 100,000 visited nodes); on hitting the cap, proceed to rejection sampling, which is already bounded by maxRejections and throws RangeError. The §8 invariant governs; spec text stays locked, deviation recorded here.
- A-15 (judge r1): SPEC-15 FAIL — CI run 44231570428 timed out AC#2 (locked test, default 5 s per-test timeout; ~4.1 s locally with coverage, slower on CI). Resolution: speed up the sampled path (remove per-trial allocations / optional-chaining reads in the hot loop, as the round-1 code reviewer suggested) so AC#2 runs in ≤ 2.0 s locally under `npm test` coverage, with byte-identical results; do not raise timeouts or edit the locked test.

## Q-5 — Escalation (judge r1 / builder blocked): AC#2 exceeds the 5 s default per-test timeout on CI
- Evidence: 7.2M evaluate() calls; profiled ~2.0 s in evaluate alone under coverage; builder speed-ups (byte-identical) took AC#2 from 4.17 s to ~3.9 s locally.
- Options: raise per-test timeout (recommended) | speed up evaluator (touch TASK-1.2 file) | fewer matchups (story change).
- Answer: **Raise the per-test time limit** — set Vitest `testTimeout: 30_000` in vite.config.ts (approved 11th file outside the spec's file list). Keep the builder's byte-identical speed-ups.
- Q-5 applied by orchestrator at the user's explicit instruction (builder's edit was denied by the auto-mode permission check).
