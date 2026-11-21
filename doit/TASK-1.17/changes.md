# Changes: TASK-1.17

- `src/playtest/shards.ts` — new: shard plan (sizes 2–10, seed 1000000 + size), shard argv, report reading/validation, combining per-invariant counts, the million-hand report text, bounded-concurrency `runShards`, `parseMillionArgs` and `millionMain`.
- `tools/playtest/million.ts` — new: process entry for `npm run playtest:million`; spawns one `tools/playtest/main.ts` child per shard (fixed argv, no shell) with `os.availableParallelism()` concurrency.
- `package.json` — added the `playtest:million` script.
- `.github/workflows/million.yml` — new: `workflow_dispatch`-only workflow, one job, 30-minute timeout, same pinned checkout/setup-node SHAs as `ci.yml`.
- `README.md` — Commands table row, "Million-hand playtest" section under Continuous integration, 100,000-hand timing under Speed targets (table re-widened by Prettier).
- `tests/playtest/million.acceptance.test.ts` — new: SPEC-01, SPEC-03, SPEC-05, SPEC-07 acceptance tests.
- `tests/ci/million-workflow.acceptance.test.ts` — new: SPEC-02 workflow acceptance test.
- `tests/playtest/throughput.acceptance.test.ts` — new: SPEC-06 100,000-hand 6-max throughput test.
- `tests/playtest/shards.test.ts` — new: SPEC-04 and SPEC-08 unit tests; judge fix J-1-02 adds a cross-shard sum test for `combineShards`.
- `backlog/tasks/task-1.17 - Prove-the-engine-with-a-1000000-hand-invariant-run.md` — implementation notes appended through the CLI (`backlog task edit TASK-1.17 --append-notes`) with the DoD#1 timing, as SPEC-06 requires.

No new dependencies.
