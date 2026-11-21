# Changes — TASK-7.20

- `src/advice/preflop-chart.ts` — added `ECHO_CHARS = 20` and module-private `echo()` (first 20 characters + `...` only when cut); applied at the three echo sites (`invalid action`, `invalid alternative`, `spot … does not apply`); rewrote the `chartCell` JSDoc to document both `RangeError`s (SPEC-03, SPEC-04, SPEC-05).
- `tests/advice/preflop-chart-edges.acceptance.test.ts` — new acceptance tests for SPEC-01..05 (numeric/punctuation justification rejected, shipped chart validates, unknown-hand-class RangeError pinned and documented, token and spot-name echo cut at 20 characters).

No new dependencies.
