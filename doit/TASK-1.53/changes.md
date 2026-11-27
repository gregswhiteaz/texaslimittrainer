# Changes — TASK-1.53

- `.github/workflows/ci.yml` — `e2e` becomes a `fail-fast: false` matrix `project: [chromium, webkit]` × `shard: [1, 2]` with name `E2E (${{ matrix.project }}, shard ${{ matrix.shard }} of 2)`, run `npm run e2e -- --project=… --shard=…/2` and artifact `playwright-report-${{ matrix.project }}-${{ matrix.shard }}`; `sweeps` becomes `shard: [1, 2, 3]`, `Sweep tests (shard ${{ matrix.shard }} of 3)`, `--shard=${{ matrix.shard }}/3`. Other steps unchanged (SPEC-01, 06, 08).
- `vite.config.ts` — `test.sequence.sequencer: WeightedSequencer` (SPEC-04). Imported as `./tools/ci/sweep-shards.js` (resolves to the `.ts`; an extensionless import makes Vite print a `configLoader: 'native'` warning into `vitest list` output, and `.ts` needs `allowImportingTsExtensions`).
- `tools/ci/sweep-shards.ts` — new: `DEFAULT_WEIGHT_SECONDS`, `assignShards` (weighted LPT greedy) and `WeightedSequencer` (weighted `shard`, Vitest's default `sort` via lazy `vitest/node` import) (SPEC-02–05).
- `tools/ci/sweep-weights.json` — new: per-sweep-file summed test durations (s, 0.1) from main run 46046670509 jobs 140667544142 and 140667543813 (A-4); 222 keys, sorted.
- `tests/ci/sweep-shards.test.ts` — new unit tests (SPEC-04, SPEC-05).
- `tests/ci/ci-shards.acceptance.test.ts` — new acceptance tests (SPEC-01, 02, 03, 06, 07, 08).
- `tests/ci/ci-jobs.acceptance.test.ts` — locked cross-story re-pin (D-5): e2e/sweeps names, sweeps matrix `[1, 2, 3]`, added e2e matrix pin, sweeps and e2e run commands, test title wording. No assertion removed.
- `tests/ci/workflow.test.ts` — locked cross-story re-pin (D-5): e2e and sweeps commands.
- `tests/ci/branch-protection.acceptance.test.ts` — locked cross-story re-pin (D-5, SPEC-09): matrix expansion over project and shard count, ten expected contexts.
- `README.md` — CI section: jobs table rows for the e2e matrix and the 3 weighted sweep shards, per-shard artifact sentence, weights refresh note, ten branch-protection contexts and "ten" wording (SPEC-09).
- `tests/support/sandbox.ts` — not in the spec's file list but necessary: `CONFIG_FILES` now also copies `tools/ci/sweep-shards.ts` and `tools/ci/sweep-weights.json`, because the sandbox copies `vite.config.ts`, which now imports them; without them every sandboxed `npm run test`/`typecheck` toolchain test fails with "Could not resolve './tools/ci/sweep-shards.js'". +2 lines.

No new dependencies.
