## BUILD (TASK-6.31)
- Unlocked `tests/playtest/check-styles.acceptance.test.ts` under TASK-6.11 and TASK-6.25 and `tests/playtest/check-styles-three-seats.acceptance.test.ts` under TASK-7.46 (reason: TASK-6.31 approved re-pin, task ACs #3/#4).
- Implemented `MIN_JUDGED_DECISIONS` and the `Not judged` lines in `formatStyleReport`; usage text; unit test; fast re-pin 300 -> 1000; three-seats exit 0 assertions; new not-judged acceptance test; docs.
- New acceptance test fails on the pre-change `style-check.ts` (1 failed) and passes after (1 passed).
- `npx vitest run` style-check, cli, check-styles acceptance: 21 passed, 6 skipped.
- `npm test`: 358 files passed / 11 skipped; 1590 tests passed, 60 skipped. `npm run lint` clean, `npm run typecheck` clean, `npm run format` run.
- `npm run -s playtest -- --help | grep -F ...` matches; `git diff --exit-code main -- src/bots src/advice src/engine src/stats` empty.
- Slow: `TLH_SLOW_TESTS=1 npx vitest run tests/playtest/check-styles-three-seats.acceptance.test.ts`: 1 passed (exit 0, Style check: passed, 74 s).
