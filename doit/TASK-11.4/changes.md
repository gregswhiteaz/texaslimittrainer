# TASK-11.4 changes

## Source
- `src/stats/trends.ts` — `dealtIn` on `TrendSource` (`seats`) / `TrendHand` / `trendHand`; `TableSizeFilter`, `GameTypeFilter`, `TrendFilter`, `ALL_TRENDS`, `TABLE_SIZE_LABEL`, `GAME_TYPE_LABEL`, `TABLE_SIZE_OPTIONS`, `GAME_TYPE_OPTIONS`, `filterTrendData(data, filter)` (session size = largest `dealtIn` through `referenceSizeOf`; game type by `cash`; returns `data` for All / All).
- `src/ui/stats/StatisticsScreen.tsx` — the `.stats-filters` row with the labelled "Table size" and "Game type" selects, shown only for a loaded view; optional `filter` (default `ALL_TRENDS`) and `onFilterChange` props.
- `src/ui/App.tsx` — the stats screen state carries `data` and `filter`; a filter change recomputes `statisticsView(filterTrendData(data, filter), data)`; every opening starts at All / All.
- `src/ui/styles.css` — `.stats-filters` row and label rules; its selects share the Game Config select rule (44px).

## Tests
- `tests/stats/trend-filters.acceptance.test.tsx` — new: AC#1–AC#8 (SPEC-01..SPEC-08) at module and renderToString level; trend hands cloned from small real pools, fed in reverse order.
- `tests/stats/trends.test.ts` — new `trend filters` case (SPEC-09).
- `e2e/statistics-filters.spec.ts` — new Playwright flow (SPEC-10), Chromium + WebKit, axe, same-origin.

## Docs
- `docs/stats/trends.md` — `dealtIn` field, filters section, test list.

No new dependencies.
