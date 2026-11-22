## BUILD (2026-11-22) — BLOCKED
- Implemented the src slice: `userPolicy` seam + `PLAYTEST_USER_SEAT` + `recordStacks` (moved) + `replayWithBots` in runner.ts; `scriptedPolicy` in policy.ts; cli.ts imports `recordStacks`.
- `npm run typecheck`: 1 error, in locked tests/playtest/style-bots.acceptance.test.ts:187 (`Record<keyof PlaytestSeams, true>` pins exactly makePolicy/onAction/engine). Contradicts spec §3 "Locked tests: none needs an edit".
- Stopped per instructions; wrote blocked.json (options: approve locked-test edit, or move the seam off PlaytestSeams). Tests not yet written; test suite not run.

## BUILD continue (2026-11-22) — BLOCKED on §9 speed
- Reworked per fix-brief: `userPolicy` removed from `PlaytestSeams`; now `HandSetup.userPolicy` (read in `playHand`) and `PlaytestOptions.userPolicy` (runPlaytest spreads it into each hand's setup). `replayWithBots` passes it via HandSetup. `runPlaytest.length`/`playHand.length` unchanged.
- Wrote bot-replay.acceptance.test.ts (3 tests), 2 runner unit tests, 1 policy unit test.
- `npm run typecheck`, `npm run lint`, `npm run format`: clean.
- `npx vitest run tests/playtest/runner.test.ts tests/playtest/policy.test.ts`: 19 passed (new unit tests 204 ms, 1 ms, 0 ms).
- `npx vitest run tests/playtest/bot-replay.acceptance.test.ts`: 3 passed, 29.2 s (10.8 s / 15.5 s / 2.8 s).
- `npm test`: 179 files passed | 2 skipped; 635 tests passed | 11 skipped; coverage thresholds hold. Duration 168 s, of which bot-replay tests 73.0 s / 80.5 s / 14.3 s under coverage + parallel load.
- SPEC-07: default 10,000-hand SHA `442dbf55…8fbc` = main's (TASK-6.10 story doc); Mixed run `Invariant violations: 0`, exit 0.
- Cause: with seat 1 on random moves (A-2) the TAG bots face bets postflop far more often and each such decision runs the 30,000-trial equity sample (`src/advice/equity.ts:37`): runPlaytest 1,000 hands = 5.4 s with the userPolicy vs 0.06 s plain all-TAG; the replays cost the same again. Spec §9's "about 1 s per 1,000 hands" does not hold. Wrote blocked.json.

## BUILD continue 2 (2026-11-22) — speed block resolved with option (a)
- bot-replay.acceptance.test.ts: the exact-named 1,000-hand SPEC-01/02 tests run under `it.runIf(TLH_SLOW_TESTS=1)` (300 s limit); always-on 100-hand versions with the same assertions (user-hand floor and bot-action floor scaled: >= hands/10, >= hands). The Mixed recording is 250 hands always-on (1,000 when slow) so SPEC-03 still covers the same first 200 user-decision hands (the 200th is hand 203; a shorter run is a prefix of a longer one). Random user policy (A-2) kept.
- package.json: file added to `test:slow`.
- `npm run format`, `npm run lint`, `npm run typecheck`: clean.
- `npx vitest run tests/playtest/bot-replay.acceptance.test.ts`: 3 passed | 2 skipped, 7.1 s (1.0 s / 3.1 s / 2.8 s).
- `TLH_SLOW_TESTS=1 npx vitest run tests/playtest/bot-replay.acceptance.test.ts`: 5 passed, Duration 31.7 s (1,000 TAG 11.1 s, 100 TAG 1.0 s, 1,000 Mixed 15.7 s, 100 Mixed 1.0 s, SPEC-03 2.8 s).
- `npm test`: 179 files passed | 2 skipped; 635 tests passed | 13 skipped. Duration 79 s (was 168 s); bot-replay under coverage + parallel load 6.1 s / 23.5 s / 21.0 s.
- SPEC-07: default 10,000-hand SHA `442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc` (unchanged); `--lineup mixed` 10,000 hands `Invariant violations: 0`.
