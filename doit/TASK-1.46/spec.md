# Spec: TASK-1.46 — Stop local timing tests flaking under heavy load

Status: READY (approved 2026-11-20)
Task: TASK-1.46 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up J-1-01 from TASK-1.35, doc-42) · Dream: limit-holdem-trainer

## 1. Summary
Local speed assertions time their work with the wall clock (`performance.now()`). When other heavy processes run, the
test process waits for a core, and that waiting counts as "slow code". With 42 busy processes on this 14-core Mac
(load average about 57), a full `npm test` failed exactly the three tests named in doc-42. This task adds a CPU clock
helper, `cpuNowMs()` (process user + system CPU time, from `process.cpuUsage()`). Every local speed assertion now
times with it instead of the wall clock. CPU time does not grow while the process waits for a core, but it does
grow when the code itself gets slower. Limits, env overrides, CI behaviour and log lines stay the same.

## 2. Scope
- In scope:
  - `tests/support/speed.ts`: add `cpuNowMs()`.
  - Use `cpuNowMs()` in place of `performance.now()` for the timed sections of the four perf files, the
    "bounds the work…" test in `tests/advice/equity.test.ts`, and the 10,000-call timing in
    `tests/advice/preflop.test.ts`. Header comments say that the times are CPU time.
  - A new acceptance test for the clock (SPEC-01, SPEC-02).
  - `README.md` "Speed targets": one sentence saying that local limits are measured in CPU time.
- Not doing:
  - Changing any limit, slack floor, env override name or default (`EVALUATOR_MIN_EVALS_PER_SEC` 1,000,000,
    `EVALUATOR_MAX_BUILD_MS` 500, `INVARIANTS_MAX_US_PER_ACTION` 10, `EQUITY_PERF_SCALE`/`ADVICE_PERF_SCALE` 20,
    2000 ms / 10,000 ms bounded work, 1000 ms preflop), or the CI (`CI=true`) skip.
  - Changing console log text. The locked `tests/ci/speed-limits.acceptance.test.ts` matches `seven-card evals/s`
    and `speed limits not enforced (CI=true)`.
  - Editing any locked test. None of the edited files is locked (checked against every `doit/*/state.json`
    `locked_tests`), so this task makes no cross-story edit.
  - The 10 s hang guards in `tests/playtest/runner.test.ts:232-238` and the locked
    `tests/table/action-bar.acceptance.test.ts:40,88` (TASK-3.2). They guard against hangs rather than measure
    speed, and both passed under load (A-2).
  - Wall-clock behaviour tests whose subject is real time: retry delays (`tests/ci/retry*.test.ts`), sandbox and
    process-group timeouts. See TASK-1.20 A-3.
  - Vitest pool or project changes, retries, or moving perf files out of `npm test` (D-1).
  - Any `src/**` change.
- Scope budget: files=9, lines=110   (speed.ts ~+10, acceptance test ~50, 4 perf files ~4 each, equity.test.ts ~3, preflop.test.ts ~3, README ~2)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | AC#2 ("a real 2x slowdown still fails") is read as "the change keeps detection power". Real slowdowns still show up in full in the measurement (SPEC-02). The documented real-target commands (README "Speed targets") still fail on a 2x slowdown of the evaluator (SPEC-04). The `npm test` slack floors stay as they are. Today those floors already have 3–15x headroom, so before this change a 2x slowdown did not fail `npm test` either. | yes | AC#1 itself offers "widen local limits with a documented margin" as a fix, so the story does not expect `npm test` floors within 2x. Tightening floors to below 2x of typical would bring back flakiness (coverage inflates CPU time about 5.5x for the evaluator) | Tighten each `npm test` floor to about 1.6x of the typical CPU time under coverage, so `npm test` itself fails on 2x |
| A-2 | Only assertions that measure speed move to CPU time. The 10 s hang guards stay on the wall clock | yes | A hang guard must count real time. Both have more than 10x headroom and passed at load average 57 | Convert them too (the action-bar one is locked by TASK-3.2) |
| A-3 | `process.cpuUsage()` (whole process) is used, not per-thread CPU | yes | `process.threadCpuUsage` does not exist on Node 22.18.0 (probed: `undefined`). Vitest's default pool is `forks` (`vite.config.ts` sets no pool), so each test file runs in its own process and other files' CPU is not counted. V8 helper threads add a little (a few ms on a cold first call), which is well inside every limit | Per-thread CPU when the engines floor reaches a Node with `threadCpuUsage` |

