# Changes — TASK-1.6

- `src/playtest/policy.ts` — new: `seatGenerator` (per-seat Xoshiro128 from replay code + seat, D-2) and `randomMovePolicy` (M1 seeded random-move policy, no bet/raise at 4 bets, A-5).
- `src/playtest/runner.ts` — new: stakes/buy-in/cap constants, `handReplayCode` (D-2), `playHand` (stack reset, M1 violation counting, A-4), `summarize`, `runPlaytest` (button rotation A-2, O(1) memory), `replayHand` (A-8).
- `src/playtest/cli.ts` — new: `USAGE`, `parseArgs` (fixed error messages, no input echo), `formatReport`, `formatHand`, `main` (exit 0/1/2).
- `tools/playtest/main.ts` — new: process entry for `npm run playtest`.
- `tools/playtest/resolve-ts.js` — new: `module.registerHooks` resolve hook so Node type stripping loads extensionless relative imports as `.ts` (D-3).
- `package.json` — modified: `playtest` script; `engines.node` raised to `>=22.18.0` (A-7).
- `tests/playtest/playtest.acceptance.test.ts` — new: AC#1, AC#3, AC#4, AC#7 through spawned `npm run playtest` (SPEC-01, 04, 05, 09).
- `tests/playtest/runner.acceptance.test.ts` — new: AC#1, AC#2, AC#5, AC#6 in process (SPEC-02, 03, 06, 08).
- `tests/playtest/policy.test.ts` — new: SPEC-07 and policy unit tests.
- `tests/playtest/runner.test.ts` — new: SPEC-11, SPEC-12 and summary unit tests.
- `tests/playtest/cli.test.ts` — new: SPEC-10, SPEC-12 (`main` exit 1), SPEC-13.
- `doit/TASK-1.6/changes.md`, `doit/TASK-1.6/build-log.md` — work-folder records.

New dependencies: none.
