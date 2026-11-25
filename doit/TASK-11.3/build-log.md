# TASK-11.3 build log

## BUILD
- First step (spec §5): added `players` to `cashPool`/`sitAndGoPool` (default 6, same as `DEFAULT_SEATS.length`). A throwaway probe confirmed `sitAndGoPool(10, 2)` and `cashPool($4/$8, 10, 9)` records pass `parseHandRecord` (after a JSON round trip) with `seats.length` 2 and 9; probe deleted.
- `src/stats/trends.ts`: `G2_BASELINE_HANDS`, `G2_CAPTION`, `g2Target`, `StatisticsView.g2Target`, `statisticsView(data, all = data)`, `chartLabel(points, target?)`.
- `StatisticsScreen.tsx`: caption + `line.stats-target`, yMax includes the target. A throwaway test rendered HEAD's `StatisticsScreen` and the new one for a null-target view: identical markup; deleted.
- `styles.css`: `.stats-target` added to the break-even stroke rule.
- Tests: `tests/stats/g2-target.acceptance.test.tsx` (AC#1–AC#5, 24 real played hands in pools + one forced fold), `tests/stats/trends.test.ts` (two `g2Target: null` edits + SPEC-06 case), `e2e/statistics-target.spec.ts`.
- Docs: `docs/stats/trends.md` G-2 section.
- Runs: `npx vitest run tests/stats/g2-target.acceptance.test.tsx` 5/5; `tests/stats/trends.test.ts` 5/5; `npm run lint` clean; `npm run typecheck` clean; `npm test` 296 files passed, 5 skipped; 1361 tests passed, 46 skipped; coverage all files 93.77% lines, `src/stats/trends.ts` 100% lines; `npm run build && npx playwright test e2e/statistics.spec.ts e2e/statistics-bb100.spec.ts e2e/play-money.spec.ts e2e/statistics-target.spec.ts` 14 passed (Chromium + WebKit, axe).
- No locked test edited.
