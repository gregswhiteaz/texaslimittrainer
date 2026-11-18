# Spec: TASK-1.20 — Keep strict wall-clock speed checks out of the CI test run

Status: READY (approved 2026-11-18)
Task: TASK-1.20 · Parent/epic: TASK-1 (Prove the game headlessly) · Requirements: n/a (follow-up of TASK-1.3 judge finding J-1-00) · Dream: limit-holdem-trainer

## 1. Summary
Two speed checks inside `npm test` failed on a slow shared GitHub runner although no related code changed: the
hand-evaluator throughput floor (975,968 and 935,660 evals/s against 1,000,000) and the equity "bounds the work…"
ceiling (2676 ms against 2000 ms). This task adds one small test helper that reads `CI`. When `CI=true`, the two
perf suites still run and print their numbers, and every correctness assertion still runs, but their speed
limits are not enforced. The bounded-work test gets a generous CI-only ceiling of 10,000 ms per call instead of
2000 ms. Without `CI=true` (local runs, including the documented full-speed commands) every limit is enforced
exactly as before. The README and the perf test headers say which commands enforce the real targets and that CI
does not.

## 2. Scope
- In scope:
  - `tests/support/speed.ts`: `speedLimitsEnforced(env)` and the log note text.
  - `tests/engine/hand-evaluator.perf.test.ts`, `tests/advice/equity.perf.test.ts`: skip only the speed
    assertions when not enforced; keep correctness assertions; header comment.
  - `tests/advice/equity.test.ts` "bounds the work…": CI ceiling 10,000 ms, local ceiling 2000 ms unchanged.
  - `tests/support/sandbox.ts`: export the existing scrubbed-env helper so the new acceptance test can spawn a
    nested Vitest.
  - New tests: helper unit test and a CI-vs-local acceptance test that spawns the perf suites.
  - `README.md`: a "Speed targets" section.
