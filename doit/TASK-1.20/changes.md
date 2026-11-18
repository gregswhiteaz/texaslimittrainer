# Changes — TASK-1.20

- `tests/support/speed.ts` — created: `speedLimitsEnforced(env)` (false only when `CI === 'true'`) and the `SPEED_LIMITS_NOT_ENFORCED` note text (SPEC-01).
- `tests/support/speed.test.ts` — created: unit test of the enforcement rule and note text (SPEC-01).
- `tests/ci/speed-limits.acceptance.test.ts` — created: spawns a nested Vitest (no coverage) on both perf suites with impossible limits, with `CI=true` (exit 0, note printed, 2 passed) and without `CI` (2 failed) (SPEC-02, SPEC-03). Fix round 1: nested run drops `FORCE_COLOR`, sets `NO_COLOR=1`, and strips ANSI escapes from output before matching.
- `tests/support/sandbox.ts` — modified: export the existing `sandboxEnv()` for the nested Vitest run.
- `tests/engine/hand-evaluator.perf.test.ts` — modified: header naming the full-speed command; rate/build asserts only when enforced; note appended to the log line in CI; checksum asserts unconditional (SPEC-04, SPEC-07).
- `tests/advice/equity.perf.test.ts` — modified: header naming the full-speed command; p95 failures collected only when enforced; note logged once in CI; method asserts unconditional (SPEC-04, SPEC-07).
- `tests/advice/equity.test.ts` — modified: bounded-work ceiling 2000 ms locally, 10,000 ms when `CI=true` (SPEC-06).
- `README.md` — modified: new "Speed targets" section after "Continuous integration" (SPEC-07).

No new dependencies.
