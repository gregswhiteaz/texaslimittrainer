# TASK-11.2 changes

## Source
- `src/stats/trends.ts` — `CashSummary`, optional `TrendHand.cash` (set by `trendHand` for cash records), optional cash fields on `TrendSource`, `bb100Value` (exact lcm-based group value, report rounding), `bb100Points`, `Bb100Point`/`Bb100Chart`, `StatisticsView.bb100`, `NO_CASH_MESSAGE`, `BB100_TITLE`, `BB100_GOAL`, `BB100_NOTE`, `moreCashHandsMessage`, `bb100PointLabel`, `bb100ChartLabel`; `orderHands` runs at most once per view.
- `src/table/review.ts` — `netResult` parameter widened to `Pick<CompletedHand, 'userSeat' | 'result' | 'actions'>` (no behaviour change).
- `src/ui/stats/StatisticsScreen.tsx` — second chart card "Big bets won per 100 hands" (messages, or goal caption + SVG with dashed break-even line, points, note); x-position helper `xOf` shared with the Major chart.
- `src/ui/styles.css` — `.stats-bb100-message`, `.stats-goal`, `.stats-break-even`.

## Tests
- `tests/support/stat-records.ts` — `cashPool`, `sitAndGoPool` (really played hands via `playSession` + `handWrite`), `cloneRecords`; session-record building shared by `statRecords` and `cloneRecords`.
- `tests/stats/bb100.acceptance.test.tsx` — new: AC#1–AC#7 (SPEC-01..SPEC-07).
- `tests/stats/trends.test.ts` — D-3 edit (`bb100: { kind: 'no-cash' }` in the empty view) and the SPEC-08 unit case.
- `tests/storage/trend-data.test.ts` — SPEC-09 case: `trendData()` carries cash summaries.
- `e2e/statistics-bb100.spec.ts` — new Playwright flow (SPEC-10), Chromium + WebKit, axe, same-origin.

## Docs
- `docs/stats/trends.md` — BB/100 section (formula, worked example, cash-only grouping, messages, break-even line) and test list.

No new dependencies.
