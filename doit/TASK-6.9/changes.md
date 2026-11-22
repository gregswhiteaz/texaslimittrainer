# TASK-6.9 changes

- `src/playtest/shards.ts` — modified: `ShardLineUp`, `LINEUP_SHARD_PRESETS`, `planLineUpShards` (27 shards, seeds 1000000 + 100p + size), optional `Shard.lineUp` (`shardArgs` appends `--lineup <name>`), `--lineups` parsing (`MillionArgs.lineUps`, new usage errors), line-up plan line and `Hands for line-up …` lines in the combined report, updated `MILLION_USAGE`. Default run output unchanged.
- `src/playtest/runner.ts` — modified: `HandSetup.earlierShowdowns` passed to every `playerView`; `EARLIER_SHOWDOWN_LIMIT` (1000); `runPlaytest` carries earlier showdowns per table and resets them on a restart (violation/abandoned hand, new sit-and-go); exported `composeChecks`.
- `.github/workflows/million-lineups.yml` — created: `workflow_dispatch`-only workflow running `npm run playtest:million -- --lineups` in one 30-minute job.
- `package.json` — modified: `test:slow` includes `tests/playtest/lineup-throughput.acceptance.test.ts`.
- `tests/playtest/million-lineups.acceptance.test.ts` — created: SPEC-01, SPEC-03.
- `tests/ci/million-lineups-workflow.acceptance.test.ts` — created: SPEC-04.
- `tests/playtest/lineup-throughput.acceptance.test.ts` — created: SPEC-07 (opt-in, `TLH_SLOW_TESTS=1`).
- `tests/playtest/style-bots.acceptance.test.ts` — created: SPEC-08, SPEC-09, SPEC-10.
- `tests/playtest/shards.test.ts` — modified: existing `parseMillionArgs` expectations gain `lineUps: false`; new SPEC-06 unit test.
- `tests/playtest/runner.test.ts` — modified: units for the earlier-showdown window, immutability, `playHand` setup pass-through, sit-and-go restart, `composeChecks`, and (fix r1) earlier showdowns two or more hands after a violation restart and a new sit-and-go.

New dependencies: none.
