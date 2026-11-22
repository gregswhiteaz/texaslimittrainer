# TASK-6.15 changes

- `src/playtest/runner.ts` — `PLAYTEST_USER_SEAT`; `HandSetup.userPolicy` (applied to seat 1 in `playHand`) and `PlaytestOptions.userPolicy` (passed to every hand's setup by `runPlaytest`) — recorded deviation from D-1 per fix-brief (not a `PlaytestSeams` key); exported `recordStacks` (moved from cli.ts); `replayWithBots`.
- `src/playtest/policy.ts` — `scriptedPolicy(actions, then?)`.
- `src/playtest/cli.ts` — imports `recordStacks` from the runner; local copy and unused `HandRecord` import removed.
- `tests/playtest/bot-replay.acceptance.test.ts` — new: SPEC-01, SPEC-02, SPEC-03 (AC#1–#3). The 1,000-hand SPEC-01/02 runs are opt-in (`TLH_SLOW_TESTS=1`); every push runs 100-hand versions with the same assertions plus SPEC-03 (recorded deviation from spec §9, fix-brief option (a)).
- `package.json` — adds `tests/playtest/bot-replay.acceptance.test.ts` to the `test:slow` script.
- `tests/playtest/runner.test.ts` — unit tests: `userPolicy replaces only seat 1's policy` (SPEC-04), `replayWithBots replays the record's table and reports a diverged user script` (SPEC-06).
- `tests/playtest/policy.test.ts` — unit test: `scriptedPolicy returns recorded actions in order, then falls back or throws` (SPEC-05).
- `doit/TASK-6.15/blocked-1.resolved.json`, `doit/TASK-6.15/blocked-2.resolved.json` — the two blocker reports (seam key; §9 speed), resolved in fix-brief.md.

No new dependencies.
