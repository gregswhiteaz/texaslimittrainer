## BUILD (2026-11-25)

- Implemented grouping in `src/stats/trends.ts` (default path untouched), the Group by select in `StatisticsScreen`, App state wiring, storyboard fix, docs section.
- Tests: new `tests/stats/trend-grouping.acceptance.test.tsx` (9 tests, ~1.9 s), 2 new cases in `tests/stats/trends.test.ts`, new `e2e/statistics-grouping.spec.ts`.
- `npx vitest run tests/stats/trend-grouping.acceptance.test.tsx` → 9 passed. `npx vitest run tests/stats/trends.test.ts` → 8 passed.
- `npm test` → 298 files passed / 5 skipped, 1381 tests passed / 46 skipped; coverage lines 94.02% overall, `src/stats/trends.ts` 100% lines.
- `npm run lint` → clean. `npm run typecheck` → clean.
- `npm run build && npx playwright test e2e/statistics.spec.ts e2e/statistics-bb100.spec.ts e2e/statistics-target.spec.ts e2e/statistics-filters.spec.ts e2e/play-money.spec.ts e2e/statistics-grouping.spec.ts` → 18 passed (Chromium + WebKit, axe included).
- Diff is ~980 changed lines vs budget 760 (warn band); about 650 of them are tests.