- Not doing:
  - Editing any locked test file: `tests/ci/retry.test.ts`, `tests/ci/workflow.test.ts` (TASK-1.19, TASK-1.7),
    `tests/engine/hand-evaluator.acceptance.test.ts`, `tests/engine/hand-evaluator.property.test.ts`,
    `tests/engine/reference-ranking.ts` (TASK-1.2), `tests/advice/equity.acceptance.test.ts` (TASK-7.1),
    `tests/engine/deck.acceptance.test.ts`, `e2e/replay-seed.spec.ts` (TASK-1.3). None needs to change.
  - Changing `.github/workflows/ci.yml` (GitHub Actions already sets `CI=true` for every step; adding an `env:`
    block is unnecessary and `workflow.test.ts` pins the file's shape).
  - Changing the timing assertions in `tests/ci/retry.test.ts` or `tests/ci/retry.sudo.test.ts` (see A-3).
  - Changing `src/**` (no production instrumentation or operation counters; see D-2).
  - Changing the speed targets, the local slack floors (1,000,000 evals/s, 500 ms build, `EQUITY_PERF_SCALE`
    default 20) or the documented full-speed commands.
  - Moving the perf suites out of `npm test`, a Vitest project split, or Vitest `bench`.
  - Playwright/e2e timeouts.
- Scope budget: files=8, lines=170

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "In CI" means `process.env.CI === 'true'` exactly | yes | AC#1 names `CI=true`; GitHub Actions sets exactly that; the repo already uses this test (`tests/ci/retry.sudo.test.ts:37`) | Also accept `1`/any non-empty value (std-env style) |
| A-2 | The bounded-work CI ceiling is 10,000 ms per `computeEquity` call (local stays 2000 ms) | yes | 3.7× the worst observed CI call (2676 ms). Only two of the three calls do real work, so the worst case (20 s) stays under the 30 s `testTimeout` (`vite.config.ts:10`). Unbounded work (no rejection cap, no feasibility budget) runs for minutes or forever, so the ceiling still separates bounded from unbounded | 5000 ms (tighter, more flake risk); an operation counter in `src/` (D-2) |
| A-3 | The `run.ms` / `ms` checks in `tests/ci/retry.test.ts` (locked, TASK-1.19) and `tests/ci/retry.sudo.test.ts` stay unchanged: they are behaviour checks (no delay vs a 10 s delay; killed at a 0.5–2 s timeout vs hanging), not speed targets, each with ≥ 3× headroom over a normal run, and none has failed in CI | yes | AC#1 targets speed/throughput limits; these assert that the helper did not wait or hang. Editing them would be a cross-story change to a locked file without evidence of flakiness | Scale them by a CI factor (needs an unlock of a TASK-1.19 locked file) |
| A-4 | With `CI=true` the perf suites ignore the speed limits even when a threshold env var (`EVALUATOR_MIN_EVALS_PER_SEC`, `EVALUATOR_MAX_BUILD_MS`, `EQUITY_PERF_SCALE`) is set | yes | Keeps one simple rule, and lets the acceptance test prove "impossible limits do not fail in CI". The full-speed commands are documented as local runs where `CI` is unset; the perf tests print the "not enforced" note so a developer with `CI=true` in the shell sees it | Explicit thresholds override CI (then AC#1 cannot be tested by simulation) |
| A-5 | Local `npm test` (no `CI`) keeps the existing slack checks (≥ 1M evals/s, ≤ 500 ms build, 20× equity targets, 2000 ms bounded-work ceiling) | yes | AC#1 is CI-only; the task does not ask to relax local runs | Also skip speed limits locally in `npm test` |

## 3. Current system
- Vitest 5.1 runs `src/**/*.test.{ts,tsx}` and `tests/**/*.test.{ts,tsx}` (`vite.config.ts:7`) with
  `testTimeout: 30_000` (`vite.config.ts:10`); `npm test` = `vitest run --coverage` (`package.json:15`). Coverage
  only covers `src/**` (`vite.config.ts:13`), so test helpers do not affect thresholds.
- CI runs `npm test` in the `Test` step (`.github/workflows/ci.yml:39-40`) on `ubuntu-24.04`; GitHub Actions sets
  `CI=true` in every step's environment. `tests/ci/workflow.test.ts:34-46,48-61` pin the run commands and `if:`
  lines, so no workflow change is wanted.
- Hand evaluator perf: `tests/engine/hand-evaluator.perf.test.ts:5-6` read `EVALUATOR_MIN_EVALS_PER_SEC`
  (default 1,000,000) and `EVALUATOR_MAX_BUILD_MS` (default 500); correctness asserts at `:58-59`, speed asserts
  at `:60-61`; test name `hand evaluator performance > meets the evaluation throughput floor` (referenced by
  TASK-1.2 SPEC-11, unit kind, not locked).
- Equity perf: `tests/advice/equity.perf.test.ts:5` reads `EQUITY_PERF_SCALE` (default 20); per scenario it
  asserts the method (`:64`, correctness) and collects p95 > limit failures (`:65`), asserted at `:67`. Test name
  `equity performance > equity latency within target times slack` (TASK-7.1 SPEC-11, unit, not locked).
- Bounded work: `tests/advice/equity.test.ts:242-262`, `computeEquity > bounds the work when range sets cannot all
  be dealt`; error-message asserts via `expectRangeError` (`:45-54`) and a 2000 ms ceiling per call (`:253`). Work
  is bounded in `src/advice/equity.ts` by `FEASIBILITY_NODE_LIMIT = 100_000` (`:45`, applied at `:289`) and
  `maxRejections = 100 * trials` (`:283`, thrown at `:321`). Not locked.
- Full-speed commands (must stay unchanged, AC#2):
  - `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts`
    (`doit/TASK-1.2/spec.md:242`, `doit/TASK-1.2/story-doc.md:90`)
  - `EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts` (`doit/TASK-7.1/spec.md:314`,
    `doit/TASK-7.1/story-doc.md:80`)
- Locked tests (from `doit/*/state.json` `locked_tests`): TASK-1.2 acceptance/property/reference-ranking, TASK-7.1
  `equity.acceptance.test.ts`, TASK-1.19 `retry.test.ts` + `workflow.test.ts`, TASK-1.7 `workflow.test.ts`, TASK-1.3
  `deck.acceptance.test.ts` + `e2e/replay-seed.spec.ts`. None of the files this task modifies is locked.
- README: "Commands" table (`README.md:14-27`), "Continuous integration" (`README.md:29-48`), "Conventions"
  (`README.md:50`). No mention of speed targets today.
- Locally both affected tests run in well under 1 s (measured: evaluator perf file 0.37 s, bounded-work test
  0.35 s), so the nested runs in the new acceptance test are cheap.
- Existing code to reuse:
  - `tests/support/sandbox.ts:15` `REPO_ROOT` → cwd for the nested Vitest.
  - `tests/support/sandbox.ts:30-46` `SCRUBBED_ENV_PREFIXES` + `sandboxEnv()` → env for a nested Vitest without
    the parent's `VITEST*`/`NODE_V8_COVERAGE` variables (export it instead of copying it).
  - `tests/ci/retry.sudo.test.ts:37` → the `process.env.CI === 'true'` convention.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Gate speed assertions on `CI=true` inside the existing perf tests (report-only in CI) | Vitest project split / excluding perf files from `npm test`; CI env vars in `ci.yml` lowering thresholds; Vitest `bench` | Keeps correctness asserts running in CI (AC#1) with no workflow edit (locked `workflow.test.ts` pins its shape). Lowered thresholds would still be a wall-clock limit that a slow runner can miss | no | n/a |
| D-2 | Bounded-work proof in CI = existing error-message asserts (the rejection cap / feasibility budget ended the call) + a generous CI-only ceiling of 10,000 ms | An operation counter exported from `src/advice/equity.ts` | AC#3 allows either. A counter adds test-only state to production code and widens scope into `src/` (coverage-gated) | no | n/a |
| D-3 | A shared helper `tests/support/speed.ts` instead of repeating the `CI` check in three files | Inline `process.env.CI === 'true'` in each file | One rule, one note text, unit-testable | no | n/a |

## 5. Design

### Files to create / modify
- `tests/support/speed.ts` — `speedLimitsEnforced()` and `SPEED_LIMITS_NOT_ENFORCED` (create)
- `tests/support/speed.test.ts` — unit tests of the helper (create)
- `tests/ci/speed-limits.acceptance.test.ts` — spawns the perf suites with impossible limits, with and without `CI=true` (create)
- `tests/support/sandbox.ts` — export `sandboxEnv` (modify, 1 line)
- `tests/engine/hand-evaluator.perf.test.ts` — gate speed asserts; header comment (modify)
- `tests/advice/equity.perf.test.ts` — gate speed asserts; header comment (modify)
- `tests/advice/equity.test.ts` — CI-only 10,000 ms ceiling for the bounded-work test; comment (modify)
- `README.md` — "Speed targets" section (modify)

### Components, interfaces and data
**`tests/support/speed.ts`**
```ts
/** Printed by speed tests when they measure but do not enforce their limits. */
export const SPEED_LIMITS_NOT_ENFORCED = 'speed limits not enforced (CI=true)';
/** False on CI (CI=true): shared runners vary too much for wall-clock limits. True otherwise. */
export function speedLimitsEnforced(env: NodeJS.ProcessEnv = process.env): boolean;
```
- Returns `env.CI !== 'true'`.

**`tests/engine/hand-evaluator.perf.test.ts`**
- Header comment (above the imports) stating: real targets (≥ 10,000,000 evals/s, build ≤ 50 ms) are enforced
  only by `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts`
  on the reference machine (Apple-silicon Mac, Node 22.18.0); local `npm test` enforces the slack floor; CI
  (`CI=true`) prints the numbers but does not enforce any speed limit.
- `const ENFORCED = speedLimitsEnforced();` The `console.log` line gets `; ${SPEED_LIMITS_NOT_ENFORCED}` appended
  when not enforced. `expect(checksum).toBe(warmUp)` and `expect(checksum).toBeGreaterThan(0)` always run. The
  rate and build asserts run only when `ENFORCED`. Test name unchanged.

**`tests/advice/equity.perf.test.ts`**
- Header comment as above for `EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts`.
- Per scenario the method assert (`expect(used, name).toBe(method)`) always runs. A p95 over the limit is pushed to
  `failures` only when enforced. When not enforced, log `SPEED_LIMITS_NOT_ENFORCED` once per test. `expect(failures).toEqual([])`
  stays. Test name unchanged.

**`tests/advice/equity.test.ts`** (bounded-work test only)
- `const BOUNDED_WORK_MS = speedLimitsEnforced() ? 2000 : 10_000;` replaces the literal 2000 at `:253`, with a
  comment: the error messages prove the rejection cap / feasibility budget ended each call; the ceiling catches a
  much larger budget; CI uses 10 s because shared runners are slow. Everything else unchanged.

**`tests/support/sandbox.ts`**: `function sandboxEnv()` becomes `export function sandboxEnv()`. No behaviour change.

**`tests/ci/speed-limits.acceptance.test.ts`** — `describe('speed limits in CI', …)`; each test spawns
`spawnSync('npx', ['vitest', 'run', ...files], { cwd: REPO_ROOT, encoding: 'utf8', env, timeout: 120_000 })`
with `env = { ...sandboxEnv(), ...overrides }` (and `CI` deleted for the local case). Impossible limits:
`EVALUATOR_MIN_EVALS_PER_SEC=1e15`, `EVALUATOR_MAX_BUILD_MS=0`, `EQUITY_PERF_SCALE=0`. Each test has a 120 s timeout.

### Rules and algorithms
- Enforced ⇔ `env.CI !== 'true'`. Examples: `{}` → true; `{CI: 'true'}` → false; `{CI: 'false'}` → true;
  `{CI: ''}` → true; `{CI: '1'}` → true (A-1).
- Bounded-work ceiling: enforced → 2000 ms; not enforced → 10,000 ms; applied to each of the three calls.

### Error handling and configuration
- No new env vars. Existing threshold vars keep their defaults and meaning when enforced; they are ignored when
  `CI=true` (A-4).
- A failing correctness assert in CI fails the test exactly as before.

## 6. Behaviour specification

### SPEC-01: Enforcement rule
- Verifies: AC#1, AC#2
- Behaviour: Given an env object, When `speedLimitsEnforced(env)` is called, Then it returns false for `{CI: 'true'}` and true for `{}`, `{CI: 'false'}`, `{CI: ''}` and `{CI: '1'}`; and `SPEED_LIMITS_NOT_ENFORCED === 'speed limits not enforced (CI=true)'`.
- Verification: unit `tests/support/speed.test.ts::speedLimitsEnforced > enforces speed limits unless CI is exactly "true"`

### SPEC-02: CI does not fail the perf suites on speed alone
- Verifies: AC#1
- Behaviour: Given `CI=true` and impossible limits (`EVALUATOR_MIN_EVALS_PER_SEC=1e15`, `EVALUATOR_MAX_BUILD_MS=0`, `EQUITY_PERF_SCALE=0`), When `npx vitest run tests/engine/hand-evaluator.perf.test.ts tests/advice/equity.perf.test.ts` runs, Then it exits 0, its output contains `speed limits not enforced (CI=true)` and `seven-card evals/s`, and reports 2 passed tests.
- Verification: acceptance `tests/ci/speed-limits.acceptance.test.ts::speed limits in CI > CI=true reports but does not enforce the perf limits`

### SPEC-03: Local runs still enforce the limits
- Verifies: AC#2
- Behaviour: Given `CI` unset and the same impossible limits, When the same command runs, Then it exits non-zero, both tests fail, and the output does not contain `speed limits not enforced`.
- Verification: acceptance `tests/ci/speed-limits.acceptance.test.ts::speed limits in CI > without CI the perf limits are enforced`

### SPEC-04: Correctness assertions still run in CI
- Verifies: AC#1
- Behaviour: Given `CI=true`, When the perf suites run, Then the checksum asserts (`checksum === warmUp`, `checksum > 0`) and the per-scenario method asserts still execute: with a mutation that sets `EXACT_EVALUATION_LIMIT` in `src/advice/equity.ts:39` to `50_000` (the "HU turn vs every unseen combo" scenario estimates 1035 × 44 × 2 = 91,080 evaluations, so it flips from exact to sampled), `CI=true npx vitest run tests/advice/equity.perf.test.ts` fails on a method mismatch; reverted, it passes.
- Verification: manual mutation probe: edit `EXACT_EVALUATION_LIMIT` to `50_000`, run `CI=true npx vitest run tests/advice/equity.perf.test.ts` (exit ≠ 0, the failure names `HU turn vs every unseen combo`), revert, rerun (exit 0); plus read `tests/engine/hand-evaluator.perf.test.ts` to confirm the two checksum asserts are unconditional

### SPEC-05: Full-speed commands unchanged
- Verifies: AC#2
- Behaviour: Given a local shell without `CI` on the reference machine, When the two documented full-speed commands run, Then they enforce the original targets (≥ 10,000,000 evals/s and build ≤ 50 ms; every equity scenario p95 ≤ its target × 1) and exit 0; the threshold env names and defaults in both perf files are unchanged (`git diff` of those lines empty).
- Verification: command `EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts && EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts` exits 0 (with `CI` unset) and `git diff 9c581c5 -- tests/engine/hand-evaluator.perf.test.ts tests/advice/equity.perf.test.ts | grep -E '^[-+].*(EVALUATOR_MIN_EVALS_PER_SEC|EVALUATOR_MAX_BUILD_MS|EQUITY_PERF_SCALE) \?\?'` prints nothing

### SPEC-06: Bounded-work test still proves bounded work in CI
- Verifies: AC#3
- Behaviour: Given `CI=true`, When `computeEquity > bounds the work when range sets cannot all be dealt` runs, Then it runs (not skipped), asserts the three error messages, and asserts each call takes < 10,000 ms; without `CI` the ceiling is 2000 ms. With a mutation that raises `maxRejections` to `100_000 * trials` in `src/advice/equity.ts:283`, the test fails under `CI=true` (timing assert or test timeout); reverted, it passes.
- Verification: command `CI=true npx vitest run tests/advice/equity.test.ts -t "bounds the work"` exits 0 and reports `1 passed`; then manual mutation probe as described (exit ≠ 0 under `CI=true`), revert

### SPEC-07: Docs name the enforcing commands
- Verifies: AC#4
- Behaviour: Given the README and both perf test files, When a developer reads them, Then `README.md` has a `## Speed targets` section (after "Continuous integration") that lists both full-speed commands verbatim with their targets (≥ 10,000,000 evals/s, table build ≤ 50 ms; equity p95 targets at scale 1), says they run on the reference machine (Apple-silicon Mac, Node 22.18.0) with `CI` unset, says local `npm test` keeps only slack checks, and says CI (`CI=true`) prints the measurements but enforces no speed limit (the bounded-work test uses a 10 s ceiling there); and each perf file's header comment names its full-speed command and says CI does not enforce it.
- Verification: command `grep -n "## Speed targets" README.md && grep -c "EVALUATOR_MIN_EVALS_PER_SEC=10000000 EVALUATOR_MAX_BUILD_MS=50 npx vitest run tests/engine/hand-evaluator.perf.test.ts\|EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts" README.md tests/engine/hand-evaluator.perf.test.ts tests/advice/equity.perf.test.ts` → section found, each file count ≥ 1; then manual read of the section and headers for the CI statement

### SPEC-08: Everything passes in CI and locally
- Verifies: AC#1, AC#2, AC#3
- Behaviour: Given the change, When `npm run lint && npm run typecheck && npm test` runs locally (no `CI`) and the pushed branch `doit/TASK-1.20` runs in GitHub Actions, Then all exit 0 / the run concludes `success`, and the CI `Test` step log contains `speed limits not enforced (CI=true)`.
- Verification: command `npm run lint && npm run typecheck && npm test` exits 0; after the user pushes: `R=$(gh repo view --json nameWithOwner -q .nameWithOwner); id=$(gh run list -R "$R" --branch doit/TASK-1.20 --event push --workflow CI --limit 1 --json databaseId -q '.[0].databaseId'); gh run view "$id" -R "$R" --json conclusion -q .conclusion` → `success` and `gh run view "$id" -R "$R" --log | grep -c "speed limits not enforced (CI=true)"` ≥ 1

## 7. Edge cases
- `CI` set to other values (`1`, `false`, empty): treated as local (enforced) — SPEC-01, A-1.
- Developer runs a full-speed command with `CI=true` exported in their shell: limits not enforced, but the output
  shows the note — SPEC-02 output, A-4, README text (SPEC-07).
- Nested Vitest inherits the parent's `VITEST*`/coverage env: scrubbed by `sandboxEnv()` — SPEC-02/03.
- Parent `npm test` in CI has `CI=true`: the local-case test deletes `CI` from the child env — SPEC-03.
- Slow CI runner pushes a bounded-work call past 10 s: the test fails, which is the intended signal (≥ 3.7×
  headroom over the worst observed) — A-2.
- Concurrency: the nested runs share CPU with other test files; in CI no speed limit applies, and SPEC-03 uses
  impossible limits so it fails regardless of load.
- Interruption / permissions / invalid input: N/A — test-only change with no new inputs.

## 8. Security considerations
- Trust boundaries: none new; env is read only to choose test thresholds.
- Secrets: the nested Vitest gets the parent env minus the scrubbed prefixes, same as the existing sandbox
  helper; nothing is logged beyond test output.
- Injection: `spawnSync` with an argument array, no shell.
- New dependencies: none. Randomness: N/A.

## 9. Non-functional
- Real targets unchanged: evaluator ≥ 10,000,000 evals/s and build ≤ 50 ms; equity p95 targets 15/2/20/15/20/50/80
  ms (`tests/advice/equity.perf.test.ts:38-44`), measured by the SPEC-05 commands on the reference machine.
- Local `npm test` slack checks unchanged (A-5).
- CI: no speed limit enforced in the perf suites; bounded-work ceiling 10,000 ms per call.
- Test time: the new acceptance file adds two nested runs of the two perf suites (about 2–4 s locally; expected
  ≤ 40 s total on CI without coverage), each bounded by a 120 s timeout.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `CI=true EVALUATOR_MIN_EVALS_PER_SEC=1e15 EVALUATOR_MAX_BUILD_MS=0 EQUITY_PERF_SCALE=0 npx vitest run tests/engine/hand-evaluator.perf.test.ts tests/advice/equity.perf.test.ts` → exit 0 with the "not enforced" note; the same without `CI=true` → exit ≠ 0
- New tests (path → SPEC ids):
  - `tests/support/speed.test.ts` → SPEC-01
  - `tests/ci/speed-limits.acceptance.test.ts` → SPEC-02, SPEC-03
  - existing `tests/advice/equity.test.ts` bounded-work test → SPEC-06
- End-to-end scenario for the Judge: run the Run command both ways; run the SPEC-05 full-speed commands on the
  reference Mac; run the SPEC-04 and SPEC-06 mutation probes (revert after each); read the README section and the
  perf headers (SPEC-07); after the user pushes `doit/TASK-1.20`, run the SPEC-08 `gh` commands.

## 11. Open questions
- (none)

## 12. Clarifications log
See `doit/TASK-1.20/qa.md`.
