## BUILD (2026-11-26)
- Added `filteredStatisticsView` and `filterOption` to `src/stats/trends.ts`. Split App's `stats` state into loading/failed and loaded members (no `;` in the union comment), and removed both `data === undefined` guards. The StatisticsScreen filter handlers use `filterOption`.
- Test support: removed `TEMPLATE_DECISIONS`, added `shuffled`, and added a new `tests/support/time-zone.ts` (`pinTimeZone`). Pinned `Pacific/Kiritimati` in `trends.test.ts` and in the locked `trend-grouping.acceptance.test.tsx` (import plus one call only).
- New tests: `tests/stats/trend-order.acceptance.test.tsx` (AC#1, AC#2), 3 unit cases in `trends.test.ts` (SPEC-06/08/10), and `e2e/statistics-hardening.spec.ts` (SPEC-05/07). The speed check now uses the A-6 visibility stop.
- `TZ=UTC npx vitest run tests/stats/trend-grouping.acceptance.test.tsx tests/stats/trends.test.ts`: 25 passed. SPEC-11 mutation (UTC getters in `localDay`): 4 failed (3 in trend-grouping, 1 in trends.test), then reverted.
- `npm test`: 331 files passed, 9 skipped. 1483 tests passed, 56 skipped. Coverage thresholds met.
- `npm run lint`, `npm run typecheck`, `npm run format` and `npm run build`: pass.
- Statistics e2e (hardening, filters, target, grouping, lineup, statistics, speed): 16 passed, 2 skipped (speed, opt-in). `TLH_SLOW_TESTS=1` speed: 2 passed.
- `npm run e2e`: 401 passed, 19 skipped.
- SPEC-03 grep: no `TEMPLATE_DECISIONS` match. SPEC-09 grep: none found, and the screen-list acceptance test passes.
