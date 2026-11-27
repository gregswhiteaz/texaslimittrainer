# TASK-7.44 changes

- `src/advice/ranges.ts` — new exports `TYPICAL_PFR`, `typicalPfr`, `relativePfrPct`; `OBSERVED_LINE_STAT` maps `three-bet` and `four-bet` to `'relative-pfr'`; `estimateOpponentRanges` scales those lines toward `min(100, d × PFR ÷ typical PFR)`; doc comment updated. No new import (advice lint boundary unchanged).
- `tests/advice/observed-reraise.acceptance.test.ts` — created: SPEC-01..04, 06, 11 (AC#1..AC#7). Fast, not in `test:slow`.
- `tests/advice/observed-ranges.test.ts` — line-table case updated and renamed (SPEC-07); new tests SPEC-05, SPEC-08 (drift test vs `HEALTHY_RANGES`), SPEC-09 (empty-default `resizeRange`).
- `tests/advice/observed-resize.acceptance.test.ts` — locked edit under owner TASK-7.43 (SPEC-10): `strongestClasses` import and line 143 replaced by a check that can fail.
- `docs/advice/range-model.md` — line-to-stat table, typical-PFR paragraph, "Known limits" (SPEC-11).

No new dependencies.
