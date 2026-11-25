# TASK-11.4 build log

## BUILD
- `src/stats/trends.ts`: `dealtIn` from `record.seats.length` in `trendHand`; filter types, labels, option lists and `filterTrendData` (session size = max `dealtIn`, through `referenceSizeOf`, guarded to 2–10 so it never throws).
- `StatisticsScreen.tsx`: `.stats-filters` row (labelled controlled selects) only for a loaded view; optional `filter`/`onFilterChange`.
- `App.tsx`: stats state `{ view, data?, filter }`; filter change recomputes `statisticsView(filterTrendData(data, f), data)`. A first wording of the Screen-type comment contained a `;`, which the locked `tests/ui/screen-list.acceptance.test.ts` parser treats as the end of the type; reworded (no test change).
- `styles.css`: `.stats-filters` rules; selects join the Game Config select rule.
- Tests: `tests/stats/trend-filters.acceptance.test.tsx` (AC#1–AC#8; pools of 3 real hands each reduced once to `TrendHand`s, cloned; input reversed so it is not chronological), `tests/stats/trends.test.ts` SPEC-09 case, `e2e/statistics-filters.spec.ts`.
- Docs: `docs/stats/trends.md` filters section.
- Runs: `npx vitest run tests/stats/trend-filters.acceptance.test.tsx` 8/8 in 1.2 s; `tests/stats/trends.test.ts` 6/6; `npm run lint` clean; `npm run typecheck` clean; `npm test` 297 files passed, 5 skipped; 1370 tests passed, 46 skipped; all files 93.69% lines, `src/stats/trends.ts` 100% lines; `npm run build && npx playwright test e2e/statistics.spec.ts e2e/statistics-bb100.spec.ts e2e/statistics-target.spec.ts e2e/play-money.spec.ts e2e/statistics-filters.spec.ts` 16 passed (Chromium + WebKit, axe).
- No locked test edited.
