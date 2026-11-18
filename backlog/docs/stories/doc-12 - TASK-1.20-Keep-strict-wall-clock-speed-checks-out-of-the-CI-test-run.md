---
id: doc-12
title: 'TASK-1.20: Keep strict wall-clock speed checks out of the CI test run'
type: other
created_date: '2026-11-18T06:24:00Z'
updated_date: '2026-11-18T06:24:00Z'
---
# TASK-1.20: Keep strict wall-clock speed checks out of the CI test run

Status: Done (judge and CI pending) · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: none (follow-up of TASK-1.3 judge finding J-1-00) · Branch: doit/TASK-1.20

## What was asked
On TASK-1.3's CI attempt 2, two older speed tests failed on a slow shared GitHub runner although no related code changed. The hand-evaluator throughput floor reached 975,968 evals/s against 1,000,000. The equity "bounds the work…" test took 2676 ms against 2000 ms. The task is to stop `npm test` in CI (`CI=true`) from failing on speed alone, keep every correctness assertion running, and keep the real targets enforced by the documented full-speed commands on the reference Mac. Spec: doit/TASK-1.20/spec.md.

## Assumptions made without asking — please review
No questions were asked at spec time. The orchestrator approved the spec. All assumptions are reversible.

| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "In CI" means `process.env.CI === 'true'` exactly. `1`, `false` and empty count as local. | yes | AC#1 names `CI=true`. GitHub Actions sets exactly that. `retry.sudo.test.ts` already uses the same test. | Widen the check in `tests/support/speed.ts` |
| A-2 | The bounded-work ceiling is 10 s per `computeEquity` call in CI and 2 s locally. | yes | 10 s is 3.7× the worst observed CI call. The worst case of 20 s stays under the 30 s `testTimeout`. Unbounded work still runs far longer. | Change the constant in `tests/advice/equity.test.ts` |
| A-3 | The retry timing tests (`tests/ci/retry.test.ts`, `retry.sudo.test.ts`) stay unchanged. | yes | They check behaviour (no delay vs a 10 s delay, kill at a timeout), each with at least 3× headroom. None has failed in CI. | Gate them like the perf tests, in a new task (the first file is locked) |
| A-4 | With `CI=true` the perf suites also ignore the threshold env vars (`EVALUATOR_MIN_EVALS_PER_SEC`, `EVALUATOR_MAX_BUILD_MS`, `EQUITY_PERF_SCALE`). | yes | One simple rule. It also lets the acceptance test prove that impossible limits do not fail in CI. The README says to run the full-speed commands with `CI` unset. | Make env vars override the CI skip |
| A-5 | Local `npm test` (no `CI`) keeps the existing slack thresholds: 1,000,000 evals/s, 500 ms build, scale 20, 2000 ms bounded-work. | yes | AC#1 is CI-only. | Skip speed limits locally too |

Trade-off to note: CI no longer catches speed regressions. Only the documented full-speed commands on the reference Mac do, and they are run by a person.

## Clarifications and decisions
- No questions (Q-n) were asked.
- D-2 from the spec: no production instrumentation or operation counters in `src/**`. The change is test-side only.
- No locked test file was touched. One file made in this task was unlocked once (see Review).
- `.github/workflows/ci.yml` is unchanged. GitHub Actions already sets `CI=true`, and `workflow.test.ts` pins the file's shape.

