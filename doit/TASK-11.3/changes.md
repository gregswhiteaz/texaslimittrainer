# TASK-11.3 changes

## Source
- `src/stats/trends.ts` — `G2_BASELINE_HANDS`, `G2_CAPTION`, `g2Target(ordered)` (`bbPer100(m, 2, 1000)`, null below 1,000), `StatisticsView.g2Target`, `statisticsView(data, all = data)` (target from `all`, ordering reused when `all === data`), `chartLabel(points, target?)` suffix `. Dashed target line at <t>`.
- `src/ui/stats/StatisticsScreen.tsx` — `MajorErrorTrend` takes `target`: caption `p.stats-goal` above the SVG, dashed `line.stats-target`, yMax widened to include the target, aria-label from `chartLabel(points, target)`. Markup unchanged when the target is null.
- `src/ui/styles.css` — `.stats-target` shares the `.stats-break-even` stroke rule.

## Tests
- `tests/support/stat-records.ts` — private `graded` renamed and exported as `withGrades`; optional `players` (default 6, unchanged) on `cashPool` and `sitAndGoPool`.
- `tests/stats/g2-target.acceptance.test.tsx` — new: AC#1–AC#5 (SPEC-01..SPEC-05), module and `renderToString` level.
- `tests/stats/trends.test.ts` — the two `g2Target: null` edits and the SPEC-06 unit case.
- `e2e/statistics-target.spec.ts` — new Playwright flow (SPEC-07), Chromium + WebKit, axe, same-origin.

## Docs
- `docs/stats/trends.md` — G-2 target section (baseline, rounding, threshold, filter contract, display) and test list.

No new dependencies.
