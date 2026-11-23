## BUILD (TASK-7.9)
- `src/advice/ranges.ts`: exported `drawOuts` (flush draw = exactly 4 of a suit with a hole card → 9 unseen; OESD via the shared `openEnderStart` → 8 unseen of the two completing ranks, skipped when a straight is made; union, ascending; [] on a 5-card board). `hasOpenEnder` now delegates to `openEnderStart` (same windows, `classifyCombo` unchanged — existing ranges tests pass).
- `src/advice/postflop.ts`: `implied-odds-call` between `pot-odds-call` and `pot-odds-fold`; `impliedRequiredEquityPct` (A-2..A-5) and `outs` on every recommendation.
- Docs: draw/outs and implied required equity definitions, new rule section (AC#1/AC#3 example, Why), `pot-odds-fold` condition, "Not applied yet" updated.
- Tests: new `tests/advice/implied-odds.acceptance.test.ts` (6/6 pass, ~10 ms); `rule implied-odds-call` (6 tests) in `postflop.test.ts`; `drawOuts` (6 tests) in `ranges.test.ts`.
- Re-pins (Q-3), no assertion dropped: TASK-7.3 `postflop.acceptance` AC#1 (+`impliedRequiredEquityPct: 8.3`, `outs` 9 hearts), AC#2 hero Ad5c; TASK-7.8 `value-bet.acceptance` AC#9 (+2 keys, `implied-odds-call` branch in `expectedRule`). Unlocked `grade.test.ts`: stub 0.1 → 0.08, margin 6.7 → 8.7 (minor). AC#5 passes with the doc heading + unit describe. No other locked test failed.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean. `npm test`: 202 files passed, 3 skipped; 755 tests passed, 30 skipped; coverage thresholds held.
- `npm run -s playtest -- --hands 10000 --seed 42 | shasum -a 256` → `14d746f736d6afd3968e7ae7e833814d95dab94378c80c11dd59b1fd6ea72e48` (matches prototype; was `2cbbafa7…4bb98`), `Invariant violations: 0`, 14.4 s wall.
- `npm run playtest:million -- --hands 900 | shasum -a 256` → `4ff1725659ddc73674e845b3d72c20f70a31c767a196f25267ae795dcc1e2d32`; 9/9 shards, 900 hands, 0 violations, PASS, 0.7 s.
- `TLH_SLOW_TESTS=1 npx vitest run tests/bots/style-bands.acceptance.test.ts`: 3/3 passed (446 s). VPIP / PFR / AGG:

  | seed | TAG | Rock | Calling station | Maniac |
  |---|---|---|---|---|
  | 42 | 22.3 / 16.4 / 63.7 | 10.1 / 8.8 / 48.7 | 58.2 / 6.4 / 15.4 | 56.8 / 54.3 / 78.7 |
  | 7 | 22.3 / 16.4 / 63.7 | 10.1 / 8.7 / 46.8 | 59.4 / 7.0 / 14.5 | 56.3 / 53.7 / 77.7 |
  | 1234 | 22.2 / 16.3 / 63.5 | 10.0 / 8.6 / 46.8 | 60.4 / 6.8 / 15.9 | 56.5 / 53.4 / 79.6 |

- `npm run e2e`: 164 passed, 12 skipped.
- `doit.py gate TASK-7.9`: build #1 FAIL (changes.md backtick parsing), build #2 PASS (540 lines, 9 files).
