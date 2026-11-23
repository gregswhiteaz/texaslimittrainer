# Build log — TASK-7.8

## BUILD (round 1) — stopped with blocked.json

### What was done
- Value rules `value-bet` / `value-raise` in `src/advice/postflop.ts` (D-1 order, rounded `> 50.0` comparison,
  A-4 raise when only a raise is offered, A-5 fallback chain for the calling-range run, A-7 whole-range number
  when that chain still throws `RangeError`); `equityVsCallingRangePct` on every recommendation.
- `callingRange` + `CONTINUE_CLASSES` (memo per board, D-5); `equityWithBudget` / `EquityBudget`;
  `BOT_EQUITY` / `BOT_EQUITY_BUDGET` = `{ exactLimit: 2_500, trials: 500 }` (no need to lower trials, A-8).
- `FREE_CHECK_EQUITY` and every free-check branch removed from the four bots.
- Output-identical speed-ups (same SHA before/after each, see below): streaming `deriveSeed`
  (= `fnv1a32(canonicalKey(c))`, unit-tested), typed-array dedupe and sort skip in `canonicalise`, typed arrays in
  the sampler setup, no deck rebuild per river deal in `exactEquity`, bit-mask `hasOpenEnder`.
- Docs: `docs/advice/postflop-rules.md` (two rules, worked example, definitions, bot budget note).
- Tests: new `tests/advice/value-bet.acceptance.test.ts` (AC#1–AC#11); unit tests per rule and for
  `callingRange` / `equityWithBudget`; unlocked and Q-3 locked re-pins listed in `changes.md`.
- No timing calls added under `src/advice`.

### Measurements (local, Apple-silicon Mac)
- `npm run -s playtest -- --hands 10000 --seed 42`: `Invariant violations: 0`, **14.20 s / 14.28 s** wall
  (two runs; 23.5 s before the speed-ups, 0.8 s before this task).
  New stdout SHA-256: `2cbbafa79dfeb56a159349b949039132b89cb0e41e72a83784e579653ae4bb98`
  (old `442dbf55…08fbc` retires). Deterministic across runs.
- `npm run -s playtest:million -- --hands 900`: exit 0, `Result: PASS`, 0.66 s / 0.67 s wall; stdout SHA-256
  `4ff1725659ddc73674e845b3d72c20f70a31c767a196f25267ae795dcc1e2d32` both runs (old `fee5dbb1…` retires).
  `--hands 9000`: 2.44 s wall, 20.7 s CPU → ≈2.3 ms CPU/hand over sizes 2–10, so 1,000,000 hands ≈ 38 min CPU
  ≈ 4.3 min per shard over 9 shards (well under 9 × 20 min).
- `tests/advice/postflop.perf.test.ts` (user advice now runs two equity passes): passes; p95 HU flop 23.4 ms,
  6-max vs 3 20.5 ms, 10-seat vs 9 203 ms (target 100 ms × 20 slack), actions-mode 21.7 / 25.5 ms.
- Unit tests, alone, no coverage (slowest): `calling-station.test` 3.6 s (1,000 hands, A-6),
  `postflop-ranges.test` 3.5 s, `cli.test` 1.7 s, `rock.test` 1.4 s, `invariants.perf.test` 0.8 s.
- Slowest every-push acceptance files, alone, no coverage: `tag-playtest.acceptance` AC#5 57.2 s,
  `heads-up.acceptance` AC#4 38.5 s (+ AC#5 18.3 s), `games.acceptance` AC#7 31.5 s (+ AC#6 15.4 s),
  `invariants.acceptance` AC#1 21.5 s, `maniac.acceptance` 9.8 s / 9.5 s per test.
- Coverage cost: `invariants.acceptance` AC#1 alone **21.5 s without coverage, 99.4 s with `--coverage`**.

### Commands and results
- `npx vitest run tests/...` per file while re-pinning: all touched files green.
- `npm run lint`: clean. `npm run typecheck`: clean. `npm run format`: run.
- `npm test` (full, with coverage): **4 failed | 727 passed | 14 skipped (745)**; 195 of 201 files passed. The four
  failures are 120 s timeouts of locked 10,000-hand runs under coverage + full-suite load:
  `tag-playtest.acceptance` AC#5 (259.5 s), `games.acceptance` AC#7 (183.2 s), `heads-up.acceptance` AC#4
  (159.0 s), `invariants.acceptance` AC#1 (153.4 s). Near the limit in the same run: `runner.acceptance`
  (107.0 s), `bot-results.acceptance` (101.9 s), `playtest.acceptance` (76.5 s).
- Not changeable within the BUILD rules (locked files, timing failure, not a re-pin) → `blocked.json`.

### Notes on re-pins that are not plain value changes
- `calling-station.acceptance` (TASK-6.3): Example A and the worker test now use `raise[1]`, which is the same
  SB AQo view with every pinned value unchanged (seed 3757549955, draw 1339328068, call 2 / raise 8);
  `raise[0]` is now a river value raise where the station has no deviation. Point 0 re-pinned to measured values.
- `maniac.acceptance` (TASK-6.4): Example E uses `check[2]` (the JTo big-blind option) with its new code, seed and
  draw; `check[7]` is now a turn spot.
- `invariants.perf.test` (unlocked): timed runs use random-move seats, so the per-action checker cost is not
  swamped by bot equity work (10k-hand TAG runs took 16 s each and timed out under load).
- `cli.test` (unlocked): the defaults-equality run uses 300 hands; the 10,000 default is still pinned by
  `parseArgs([])`.

## BUILD (continue) after Block 1 — D-7 applied
- Seven unlocked files split: the 10,000-hand version (2,000 in `bot-results`) runs only under `TLH_SLOW_TESTS=1` via
  `it.runIf(SLOW)` with its original title, assertions and limits; an every-push version runs the same assertions on
  1,000 hands. Re-pinned values: `Options`/`Hands played` lines, `--hands` args, `toBe(hands)` counts, the bot-row
  regex hand count, games AC#8 CLI `Last replay code` (`…000003e8`). Nothing dropped, no limit changed.
- One exception, stated in a comment: games AC#6's in-process mostly-random sit-and-go run stays at 10,000 hands in
  both versions. Seed 42's first sit-and-go ends at hand 4,740, so at 1,000 hands `completed >= 1` fails; that run
  takes about 0.8 s, and only the TAG CLI run scales with the hand count.
- heads-up AC#5 (default 10,000-hand CLI) also split; the every-push version passes `--hands 1000`. The 10,000 default
  is still pinned by `cli.test` `parseArgs([])`.
- `package.json` `test:slow` lists the seven files.
- `npm run format`: run. `npm run lint`, `npm run typecheck`: clean.
- `npm test` (full, coverage): **199 files passed, 2 skipped; 731 tests passed, 27 skipped; exit 0; 147.5 s wall.**
  Slowest files (summed test time): `maniac.acceptance` 147.0 s (largest single test 47.5 s), `bot-results.acceptance`
  121.1 s (largest 58.1 s), `calling-station.acceptance` 71.2 s, `games.acceptance` 64.5 s, `style-bots.acceptance`
  52.3 s, `invariants.acceptance` 51.1 s (AC#1 50.7 s), `all-sizes.acceptance` 49.1 s, `tag-mixing.acceptance` 44.3 s,
  `playtest.acceptance` 38.5 s, `runner.acceptance` 38.4 s. No single test is over 60 s; the limit is 120 s.
- `TLH_SLOW_TESTS=1 npx vitest run <seven files>` (no coverage): **39/39 passed, 74.0 s wall.** Slow versions:
  tag-playtest AC#5 64.3 s; heads-up AC#4 43.7 s, AC#5 20.7 s; playtest AC#3 42.7 s, AC#1 15.8 s; games AC#7 36.4 s,
  AC#6 16.9 s; invariants AC#1 24.0 s; bot-results determinism 19.6 s, rows 8.1 s, replacement 5.9 s; runner AC#6 17.6 s.

## FIX (code review R1)
1. Fixed: `calling-station.acceptance` adds D-5 point 6 (code `…0007`, preflop HJ 77 unopened, seed 1806309033, draw 3382865500 ≈ 0.79 >= 0.6); station and TAG both raise to 8. Values measured with a temporary probe (deleted). All existing assertions kept.
2. Fixed: `games.acceptance` every-push AC#6 title now ends "(10,000-hand in-process run, 1,000-hand CLI run)" (new `sngSuffix`); the in-process 10k sng run is memoized in `sngInProcess()` and shared by both versions. No assertion changed.
- `npm run format` run; lint and typecheck clean. Two files: 10 passed, 3 skipped; `TLH_SLOW_TESTS=1` games: 7/7 passed. Full `npm test`: 199 files passed, 2 skipped; 731 tests passed, 27 skipped; exit 0.
