## BUILD (2026-11-25)
- Added the line-up filter to `TrendFilter`/`filterTrendData` and `trendHand`, the Line-up select on StatisticsScreen, the storyboard select and the docs section. No App change.
- Tests: new `tests/stats/trend-lineup.acceptance.test.tsx` (5 tests, ~0.2 s), new unit case in `tests/stats/trends.test.ts`, new `e2e/statistics-lineup.spec.ts`.
- `npm run lint`: clean. `npm run typecheck`: clean.
- `npm test`: 300 files passed / 5 skipped; 1389 tests passed / 46 skipped. Coverage 93.67% statements overall; `src/stats/trends.ts` 100% lines.
- `npm run build && npx playwright test e2e/statistics*.spec.ts e2e/play-money.spec.ts e2e/report-navigation.spec.ts`: 26 passed, 2 skipped (opt-in speed spec), Chromium and WebKit, axe included.