## What was built
- `tests/support/speed.ts` (new): `speedLimitsEnforced(env)`, false only when `CI === 'true'`, and the `speed limits not enforced (CI=true)` note text.
- `tests/support/speed.test.ts` (new): unit test of the rule and the note.
- `tests/engine/hand-evaluator.perf.test.ts` and `tests/advice/equity.perf.test.ts`: the rate, build-time and p95 asserts run only when enforced. The checksum and method assertions always run. Both print the note in CI and have a header naming the full-speed command.
- `tests/advice/equity.test.ts`: bounded-work ceiling is 2000 ms locally and 10,000 ms in CI. The three error-message asserts are unchanged.
- `tests/support/sandbox.ts`: exports the existing `sandboxEnv()`.
- `tests/ci/speed-limits.acceptance.test.ts` (new): spawns a nested Vitest on both perf suites with impossible limits. With `CI=true` it expects exit 0, the note and "2 passed". Without `CI` it expects "2 failed" and no note.
- `README.md`: new "Speed targets" section after "Continuous integration". It lists both full-speed commands, the reference machine, and that CI does not enforce speed.
- No new dependencies. Final diff is 131 changed lines in 8 files, against a budget of 8 files and 170 lines.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | unit test of the enforcement rule | pass | `tests/support/speed.test.ts`, 6 assertions |
| SPEC-02 | AC#1 | acceptance, nested Vitest with `CI=true` and impossible limits | pass | `speed-limits.acceptance.test.ts` |
| SPEC-03 | AC#2 | acceptance, same run without `CI` | pass | the same file |
| SPEC-04 | AC#1 | mutation probe plus a read of the unconditional asserts | specified; no probe result is recorded in the artifacts | spec.md |
| SPEC-05 | AC#2 | full-speed commands on the reference Mac, plus a diff of the threshold lines | diff check empty (build-log); full-speed run result not recorded | build-log.md |
| SPEC-06 | AC#3 | `CI=true npx vitest run tests/advice/equity.test.ts -t "bounds the work"` | 1 passed, 4 skipped (build-log) | build-log.md |
| SPEC-07 | AC#4 | grep of README and perf headers | pass per code review, both rounds | reviews/ |
| SPEC-08 | AC#1–3 | `npm run lint && npm run typecheck && npm test`; CI run after push | local gate pass; CI pending | gates/fix-3.json |

- Final gate (fix-3): test, lint, typecheck, spec unchanged, scope budgets, files outside spec, changes listed and test integrity all pass. `npm test` gave 89 passed, 1 skipped (90).
- Gate runs: build-1, fix-2, fix-3, all PASS.
- Judge: pending (the orchestrator appends the result).
- CI on the pushed branch: pending (the orchestrator appends the result).

## Review
Two rounds, code and security reviewers.
- Round 1, MAJOR (code): `FORCE_COLOR` is inherited by the nested Vitest. ANSI codes then break the `Tests  2 passed` regex, so the new acceptance test failed spuriously. Resolution: the orchestrator unlocked `tests/ci/speed-limits.acceptance.test.ts`. The logged reason is that the fix strengthens reliability and the assertions are unchanged. The child env now deletes `FORCE_COLOR` and sets `NO_COLOR=1`, and the captured output is stripped of ANSI escapes before matching. `FORCE_COLOR=1` runs of the file pass.
- Round 2: no BLOCKER or MAJOR from either reviewer.

### Non-blocking review notes (deliberately not fixed)
- NIT (security, r1 and r2): the nested-Vitest 120 s timeout sends SIGTERM to `npx` only, so a hung grandchild Vitest could outlive the test. The inner tests have their own timeouts, and CI runners are torn down after the job.
- NIT (code, r2): colour is handled twice (suppression and ANSI strip). Either one alone fixes the r1 problem. Both were kept as harmless.

## How to try it
- Full local run: `npm run lint && npm run typecheck && npm test`
- CI behaviour: `CI=true npx vitest run tests/engine/hand-evaluator.perf.test.ts tests/advice/equity.perf.test.ts`
- Full-speed targets (with `CI` unset, on the reference Mac): `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts && EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts`

## Run metrics
Questions: 0 · Assumptions logged: 5 (in spec) · Review rounds: 2 · Judge rounds: pending · Gate runs: 3 · Escalations: 0 · Changed lines: 131 (8 files).

## Known limitations and follow-ups
- CI cannot detect speed regressions. Someone has to run the full-speed commands on the reference Mac.
- A hang in the nested Vitest could orphan a process. Follow-up, not created: kill the nested Vitest process group on timeout, or run `node_modules/.bin/vitest` directly.
- The retry timing tests are still wall-clock checks (A-3). They have not failed in CI.

## Lessons for the factory (proposals — not applied)
- The spec could say that tests spawning a nested tool must scrub colour and terminal env vars (`FORCE_COLOR`, `NO_COLOR`). That would have avoided the r1 MAJOR and the unlock.
