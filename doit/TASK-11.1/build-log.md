## BUILD (2026-11-25)

- Added `src/stats/trends.ts` (pure trend maths and texts), `trendData()` on the IndexedDB store, `StatisticsScreen`, the Home entry, the `stats` route and read effect in `App`, styles, the screen-list entry, the fixture builder `tests/support/stat-records.ts`, the tests named in the spec, the opt-in slow store and speed checks, and docs.
- Locked edits from Q-4: `e2e/home.spec.ts`, `tests/ui/screen-list.acceptance.test.ts`, `e2e/play-money.spec.ts`. Expected values updated, every check kept.
- I also updated `tests/ui/play-money.test.ts`, a TASK-2.15 unit test that isn't hook-locked. Its fixture copy of the Screen union now includes `stats`, because the real SCREEN_LIST names it. Every check is kept.
- Commands and results:
  - `npm test`: 294 files passed, 5 skipped. 1,346 tests passed, 46 skipped. Coverage thresholds met; `src/stats/trends.ts` is at 100% lines.
  - `npm run lint`: pass. `npm run typecheck`: pass.
  - `npm run build && npx playwright test`: 304 passed, 18 skipped, 6 failed. All 6 failures are in `e2e/resume.spec.ts` (3 tests × Chromium/WebKit) and come from Main-menu button counts at lines 151 and 176. Statistics, home, play-money (walk + axe) all pass in both browsers.
  - `TLH_SLOW_TESTS=1 npx playwright test e2e/statistics-speed.spec.ts`: 2 passed (Chromium, WebKit).
  - `TLH_SLOW_TESTS=1 npx vitest run tests/storage/trend-data-3000.acceptance.test.ts`: 1 passed (~0.5 s).
- Blocked: `e2e/resume.spec.ts` is locked by TASK-2.6 and isn't in Q-4. It must change for AC#1 / A-4. See `blocked.json`.
