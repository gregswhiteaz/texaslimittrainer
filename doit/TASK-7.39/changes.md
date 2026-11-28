# Changes — TASK-7.39

- `src/advice/postflop.ts` — D-1: with the default equity, whole-range outcomes (result or RangeError) are kept per
  attempt and an identical calling-range attempt (every range the same length) reuses them. D-2: a calling-range
  run with ≥ `REDUCED_CALLING_OPPONENTS` (7) ranges that is not reused runs `equityWithBudget(…,
  CALLING_RANGE_BUDGET)` (10,000 trials). New exports `REDUCED_CALLING_OPPONENTS`, `CALLING_RANGE_BUDGET`. Injected
  `equity` seams take the unchanged path.
- `tests/advice/postflop.perf.test.ts` — headroom test: 9-seat target 100 ms (was 200), adds the 6-max actions spot
  (timed last, `ACTION_RANGE_ADVICE`), 8-way check uses `CALLING_RANGE_BUDGET`; header comments updated.
- `tests/advice/calling-run-identity.acceptance.test.ts` — new acceptance test SPEC-02.
- `tests/advice/postflop-calling-run.test.ts` — new unit tests SPEC-03, SPEC-04, SPEC-05.
- `README.md` — Speed targets: headroom check covers the actions spot; 9-seat target 100 ms.
- `docs/advice/postflop-rules.md` — 7+ opponents: equity against the range that would call is sampled from 10,000
  deals.

No new dependencies.