## 3. Current system
- `tests/support/speed.ts:1-7`: `SPEED_LIMITS_NOT_ENFORCED` and `speedLimitsEnforced(env)` (CI skip, TASK-1.20). Its unit test is `tests/support/speed.test.ts`, which is not locked.
- Wall-clock call sites:
  - `tests/engine/hand-evaluator.perf.test.ts:51-58`: throughput and table build.
  - `tests/engine/invariants.perf.test.ts:16-18`: `timed()`, checked minus unchecked.
  - `tests/advice/equity.perf.test.ts:62-64` and `tests/advice/postflop.perf.test.ts:83-85`: per-run p95.
  - `tests/advice/equity.test.ts:250-257`: bounded work, 2000 ms locally and 10,000 ms on CI.
  - `tests/advice/preflop.test.ts:163-165`: 10,000 calls in under 1000 ms. This one is not CI-gated.
- Headers at lines 1-4 of each perf file document the real-target commands. `README.md:141-161` has the "Speed targets" section.
- Locked `tests/ci/speed-limits.acceptance.test.ts:5-10,46-53` (TASK-1.20/1.23) runs the evaluator and equity perf files in a nested Vitest with impossible limits (`1e15` evals/s, build `0` ms, scale `0`). It expects 2 failures without `CI` and 2 passes plus the log strings with `CI=true`. CPU-time values are still finite and above 0, so those outcomes do not change.
- Tests run with `npm test` = `vitest run --coverage` (`package.json`). `vite.config.ts:5-18` sets no `pool`, so it is `forks` (Vitest 5 default).
- Measured on this Mac (14 cores, Node 22.18.0), for this spec:
  - Idle, wall vs CPU, 1M evaluations: 62 ms vs 62 ms.
  - Under 42 busy `node` loops, the same work: wall 232–310 ms, CPU 77–83 ms.
  - Full `npm test` under 42 busy loops (load average 57): exactly 3 failures. `equity.test.ts` bounded work (3277 ms vs 2000), `hand-evaluator.perf` (567,410 evals/s vs 1,000,000) and `invariants.perf` (17.6 µs vs 10). All other 357 tests passed.
  - Prototype of this change (scratch copy, `--coverage`), the six timing files under the same load: 11/11 pass. Evaluator 2.57M evals/s under load vs 2.79M idle. Invariants 0.85 vs 0.67 µs. Full ring p95 392 vs 327 ms. Bounded work CPU at most 641 ms per call (idle, coverage).
- Existing code to reuse:
  - `tests/support/speed.ts` → the home for `cpuNowMs()`, next to `speedLimitsEnforced` that every call site already imports.
  - The README real-target commands → the AC#2 demonstration (SPEC-04).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Measure local speed assertions in process CPU time (`cpuNowMs()`) and keep all limits | Serial perf project/pool (does nothing about outside load, and `equity.test.ts` is not a perf file); Vitest `retry` (sustained load fails every attempt, and it hides flakiness); wider margins (would need more than 5x, and weakens detection) | Removes the cause (waiting for a core) and keeps every limit, so detection is unchanged. Measured: under load, CPU time inflates 1.1–1.3x while wall time inflates 4–5x | no | n/a |
| D-2 | `cpuNowMs()` is a drop-in for `performance.now()`: a monotonic count in ms, read as end minus start | `cpuTimeMs(fn)` wrapper | Smallest diff at each call site. The surrounding code (p95 loops, checked minus unchecked) stays the same | no | n/a |

