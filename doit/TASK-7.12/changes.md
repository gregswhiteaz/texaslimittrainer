# TASK-7.12 changes

- `src/stats/style-stats.ts` — new: shared REQ-045 style stats (StatHand, StyleCounts, handStyleCounts, addStyleCounts, styleCounts, styleStats, formatStat, NO_STAT, EMPTY_STYLE_COUNTS).
- `tests/stats/style-stats.acceptance.test.ts` — new acceptance tests SPEC-01..SPEC-06 (AC#1..AC#6) on hand-written records.
- `tests/stats/style-stats.test.ts` — new unit tests SPEC-07..SPEC-10: edge hands, undealt seats/sums/purity/formatting, real playtest invariants, CompletedHand as StatHand.
- `tests/bots/style-bands.acceptance.test.ts` — modified (Q-1, SPEC-11): private Counts and counting loop replaced by the shared functions; bands, seeds, hand count, names, opt-in gate and 0.1 rounding kept; a null stat fails.
- `docs/stats/style-stats.md` — new: formulas, counting rules, API with CompletedHand and PlayedHand examples, display rule.

No new dependencies.
