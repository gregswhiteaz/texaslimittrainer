## BUILD (2026-11-19)
- Extended `tools/lint/headless-boundary.js` with `LINT_ONLY_HEADLESS_DIRS` (playtest, table); `HEADLESS_DIRS` and coverage glob unchanged (D-1).
- Added `tests/playtest/summary.acceptance.test.ts` (SPEC-01, SPEC-02), `tests/toolchain/headless-lint-dirs.acceptance.test.ts` (SPEC-04, SPEC-05), unit test in `tests/playtest/runner.test.ts` (SPEC-03); removed TASK-3.1 SPEC-10 test and `readFileSync` import from `tests/table/session.test.ts` (SPEC-06); README bullet updated.
- Mutation check (source restored after each): `largestPot = pot`, `sum + award.pot`, `makePolicy` per decision — each fails the new tests.
- `npm run format` ok. `npm test`: 83 files, 302 passed, 3 skipped, exit 0. `npm run lint` 0. `npm run typecheck` 0. SPEC-06 grep: no matches.
- `npm run playtest -- --hands 20 --seed 42 --size 4` prints `Largest pot: $152`.
