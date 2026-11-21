# TASK-1.46: Stop local timing tests flaking under heavy load

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: n/a (follow-up J-1-01 from TASK-1.35, doc-42) · Branch: doit/TASK-1.46

## What was asked
Local speed assertions timed their work with the wall clock, so when other heavy processes ran, waiting for a core counted as "slow code". With 42 busy processes on a 14-core Mac (load average about 57), a full `npm test` failed three timing tests. AC#1: the timing tests must not flake under heavy local load. AC#2: a real 2x slowdown must still fail. Spec: doit/TASK-1.46/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | AC#2 means "keep detection power", not "`npm test` fails on a 2x slowdown". Real slowdowns show in full in the measurement. The documented real-target commands (README "Speed targets") still fail on a 2x slowdown. The `npm test` slack floors are unchanged (they already had 3-15x headroom). | yes | AC#1 itself allows widening limits. Tightening floors would bring the flakiness back (coverage inflates evaluator CPU time about 5.5x). | Tighten each `npm test` floor to about 1.6x of typical CPU time under coverage. |
| A-2 | Only speed assertions move to CPU time. The 10 s hang guards (including the locked action-bar one) stay on the wall clock. | yes | A hang guard must count real time, and both have more than 10x headroom. | Convert them too. |
| A-3 | `process.cpuUsage()` (whole process) is used, not per-thread CPU. | yes | `process.threadCpuUsage` does not exist on Node 22.18.0. Vitest's default `forks` pool gives each file its own process. V8 helper threads add a few ms, well inside every limit. | Per-thread CPU once the engines floor reaches a Node that has it. |

Questions asked: 0 (see qa.md).

## Clarifications and decisions
No questions. Decisions are the assumptions above. Limits, env override names and defaults, CI (`CI=true`) skip behaviour and console log text are unchanged.

## What was built
- `tests/support/speed.ts`: new `cpuNowMs()` returning process user + system CPU time in ms (from `process.cpuUsage()`). CPU time does not grow while the process waits for a core, but it does grow when the code gets slower.
- `performance.now()` replaced by `cpuNowMs()` in `tests/engine/hand-evaluator.perf.test.ts`, `tests/engine/invariants.perf.test.ts`, `tests/advice/equity.perf.test.ts`, `tests/advice/postflop.perf.test.ts`, the "bounds the work" test in `tests/advice/equity.test.ts`, and the 10,000-call timing in `tests/advice/preflop.test.ts`. Header comments say the times are CPU time.
- Judge fix (round 1): `hand-evaluator.perf.test.ts` now takes the minimum CPU time over `RUNS = 10` repetitions for both throughput and table build. The checksum is checked on every run. Taking the minimum cannot hide a real slowdown, because CPU time cannot fall below the work actually done.
- `tests/support/cpu-clock.acceptance.test.ts` (new, locked): SPEC-01 and SPEC-02.
- `README.md` "Speed targets": one sentence saying local limits are measured in CPU time.
- `.claude/settings.json` (the user's `gh run rerun` permission) was committed with this story. It is not part of the spec.
- No `src/**` changes.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | Acceptance: CPU clock ignores a 300 ms block | PASS | Wall clock moved 290+ ms, CPU clock under 50 ms. Judge holdout: 400 ms sleep added 0.35 ms CPU. |
| SPEC-02 | AC#2 | Acceptance: 2N work measures about 2x of N | PASS | Ratio at least 1.5 required. Judge holdout with a sort workload: 2.00 for 2x, 4.00 for 4x. |
| SPEC-03 | AC#1 | grep for `performance.now(`/`Date.now(`, plus the six timing files under 42 busy processes | PASS | grep clean. 6 files, 11 tests passed under load. Full `npm test` under load: 362/362. |
| SPEC-04 | AC#2 | Mutation check (evaluate does its work twice) on the real-target command, plus locked `tests/ci/speed-limits.acceptance.test.ts` | PASS | Mutation failed 3/3 idle (8.8-8.9M vs 10M floor). Unmutated passed 3/3 idle and 18/18 under load. Locked test 2/2. |

- `npm test`: 101 files, 362 passed, 6 skipped. Lint, typecheck and format clean.
- Recorded deviation: SPEC-03's `--coverage` subset run exits 1, only because global coverage thresholds fail when a subset of files runs. All tests in it passed. Without coverage, the run command under load exits 0 (13/13).
- Judge round 1 FAIL (J-1-01, SPEC-04): the unmutated real-target command (`EVALUATOR_MAX_BUILD_MS=50`) failed 6/6 under load, because the single-run table build took 50-55 ms even in CPU time. Fix: best-of-10 runs. Best of 3 was not enough. Judge round 2 PASS.
- Gate runs: 3 (build pass, fix-2 FAIL, fix-3 pass). fix-2 failed in `tests/support/sandbox-timeout.acceptance.test.ts` (TASK-1.39) with EPERM sending SIGKILL, while other agents were running heavy synthetic load. It passed alone and in the next gate.

## Review
No blocking findings in either round. Security review: no findings (test-only change, no new dependencies or inputs).

### Non-blocking review notes (deliberately not fixed)
- NIT: `hand-evaluator.perf.test.ts:75` — the post-loop `expect(checksum).toBe(warmUp)` repeats the per-run check and cannot fail on its own.
- NIT: `RUNS = 10` makes that file take about 4.5 s under coverage (about 0.5 s before), well inside the 60 s timeout. The review suggested about 5.
- J-2-01 (LOW, judge): spec section 9 said "no added test time", and the extra time above contradicts it. Full `npm test` wall time is unchanged (about 16 s), since files run in parallel.

## How to try it
- `npx vitest run tests/support/cpu-clock.acceptance.test.ts tests/engine/hand-evaluator.perf.test.ts tests/engine/invariants.perf.test.ts tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts tests/advice/equity.test.ts tests/advice/preflop.test.ts`
- Real target: `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts`
- Under load: start 3x core-count busy `node` loops, then run `npm test`.

## Run metrics
Questions 0 · assumptions 3 · review rounds 2 · judge rounds 2 · gate runs 3 · escalations 0 · sendbacks 1 · changed lines 116 in the fix-2 gate (10 files) plus the best-of-10 fix.

## Known limitations and follow-ups
- Per-thread CPU time is not used (A-3). Revisit when the Node floor has `threadCpuUsage`. No action now.
- No product follow-ups.

### Not tracked (infra, below the value bar)
- Redundant post-loop checksum assert (NIT) and about 4.5 s evaluator perf file time (NIT, J-2-01 LOW): neither caused or would plausibly cause a failure.
- TASK-1.39's sandbox-timeout acceptance test failed once with EPERM (fix-2 gate) under heavy synthetic load from other agents. It passed alone and in the next gate. Track only if it recurs.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-04 real-target check was only proven under load by the judge, after build. A spec for load-sensitive timing should include the under-load run of the real-target command as a builder step, which would have caught J-1-01 before judging (best of 3 was tried and was not enough).
- The SPEC-03 command used `--coverage` on a file subset, which always exits 1 on global thresholds. Spec commands should omit `--coverage` or state the expected exit code.
