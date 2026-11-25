# TASK-6.19 build log

## BUILD
- Added `rememberShowdown`/`forgetSeats` to `src/engine/player-view.ts`; `runPlaytest` appends via `rememberShowdown` then `forgetSeats(showdowns, replaced)`.
- Tests: new `tests/playtest/earlier-showdowns.acceptance.test.ts` (SPEC-01/02), unit tests in `tests/engine/player-view.test.ts` (SPEC-03/04), TASK-6.9 test expected list forgets replaced seats (SPEC-05, Q-1).
- Mutation check: with the `forgetSeats` line removed, both new acceptance tests fail.
- `npm run lint` pass; `npm run typecheck` pass; `npm test` 313 files passed / 5 skipped, 1416 tests passed / 46 skipped.
- Slow (`TLH_SLOW_TESTS=1`): replacement, runner, lineup, bot-replay, lineup-throughput, throughput acceptance — 6 files, 19 tests passed.
- Playtest output byte-identical to base commit (captured before the change, `cmp`): `--hands 2000 --seed 42`; `--hands 300 --seed 42 --size 6 --lineup tough`; `--hands 2000 --seed 42 --size 6 --lineup mixed` (29 bots replaced); `--hands 10000 --seed 42 --size 6 --lineup tough` (44 replaced, 0 violations).
- `npx prettier --write` on every touched file; `npm run lint` format check clean.
