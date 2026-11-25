# TASK-11.7 changes

- `src/stats/trends.ts` — optional `lineUp` on `TrendHand`/`TrendSource`/`TrendFilter`; `LineUpFilter`, `LINE_UP_LABEL`, `LINE_UP_OPTIONS`; `ALL_TRENDS.lineUp = 'all'`; `trendHand` copies `lineUp`; `filterTrendData` filters by line-up (AND, missing = All).
- `src/ui/stats/StatisticsScreen.tsx` — Line-up select (`#stats-line-up`) between Game type and Group by.
- `dreams/limit-holdem-trainer/storyboards/Stats.dc.html` — Line-up select (All selected) after Game type.
- `docs/stats/trends.md` — "Filter: line-up (TASK-11.7)" section and Tests entry.
- `tests/stats/trend-lineup.acceptance.test.tsx` — new: SPEC-01..SPEC-05 acceptance tests.
- `tests/stats/trends.test.ts` — SPEC-06 unit case for `trendHand`/`filterTrendData` line-up handling.
- `e2e/statistics-lineup.spec.ts` — new: SPEC-07 App-wired flow (Chromium and WebKit, axe, same-origin).

No new dependencies.
