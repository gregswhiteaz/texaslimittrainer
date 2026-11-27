# Build log — TASK-1.53

## BUILD
- Built `tools/ci/sweep-weights.json`: parsed the verbose logs of main run 46046670509 (jobs 140667544142, 140667543813) with a throw-away script (summed per-test durations per file, 0.1 s); 222 sweep files from `vitest list --filesOnly <test:sweeps filters>`, 87 at 0 (sub-50 ms or wholly skipped). Total 871.4 s (spec estimate ~848 s); top 5 match A-4 exactly.
- Added `tools/ci/sweep-shards.ts` (LPT `assignShards`, `WeightedSequencer`), wired in `vite.config.ts`. Import is `./tools/ci/sweep-shards.js`: an extensionless import made Vite print a `configLoader: 'native'` warning that polluted `vitest list` output (broke the list-parsing tests); `.ts` needs `allowImportingTsExtensions` (TS5097). Constructor parameter properties replaced by explicit fields (`erasableSyntaxOnly`).
- Edited `ci.yml` (e2e matrix, 3 sweep shards, names, commands, artifact name) and re-pinned the 3 locked CI tests (D-5); no assertion removed, one e2e-matrix assertion added to `ci-jobs.acceptance.test.ts`.
- Added `tests/support/sandbox.ts` CONFIG_FILES entries for the sequencer + weights: the first gate run failed 10 toolchain sandbox tests because the sandbox copies `vite.config.ts` without its new import (outside the spec's file list; files 11 vs budget 10, warn only).
- README CI section updated (table, artifact sentence, weights refresh note, ten contexts).
- Commands:
  - `npx vitest run` on the 5 CI test files: 5 files, 23 tests passed.
  - `npm run test:sweeps -- --shard=N/3`: shard 1 44 files (155 passed, 9 skipped), shard 2 46 files (175 passed, 9 skipped), shard 3 132 files (641 passed, 35 skipped); 44+46+132 = 222 = SPEC-02 count. Local times ~72/47/66 s.
  - `npm run lint`, `npm run typecheck`, `npm run format`: clean.
  - Gate runs 2–3 failed only because my own background `npm test` held the coverage directory lock at the same time.
  - `npm test` (alone): 351 files passed, 11 skipped; 1554 tests passed, 60 skipped.
