## BUILD (TASK-11.2)
- First step (spec §5 builder): confirmed a real sit-and-go hand (`seatSession({ gameType: 'sit-and-go' })` → `playSession` → `handWrite`) parses with `gameType: 'sit-and-go'`, `level: 1` (temporary probe, deleted). Same probe found $10/$20 seed 3 rebuys by hand 17 (used for AC#4, 20 hands, `rebuys ≥ 1` asserted).
- Implemented `trendHand` cash summary, `bb100Value` (lcm, report `bbPer100`), `bb100Points`, `StatisticsView.bb100`, texts; second chart card with dashed break-even line; `netResult` type widened; CSS; fixtures `cashPool`/`sitAndGoPool`/`cloneRecords`; docs.
- Tests: `tests/stats/bb100.acceptance.test.tsx` (7), new unit case in `tests/stats/trends.test.ts` + D-3 edit, new case in `tests/storage/trend-data.test.ts`, `e2e/statistics-bb100.spec.ts`. Real hands played in the normal suite: 51 + 2 + 3 = 56.
- `npm test`: 295 files passed / 5 skipped; 1355 tests passed / 46 skipped; coverage all files 93.75% lines, stats 100% lines.
- `npm run lint`: clean. `npm run typecheck`: clean.
- `npm run build && npx playwright test e2e/statistics.spec.ts e2e/home.spec.ts e2e/play-money.spec.ts e2e/statistics-bb100.spec.ts`: 26 passed (Chromium + WebKit, axe clean).
- No locked test edited. Scope: 10 files; ~800 changed lines vs budget 750 (warn band).
