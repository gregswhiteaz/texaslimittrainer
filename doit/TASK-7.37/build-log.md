# Build log: TASK-7.37

## BUILD

- `src/bots/tag.ts`: `TAG_SHORT_HANDED_SEATS`, `TAG_SHORT_HANDED_CHART` (derived from `SIX_MAX_CHART`, BTN/SB unopened
  cells = CO unopened cells, other spots `===`), `tagChartFor`; `decideTag` passes the chart preflop at 3–4 dealt-in
  seats unless `options.chart` is given.
- `src/playtest/style-check.ts`: mixed-spot tally uses `tagChartFor` on preflop views.
- `src/bots/styles/tag.json`: description sentence (A-3).
- Tests: `tests/bots/tag-short-handed.acceptance.test.ts` (SPEC-01..03, 3 passed),
  `tests/playtest/style-check-short-handed.test.ts` (SPEC-05 plus a check that the 6-max chart tallies differently,
  2 passed), `tests/bots/tag-short-handed-playtest.acceptance.test.ts` (SPEC-04, added to `test:slow`).
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/tag-short-handed-playtest.acceptance.test.ts`: 2 passed (177 s).
- SPEC-07 against a `735e6cd` worktree: `cmp` same for `--size 2, 5, 6, 7, 9` (2000 hands, seed 42) and for
  `--size 6 --lineup mixed --check-styles` (output and exit code); `git diff 735e6cd -- src/advice` empty.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npm test`: 341 files passed, 1 failed, 10 skipped; 1526 tests passed, 1 failed, 59 skipped. The failure is
  `tests/playtest/summary.acceptance.test.ts > Largest pot is the largest per-hand sum of award amounts`
  (142 vs 140): its fixture is 4-seat hand 1 (seed 42), which now ends `4:fold 1:fold 2:fold` with 2 chips returned
  to the BB. Locked test not edited; see `blocked.json`.
- e2e not run (blocked on SPEC-08).

### Before/after (all-TAG cash, seed 42, every seat)

| Size (hands)            | VPIP  | PFR   | Aggression | WTSD  | W$SD  |
| ----------------------- | ----- | ----- | ---------- | ----- | ----- |
| 3 seats 10,000, before  | 31.0  | 21.9  | 65.8       | 40.9  | 52.8  |
| 3 seats 10,000, after   | 23.7  | 17.3  | 65.1       | 40.2  | 52.0  |
| 3 seats 100,000, before | 31.1  | 22.0  | 65.9       | 41.7  | 52.7  |
| 3 seats 100,000, after  | 23.6  | 17.3  | 65.2       | 41.7  | 52.4  |
| 4 seats 10,000, before  | 27.9  | 20.1  | 65.0       | 42.5  | 51.7  |
| 4 seats 10,000, after   | 23.6  | 17.5  | 64.5       | 43.6  | 51.3  |
| 4 seats 100,000, before | 28.1  | 20.4  | 65.2       | 41.5  | 52.2  |
| 4 seats 100,000, after  | 23.9  | 17.7  | 64.7       | 41.7  | 51.9  |
| 6-max healthy           | 20–28 | 14–22 | 50–66      | 30–42 | 47–57 |

## BUILD (continue after Q-1)

- SPEC-08 blocker resolved by Q-1 option (a): `tests/playtest/summary.acceptance.test.ts` `withAwards` now copies the result with `awards` and deletes the optional `returned` field (destructuring tripped no-unused-vars). No assertion changed.
- `npx vitest run tests/playtest/summary.acceptance.test.ts`: 2 passed; eslint clean.