## 5. Design

### Files to create / modify
- `tests/support/speed.ts` — add `cpuNowMs()`.
- `tests/support/cpu-clock.acceptance.test.ts` — new: SPEC-01, SPEC-02.
- `tests/engine/hand-evaluator.perf.test.ts` — `cpuNowMs()` at :51-58; header line.
- `tests/engine/invariants.perf.test.ts` — `cpuNowMs()` at :16-18; header line.
- `tests/advice/equity.perf.test.ts` — `cpuNowMs()` at :62-64; header line.
- `tests/advice/postflop.perf.test.ts` — `cpuNowMs()` at :83-85; header line.
- `tests/advice/equity.test.ts` — `cpuNowMs()` at :252,257; comment at :248-249 mentions CPU time.
- `tests/advice/preflop.test.ts` — `cpuNowMs()` at :163,165 (import from `../support/speed`).
- `README.md` — one sentence in "Speed targets".

### Components, interfaces and data
```ts
/** CPU time (user + system) this process has used, in ms. Time spent waiting for a core is not counted,
 *  so other busy processes do not inflate it, but slower code does. Read it as end minus start. */
export function cpuNowMs(): number  // (process.cpuUsage().user + .system) / 1000
```
- Header line added to each perf file (wording may vary, meaning may not): `// Times are process CPU time
  (cpuNowMs in tests/support/speed.ts), so other busy processes do not inflate them.`
- README sentence after `README.md:158-161`: local limits, including the full-speed commands, are measured in
  process CPU time, so a busy machine does not fail them but slower code still does.

### Rules and algorithms
- Each `performance.now()` in the listed timed sections becomes `cpuNowMs()`. Nothing else changes: the
  arithmetic, units (ms), p95 rule, limits, `ENFORCED` gating and log text all stay.
- Worked example: the evaluator under 42 busy processes. Wall time gives 567,410 evals/s and fails the 1,000,000
  floor. CPU time gives about 2.57M evals/s under coverage and passes. With `evaluate` doubled, the CPU-time rate
  without coverage drops from about 15.7M to about 7.9M, which fails the 10,000,000 real target.

### Error handling and configuration
- No new env vars and no new errors. `CI=true` behaviour is unchanged (measure, print, do not enforce).

## 6. Behaviour specification

### SPEC-01: the CPU clock does not count time spent waiting
- Verifies: AC#1
- Behaviour: Given `cpuNowMs()`, When the test thread blocks for 300 ms (`Atomics.wait` on a fresh `Int32Array(new SharedArrayBuffer(4))`) between two readings, Then the wall clock (`performance.now()`) advanced by at least 290 ms and `cpuNowMs()` advanced by less than 50 ms. Blocking is how a process looks to its own CPU clock while it waits for a core.
- Verification: acceptance `tests/support/cpu-clock.acceptance.test.ts::does not count time the process spends waiting`

### SPEC-02: the CPU clock still counts real slowdowns
- Verifies: AC#2
- Behaviour: Given a deterministic CPU-bound workload `work(n)` (for example, summing `Math.sqrt(i)` for `i < n`, result consumed so it is not optimised away) that takes about 20 ms at `n = N`, When it is timed with `cpuNowMs()` 5 times at `N` and 5 times at `2N` after one warm-up of each, Then min(time at 2N) / min(time at N) is at least 1.5. Twice the work is measured as roughly twice the time.
- Verification: acceptance `tests/support/cpu-clock.acceptance.test.ts::counts twice the work as about twice the time`

