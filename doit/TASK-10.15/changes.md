# TASK-10.15 — Changes

- `src/table/hand-record.ts` — modified: `userMade` exported (body unchanged).
- `src/stats/leaks.ts` — modified: imports `userMade`; `handCategoryDecisions` pairs by reference against `userMade(...)` and computes the seat list and `positionGroup` once per hand, lazily on the first preflop pairing (A-1); doc comment names `userMade`.
- `tests/stats/preflop-pairing.test.ts` — new: SPEC-01..SPEC-03 unit tests (seat reads counted via a getter, lazy group/error behaviour, blind skipped).

No new dependencies.
