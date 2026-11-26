# TASK-7.18 build log

## BUILD (2026-11-25)

What I did: D-1 sampler loop (generation stamps, picks copied on acceptance, xoshiro128** state in locals with
both draws inlined — a shared closure over the state made it context-allocated and cost ~10 ms on the full ring),
D-2 early abort (`rejectionsOverBudget`, z = 8, every 8,192 rejections), D-3 15 warm-ups in both perf files, new
SLOW-gated nothing-owed 9-opponent value-bet advice scenario, removed the global `testTimeout`, one
`vi.setConfig({ testTimeout: 30_000 })` line in each of the 42 §10 files, `test:slow` + README.

### Pinned base values (src identical to base: `git diff --stat 6622918 HEAD -- src tools tests package.json vite.config.ts` empty)
- SPEC-05: the new test `sampled results are byte-identical to the pre-TASK-7.18 sampler` was written and run
  (`npx vitest run tests/advice/equity.test.ts -t "byte-identical"`) before any src edit; base SHA-256 of
  `JSON.stringify(results)` = `fd3c9bf34e17bddbacd0404432f8901b42187bcd53d6b8b90bc06515ed859daa`. Pinned in the test;
  passes after the change.
- SPEC-07: `npm run playtest 2>/dev/null | shasum -a 256` at base =
  `acd5b1730813484d0775118e995ba2a7912f49b7b767a0e2e6926a702a4b3679`.

### Perf: before (base, 1 warm-up) vs after (D-1 + D-2 + 15 warm-ups), CPU-time p95 ms, three passes each, nothing else running
`EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts` and
`[TLH_SLOW_TESTS=1] ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts`:

| Scenario | Target | Before p1 / p2 / p3 | After p1 / p2 / p3 |
|---|---|---|---|
| HU preflop hand vs hand | 15 | 5.21 / 5.46 / 5.45 | 5.25 / 5.27 / 5.25 |
| HU flop hand vs hand | 2 | 0.62 / 0.25 / 0.65 | 0.14 / 0.14 / 0.14 |
| HU flop vs every unseen combo | 20 | 12.56 / 15.94 / 12.41 | 4.78 / 4.77 / 4.60 |
| HU turn vs every unseen combo | 15 | 6.62 / 6.49 / 6.48 | 6.47 / 6.05 / 6.16 |
| Three-way preflop AA vs KK vs QQ | 20 | 8.18 / 8.31 / 8.14 | 7.58 / 7.74 / 7.53 |
| 6-max preflop vs 5 ranges | 50 | 17.49 / 17.55 / 17.55 | 16.03 / 16.19 / 16.02 |
| Full ring flop vs 9 ranges | 80 | 73.36 / 73.34 / 73.16 | 51.95 / 52.22 / 52.32 |
| Advice: HU flop facing a bet | 25 | 23.10 / 23.81 / 24.54 | 21.37 / 13.30 / 13.63 |
| Advice: 6-max flop vs 3 opponents | 50 | 21.59 / 20.96 / 20.88 | 19.39 / 19.04 / 19.78 |
| Advice: 10-seat flop vs 9 opponents (AC#3) | 100 | 206.88 / 208.40 / 206.96 (FAIL) | 53.26 / 53.54 / 53.97 |
| Advice: 10-seat flop checked to the SB vs 9 (AC#4, new) | 100 | n/a (new) | 53.15 / 53.52 / 53.12 |
| Advice actions: 6-max facing a bet, one opponent | 25 | 22.06 / 22.42 / 22.32 | 19.69 / 19.56 / 20.18 |
| Advice actions: 6-max flop vs 3 opponents | 50 | 25.78 / 25.90 / 26.28 | 23.07 / 23.49 / 23.19 |

Note: an intermediate version with a shared `nextInt` closure measured full ring 66–68 ms (the closure made the
state context-allocated); inlining both draws brought it to ~52 ms. A single merged range buffer was tried and
was slower (69 ms), so it was dropped.

### Verification runs (after the change)
- SPEC-01: `for i in 1 2 3; do EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts || exit 1; done`
  → 3/3 passed; full ring 52.44 / 52.64 / 52.71 ms (≤ 60), HU flop vs every combo 4.68 / 4.66 / 4.66 (≤ 15).
- SPEC-03: `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts` ×3 → `10-seat flop vs 9
  opponents` p95 53.54 / 53.36 / 54.92 ms (≤ 75), 2 passed | 1 skipped each.
- SPEC-04: `TLH_SLOW_TESTS=1 ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t "value-bet
  postflop advice latency"` → passed, p95 52.32 ms; without `TLH_SLOW_TESTS` it is skipped.
- SPEC-05/06: `npx vitest run tests/advice/equity.test.ts` → 11 passed (hash equals base).
- SPEC-07: `npm run playtest 2>/dev/null | shasum -a 256` → `acd5b173…b3679`, equal to base.
  `npx vitest run tests/golden tests/advice/value-bet.acceptance.test.ts tests/advice/determinism.acceptance.test.ts
  tests/advice/equity.acceptance.test.ts` → 8 files, 301 passed.
- SPEC-02: `grep testTimeout vite.config.ts` → none; files with the `vi.setConfig` line → 42.
- A-5 re-check: `npx vitest run --coverage --testTimeout=1000` after the change → 315 files passed | 5 skipped,
  1422 tests passed | 47 skipped: no file outside §10 exceeds 1,000 ms, so the set is unchanged.
- `npm test` (coverage, no global timeout) → 315 files passed | 5 skipped; 1422 passed | 47 skipped; 190 s;
  All files 92.73% statements.
- `npm run test:slow` (full, now 21 files incl. `postflop.perf.test.ts`) → 21 files, 99 passed, 1150 s.
- `npm run lint` → clean; `npm run typecheck` → clean; `npm run format` run.
- No blocked.json: 9-opponent advice is ~54 ms, under 75 ms.