### SPEC-03: every local speed assertion uses the CPU clock, and the timing tests pass under heavy load
- Verifies: AC#1
- Behaviour: Given the change, When the six timing files are searched, Then `performance.now(` and `Date.now(` do not appear in `tests/engine/hand-evaluator.perf.test.ts`, `tests/engine/invariants.perf.test.ts`, `tests/advice/equity.perf.test.ts`, `tests/advice/postflop.perf.test.ts` or `tests/advice/preflop.test.ts`. In `tests/advice/equity.test.ts` they do not appear inside the "bounds the work…" test. And Given 3 × the core count busy `node` processes, When the six files run with coverage, Then all their tests pass. Before the change, the same load failed 3 of them (§3).
- Verification: command `grep -nE "performance\.now\(|Date\.now\(" tests/engine/hand-evaluator.perf.test.ts tests/engine/invariants.perf.test.ts tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts tests/advice/preflop.test.ts; sed -n '/bounds the work/,/^  });/p' tests/advice/equity.test.ts | grep -cE "performance\.now\(|Date\.now\("` (first prints nothing, second prints 0); then `N=$(( $(sysctl -n hw.ncpu) * 3 )); for i in $(seq $N); do node -e "const e=Date.now()+300000;while(Date.now()<e){}" & done; sleep 5; npx vitest run --coverage tests/engine/hand-evaluator.perf.test.ts tests/engine/invariants.perf.test.ts tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts tests/advice/equity.test.ts tests/advice/preflop.test.ts; echo exit=$?; kill $(jobs -p)` (prints `exit=0`)

### SPEC-04: a real 2x slowdown still fails the timing tests locally
- Verifies: AC#2
- Behaviour: Given `src/engine/hand-evaluator.ts` temporarily changed so that `evaluate` does its work twice (a scratch mutation, reverted afterwards), When `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts` runs with `CI` unset on an idle machine, Then it fails on the throughput floor. Without the mutation, the same command passes, both idle and under the SPEC-03 load. Also, the locked `tests/ci/speed-limits.acceptance.test.ts` still passes unchanged: limits are still enforced locally and impossible limits still fail.
- Verification: manual mutation check with the command above (judge), plus command `npx vitest run tests/ci/speed-limits.acceptance.test.ts`

## 7. Edge cases
- Heavy outside load (more processes than cores): SPEC-01, SPEC-03.
- Cold first call (JIT helper threads add CPU time): every perf file warms up first. The bounded-work and preflop tests have at least 3x headroom under coverage (bounded at most 641 ms vs 2000). A-3.
- Coverage instrumentation inflates CPU time as it does wall time. Limits were already set to pass under `npm test` coverage. Unchanged.
- E-core scheduling on Apple silicon raises CPU time somewhat under load (measured 1.1–1.3x), well inside every limit.
- `CI=true`: unchanged and covered by the locked speed-limits test (SPEC-04).
- Concurrency between test files: N/A. Each file runs in its own forked process (A-3).

## 8. Security considerations
N/A. These are test-only changes, with no input, secrets, randomness or new dependency (`process.cpuUsage` is built into Node).

## 9. Non-functional
- No added test time. The SPEC-01/02 file runs in under 1 s.
- Local timing assertions tolerate at least 3x core-count oversubscription (SPEC-03), and their limits and detection power are unchanged (SPEC-02, SPEC-04).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run tests/support/cpu-clock.acceptance.test.ts tests/engine/hand-evaluator.perf.test.ts tests/engine/invariants.perf.test.ts tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts tests/advice/equity.test.ts tests/advice/preflop.test.ts`
- New tests:
  - `tests/support/cpu-clock.acceptance.test.ts` → SPEC-01, SPEC-02
  - SPEC-03 and SPEC-04 → command and manual checks (no new file)
- End-to-end scenario for the Judge:
  1. Run the SPEC-03 load command and see `exit=0`.
  2. Optionally run a full `npm test` under the same load and see no failures in the six timing files. Before the change, exactly 3 failed.
  3. Do the SPEC-04 mutation check, then revert it (`git checkout src/engine/hand-evaluator.ts`).
  4. Run `npx vitest run tests/ci/speed-limits.acceptance.test.ts` and see it pass.

## 11. Open questions
- None.

## 12. Clarifications log
See `doit/TASK-1.46/qa.md`.
