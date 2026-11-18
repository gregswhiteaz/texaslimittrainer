# Changes — TASK-7.2

- `src/advice/hand-class.ts` — new: `HandClass`, `HAND_CLASSES` (169, 13×13 grid order), `handClassAt`, `handClassOf`, `comboCount`.
- `src/advice/preflop-chart.ts` — new: chart types, `APPLICABLE_SPOTS` (26 6-max spots), `ChartValidationError`, `parseChart` (collects every problem with the §5 messages), `chartCell`.
- `src/advice/charts/six-max.json` — new: the authored, original TAG 6-max chart (26 spots × 169 cells, chart and per-spot plain-English justifications).
- `src/advice/preflop.ts` — new: `SIX_MAX_CHART` (parsed at import), `positionOf`, `situationOf`, `recommendPreflop` with the cap / nothing-to-call legality adjustment and `move`.
- `tests/advice/preflop.acceptance.test.ts` — new: AC#1–AC#8 (SPEC-01 to SPEC-08).
- `tests/advice/preflop.test.ts` — new: position/situation rules, legality adjustment, API errors, speed (SPEC-09, SPEC-10).
- `tests/advice/preflop-chart.test.ts` — new: validator messages and grid parsing (SPEC-11).
- `tests/advice/hand-class.test.ts` — new: hand-class names, order, combos (SPEC-13).
- `tests/advice/six-max-chart.test.ts` — new: content sanity checks on the authored chart, prints raise/continue % per spot (SPEC-12).

No new dependencies.
