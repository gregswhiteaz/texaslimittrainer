# Changes — TASK-7.19

- `src/advice/chart-print.ts` — new: pure formatter (`cellToken`, `spotWidths`, `formatSpot`, `formatChart`) that prints each chart spot as a 13×13 grid with raise and continue percentages.
- `tools/chart-print/main.ts` — new: Node entry for `npm run chart:print`; writes `formatChart(SIX_MAX_CHART)` to stdout.
- `package.json` — added the `chart:print` script (no dependency changes).
- `src/advice/charts/six-max.json` — revised the five opener re-raise grids (UTG, HJ, CO, BTN, SB) to keep 80–90% of the raise-first range with premium-only raises; fixed BB blind-defence offsuit inversions; cleared the BTN unopened (98o) and SB unopened (K9o, 98o) flag inversions; rewrote justifications so each is true for every route into its spot, plus the chart-level text (including the two sign-off wording tweaks to BB re-raise and SB blind-defence).
- `tests/advice/six-max-chart.test.ts` — D-3: BTN re-raise band `[6, 30]` → `[6, 41]` with its comment.
- `tests/advice/six-max-chart.acceptance.test.ts` — new: SPEC-02, SPEC-03, SPEC-04, SPEC-05, SPEC-07.
- `tests/advice/chart-print.acceptance.test.ts` — new: SPEC-01 plus focused `cellToken`/`spotWidths` checks.
- `doit/TASK-7.19/chart-print.txt` — full `npm run chart:print` output for the user's sign-off review.
- `doit/TASK-7.19/chart-changes.md` — every spot whose grid or text changed, old vs new widths and hands added/removed.
- `doit/TASK-7.19/changes.md`, `doit/TASK-7.19/build-log.md` — builder records.

No new dependencies.
