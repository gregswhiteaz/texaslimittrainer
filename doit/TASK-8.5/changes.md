# TASK-8.5 changes

## Source
- `src/advice/explanations.ts` — new `SITUATION_LABELS` (Q-1 approved copy), one label per `Situation` id.
- `src/advice/explain.ts` — new `positionLabel` (returns `CHART_POSITIONS`) and `situationLabel` (returns `SITUATION_LABELS`); `chartBasisText` now uses `positionLabel` (output unchanged, D-3).

## Tests
- `tests/advice/labels.acceptance.test.ts` (new) — SPEC-01, SPEC-02, SPEC-03.

## Docs
- `docs/advice/explanations.md` — "Position and situation labels" paragraph under Preflop listing the situation labels and both functions.

No new dependencies.
