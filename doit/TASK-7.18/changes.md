# TASK-7.18 changes

- `src/advice/equity.ts` — sampler loop: generation stamps instead of the reset loop, opponent picks copied into `hands` only on acceptance, xoshiro128** state in locals (same seed and draw order as `Xoshiro128`, results byte-identical); early abort via new `@internal` `SAMPLER_CHECK_EVERY`, `SAMPLER_ABORT_Z`, `rejectionsOverBudget` (D-1, D-2).
- `tests/advice/equity.test.ts` — SPEC-05 byte-identical hash test and SPEC-06 early-abort test; also the timeout-only `vi.setConfig({ testTimeout: 30_000 })` line (§10 list).
- `tests/advice/equity.perf.test.ts` — `WARMUP_RUNS = 15` untimed calls per scenario (D-3); header notes the 0.75 headroom command.
- `tests/advice/postflop.perf.test.ts` — `WARMUP_RUNS = 15`; `slowScenarios` `owed` flag; new `TLH_SLOW_TESTS`-gated 9-opponent nothing-owed value-bet scenario at 100 ms (SPEC-04).
- `vite.config.ts` — removed the global `testTimeout: 30_000` (SPEC-02).
- `package.json` — `test:slow` also runs `tests/advice/postflop.perf.test.ts`.
- `README.md` — Speed targets: 0.75 equity headroom command and the postflop advice command.

Timeout-only edits (one `vi.setConfig({ testTimeout: 30_000 });` line after the imports, plus `vi` in the `vitest` import where missing; spec §10, Q-3):
- `tests/ui/review-shown.acceptance.test.tsx` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/postflop-ranges.property.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/postflop.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/stats/trend-grouping.acceptance.test.tsx` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/postflop-coverage.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/engine/illegal-actions.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/playtest/runner.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/bots/tag-playtest.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/equity-multiway.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/equity.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/playtest/cli.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/stats/bb100.acceptance.test.tsx` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/tooling-changed.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/grade.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/action-bar-limits.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/session.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/engine/player-view.property.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/stats/style-stats.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/git/prune-merged-branches-hardening.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/bots/style.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/stats/trends.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/storage/trend-data.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/engine/invariant-messages.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/support/cpu-clock.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/git/prune-merged-branches.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/decision-grades.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/playtest/policy.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/storage/hand-records.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/advice/range-model.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/pace.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/resume.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/playtest/shards.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/table/table-size.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/storage/resume.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/storage/session-records.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/storage/session-end-style.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/retry.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/apt-lock.dpkg.acceptance.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/apt-lock.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/retry.sudo.test.ts` — per-file 30 s test timeout (§10 measured list).
- `tests/ci/retry.reap.test.ts` — per-file 30 s test timeout (§10 measured list).

No new dependencies.
