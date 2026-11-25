# TASK-11.1 changes

## Source
- `src/stats/trends.ts` — new, headless: `TrendHand`/`TrendSource`/`TrendData`/`TrendReader` types, `trendHand`, `orderHands`, `majorErrorPoints`, `statisticsView`, `countText`, `totalsLine`, `moreHandsMessage`, `pointLabel`, `chartLabel` and the screen's fixed texts.
- `src/storage/hand-store.ts` — `trendData()` on the opened store: one read-only transaction, two `getAll`s, invalid values skipped (A-3); return types gain `TrendReader`.
- `src/ui/stats/StatisticsScreen.tsx` — new Statistics screen: "← Home", focused h1, totals line, chart card (message, or SVG polyline + circle points with titles, note), loading and failure states.
- `src/ui/home/HomeScreen.tsx` — optional `onStatistics` prop and the Statistics menu entry (A-4).
- `src/ui/App.tsx` — `stats` screen, the read effect after `tableWritesSettled()` (cancelled on leave), Home ↔ Statistics wiring.
- `src/ui/styles.css` — `.stats-*` styles from the storyboard.
- `e2e/support/screen-list.ts` — registers `{ id: 'statistics', kind: 'screen', route: 'stats' }`.
- `package.json` — adds `tests/storage/trend-data-3000.acceptance.test.ts` to `test:slow` and `e2e/statistics-speed.spec.ts` to `e2e:slow`. No new dependency.

## Tests
- `tests/support/stat-records.ts` — new fixture builder (no test-runner imports): `statRecords`, `nineSessions`, `mixedGrades`, `forcedFoldRecord`.
- `tests/stats/trends.test.ts` — new unit tests (SPEC-13).
- `tests/stats/trends.acceptance.test.ts` — new (SPEC-04, SPEC-05, SPEC-06).
- `tests/stats/trend-view.acceptance.test.tsx` — new (SPEC-03, 3,000 in-memory records).
- `tests/storage/trend-data.test.ts` — new (SPEC-14).
- `tests/storage/trend-data-3000.acceptance.test.ts` — new, opt-in `TLH_SLOW_TESTS=1` (SPEC-20).
- `tests/ui/statistics.acceptance.test.tsx` — new (SPEC-07, SPEC-08, SPEC-09, SPEC-15).
- `tests/ui/home-statistics.acceptance.test.tsx` — new (SPEC-02).
- `e2e/statistics.spec.ts` — new (SPEC-01, SPEC-10).
- `e2e/statistics-speed.spec.ts` — new, opt-in `TLH_SLOW_TESTS=1` (SPEC-16).
- `e2e/home.spec.ts` — locked edit (D-4, TASK-2.1): Main menu count 1 → 2, plus a Statistics-visible check.
- `tests/ui/screen-list.acceptance.test.ts` — locked edit (D-4, TASK-2.15): routes gain `stats`.
- `e2e/play-money.spec.ts` — locked edit (D-4, TASK-2.15/TASK-10.2): visits Statistics from Home and returns.
- `tests/ui/play-money.test.ts` — TASK-2.15 unit test (not hook-locked): its fixture copy of App's Screen union gains the `stats` route, which the real SCREEN_LIST now names; the "unlisted screen" case now uses `settings` instead of `stats`. Every check kept.

## Docs
- `docs/stats/trends.md` — new: ordering, grouping, value rule, texts, tests and the speed check.
- `docs/ui/navigation.md` — the Statistics screen and its Home entry.

## Pending (blocked.json)
- `e2e/resume.spec.ts` (locked by TASK-2.6, not in Q-4) still expects 1 / 2 Main-menu buttons; not edited.
- `e2e/resume.spec.ts` — Home menu counts 1->2 and 2->3, plus Statistics-last checks (TASK-2.6 locked; unlocked; orchestrator edit, Block 1)
