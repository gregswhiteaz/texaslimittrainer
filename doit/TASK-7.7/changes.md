# Changes — TASK-7.7

- `tools/equity/generate-multiway-reference.js` — new offline generator: seeded case list (`MULTIWAY_CASES`), `RANGE_PALETTE`, `resolveOpponent`, `estimateEvaluations`, `computeReference` (exhaustive or 2,000,000-trial high-sample), writes the multiway fixture.
- `tests/advice/fixtures/equity-multiway-reference.json` — new generated fixture: 120 cases (30 per board size 0/3/4/5), 84 exhaustive and 36 high-sample.
- `tests/advice/equity-multiway.acceptance.test.ts` — new acceptance tests for AC#1, AC#2, AC#3 (SPEC-01..04).
- `tests/advice/equity-multiway-reference.test.ts` — new unit tests: fixture consistency and reproducibility against the generator (SPEC-05), plus sampler determinism and the impossible-deal error.
- `tools/equity/generate-reference.js` — `cardText` and `mulberry32` now exported for reuse; no behaviour change.

No new dependencies. No change to `src/`.
