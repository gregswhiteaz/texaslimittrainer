# Spec: TASK-7.18 — Restore equity calculation performance headroom

Status: READY (approved 2026-11-25)
Task: TASK-7.18 · Parent/epic: TASK-7 · Requirements: n/a (follow-up of TASK-7.1, TASK-7.3 doc-17, TASK-7.8 review) · Dream: limit-holdem-trainer

## 1. Summary
The sampled equity engine runs the full-ring scenario at 90% of its p95 target, and postflop advice with 9
opponents now takes ~202 ms against a 100 ms target. This is because TASK-7.8's second equity run (the calling
range) uses up the sampler's whole 3,000,000-rejection budget before the A-7 fallback fires. The fix has three
parts. (1) Make the sampler's inner loop cheaper without changing its random stream, so every result stays
byte-identical. (2) Stop a sampled run early, with the same error, once it is statistically certain to run out
of its rejection budget. (3) Remove the global 30 s `testTimeout` and give explicit timeouts only to the tests
that need them. The speed checks stay opt-in, run by the existing env-var commands and `npm run test:slow`.

## 2. Scope
- In scope:
  - `sampledEquity` inner loop: generation stamps instead of the reset loop, hole cards written only once a
    deal is accepted, and xoshiro128** state kept in local variables (the same generator and the same draw
    order as `Xoshiro128`).
  - Early abort in `sampledEquity`: it throws the existing `RangeError('Sampling rejected too many deals')` once
    the projection in §5 says the rejection cap can't be met (Q-1).
  - Perf harness: untimed warm-up calls before timing in both advice/equity perf tests (Q-2), and a new
    9-opponent "nothing owed" value-bet advice scenario at 100 ms that runs only with `TLH_SLOW_TESTS=1`.
  - `vite.config.ts`: remove `testTimeout: 30_000` so Vitest's default 5,000 ms applies. Every test measured
    over 1,000 ms under `npm test` sets its own 30 s limit with one `vi.setConfig` line (Q-3: 42 files, 30 of them
    locked and unlocked by their owners for a timeout-only edit). Every other test runs under Vitest's default
    5,000 ms.
  - README "Speed targets": add the advice command and the 75% headroom commands.
- Not doing:
  - No change to equity semantics, `SAMPLE_TRIALS`, `EXACT_EVALUATION_LIMIT`, `FEASIBILITY_NODE_LIMIT`, the
    default `maxRejections = 100 * trials`, `deriveSeed`, canonicalisation, the A-7 fallback in `postflop.ts`, or
    `BOT_EQUITY_BUDGET`.
  - No change to `src/engine/hand-evaluator.ts` or `src/engine/seeded-random.ts`. An unchecked evaluator was
    prototyped and saved only about 3%, so it isn't worth touching the TASK-1.2 files.
  - No change to perf targets, `RUNS = 20`, the p95 definition (`times[RUNS - 2]`), or `cpuNowMs`.
  - No speed-up for the HU and 6-max advice scenarios (22.6/25 and 21.5/25 ms). They aren't in the ACs (scope
    concern SC-2).
  - The existing perf files are not moved out of `npm test`, where they run at 20× slack and CI doesn't enforce
    them (SC-1).
  - No change to playtest, bot, or grading code.
- Scope budget: files=54, lines=380

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | "Reference Mac" = this machine: Apple M4 Pro, arm64, Node v22.18.0, `CI` unset (README.md:217-220). The baseline numbers in §9 were measured here on 2026-11-25. | yes | README names exactly this setup | a different machine |
| A-2 | AC#1 "p95 ≤ 75% of target" is checked by running the existing command at scale 0.75: `EQUITY_PERF_SCALE=0.75 …` makes the limit `target × 0.75` (`tests/advice/equity.perf.test.ts:12,70`). It must pass 3 runs in a row. | yes | Uses the test's own scale knob; no new code | a separate 75% assertion in the test |
| A-3 | AC#3's 75 ms applies to the existing "10-seat flop vs 9 opponents" scenario (`tests/advice/postflop.perf.test.ts:81`), which faces a bet and already makes both equity runs (`src/advice/postflop.ts:155,183-191`). The task text's "currently 71.5 ms" predates TASK-7.8; the measured baseline is 201.87 ms. | yes | Same spot and target the AC names | a new scenario |
| A-4 | AC#4's "value betting" spot is a new scenario: 10 seats, everyone limps and the BB checks, and the flop is checked to the SB (seat 2, nothing owed, so `bet` is legal and the value-bet rule is evaluated). Target 100 ms. It runs only when `TLH_SLOW_TESTS=1` (standing rule: speed checks are opt-in). `postflop.perf.test.ts` is added to `npm run test:slow`. | yes | AC#3 covers the facing-a-bet (value-raise) path; this covers the bet path | reuse AC#3's scenario only |
| A-5 | "Tests that need longer" = tests that set no timeout of their own and take more than 1,000 ms under `npm test` (`vitest run --coverage`) on the reference Mac (Q-3). That leaves at least 5× headroom under the 5,000 ms default, because CI runners are slower (TASK-1.56). Measured with `npx vitest run --coverage --testTimeout=1000`: 59 tests in 42 files (§10). Each of those files sets 30 s for itself; every other file gets the 5,000 ms default. | yes | Threshold given in the Q-3 answer | 2,000 ms (26 files) |
| A-6 | The inline generator is seeded exactly like `Xoshiro128`: state = the first four outputs of `splitMix32(deriveSeed(c))` (`src/engine/seeded-random.ts:50-58`), and every draw is `Math.floor(u32 * n / 2^32)` (`seeded-random.ts:83-85`). | yes | Byte-identical results require the same stream | add a state accessor to `Xoshiro128` |

## 3. Current system
- Equity engine: `src/advice/equity.ts`. `computeEquity` → `equityWithBudget` (`:394-408`) → `exactEquity` or
  `sampledEquity` (`:314-382`). The sampler draws one combo per opponent from its flat range with
  `rng.nextInt(len)`. It rejects the whole attempt on the first card collision (`:353-371`) and throws
  `RangeError('Sampling rejected too many deals')` after `maxRejections = 100 * trials` rejections (`:317,369`).
  It then deals the runout with `rng.nextInt(52)`, skipping dealt cards (`:372-378`), and calls `table.score()`.
  Opponent combos never contain hero or board cards (`canonicalise` drops them, `:107`), so only the runout
  needs the dead-card check.
- RNG: `Xoshiro128` (`src/engine/seeded-random.ts:44-85`) has private state. `splitMix32` is exported (`:14`).
- Advice: `recommendPostflop` (`src/advice/postflop.ts:118`) makes the whole-range run (`:155`) and then the
  calling-range run (`:183-191`). If the calling-range run throws a `RangeError`, A-7 falls back to `equityPct`.
- Perf tests (CPU time, `tests/support/speed.ts:11-14`; enforced unless `CI=true`):
  `tests/advice/equity.perf.test.ts` (TASK-7.1; `EQUITY_PERF_SCALE`, default 20) and
  `tests/advice/postflop.perf.test.ts` (TASK-7.3; `ADVICE_PERF_SCALE`, default 20). Both do 1 warm-up call and
  then 20 timed runs, with p95 = `times[18]`.
- Timeouts: `vite.config.ts:13` `testTimeout: 30_000`, added by TASK-7.1 Q-5 for AC#2 of
  `tests/advice/equity.acceptance.test.ts` (commit 8cda46d; `doit/TASK-7.1/qa.md:22-26`). Many slow tests
  already set their own timeouts (e.g. `TEST_TIMEOUT_MS = 120_000` in `tests/advice/value-bet.acceptance.test.ts:39`
  and `tests/bots/*.test.ts`). A full run with `--testTimeout=5000` (no coverage) passed all 1,420 tests.
- Slow group: `npm run test:slow` (`package.json`, `TLH_SLOW_TESTS=1 vitest run <files>`), and tests gate with
  `const SLOW = process.env.TLH_SLOW_TESTS === '1'` (`tests/advice/postflop-folding.acceptance.test.ts:23`).
- Commands: `npm test` = `vitest run --coverage`; `npm run lint` = sync-copies + eslint + prettier check;
  `npm run typecheck` = `tsc -p tsconfig.json`; `npm run format` = `prettier --write .`.

### Locked tests that pin equity numbers or latency (Q-3: only the timeout-only `vi.setConfig` line may be added to those in §10)
| File | Owner | Pins |
|---|---|---|
| `tests/advice/equity.acceptance.test.ts` | TASK-7.1 | equity vs reference (±1.5 pts); determinism in-process and in a fresh process; seed independence; AC#4 has its own 60 s timeout |
| `tests/advice/equity-multiway.acceptance.test.ts` | TASK-7.7 | multiway equity, order invariance |
| `tests/advice/value-bet.acceptance.test.ts` | TASK-7.8 | exact calling-range percentages (72.8%, 48.9%, …) and the A-7 path; `TEST_TIMEOUT_MS` 120 s |
| `tests/advice/determinism.acceptance.test.ts` | TASK-7.15 | hint and grade determinism (sampled method), 300 s timeout |
| `tests/golden/postflop.acceptance.test.ts`, `tests/golden/suite.acceptance.test.ts`, `tests/golden/postflop-spots.json`, `tests/golden/graded-examples.json` | TASK-7.14 | golden postflop equity, actions and grades |
| `tests/advice/postflop.acceptance.test.ts` | TASK-7.3, TASK-7.9 | postflop advice output |
| `tests/advice/implied-odds.acceptance.test.ts` (7.9), `postflop-folding.acceptance.test.ts` (7.32), `postflop-coverage.acceptance.test.ts` (7.22), `table-sizes.acceptance.test.ts` (7.6), `range-model.acceptance.test.ts` (7.5), `observed-ranges.acceptance.test.ts` (7.13), `grade.acceptance.test.ts` (7.4), `grade-hardening.acceptance.test.ts` (7.23), `value-copy.acceptance.test.ts` (8.1), `explanations.acceptance.test.ts` (7.10) | as listed | advice built from equity results |
| `tests/playtest/check-advice.acceptance.test.ts` (7.15), `tests/ui/advice-worker.acceptance.test.ts` (3.6), bot postflop tests `tests/bots/rock-postflop…` (6.16/6.17), `calling-station-postflop…` (6.17) | as listed | bot decisions use `BOT_EQUITY` → sampled results |

No locked test pins latency. Both perf files are unlocked. Because D-1 keeps every successful result
byte-identical, none of these tests should change except for the `vi.setConfig` timeout line in the §10 files (Q-3).

- Existing code to reuse (path → what to reuse instead of writing new):
  - `src/engine/seeded-random.ts` `splitMix32` → seeding the inline generator (A-6).
  - `tests/support/speed.ts` `cpuNowMs`, `speedLimitsEnforced` → timing in the perf tests (unchanged).
  - `tests/advice/postflop.perf.test.ts` `viewAfter`, `fullRingPreflop`, `slowScenarios` → the new AC#4 scenario.
  - `tests/advice/equity.test.ts` helpers `hole`, `everyCombo`, `expectRangeError` → new unit tests.
  - `src/advice/ranges.ts` `unseenCombos`, `callingRange` → the calling-range input in unit tests.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Speed up the sampler loop while keeping its random stream. Generation stamp `Uint32Array(52)` per attempt (no reset loop). Picks go into a scratch `Uint8Array` and are copied into `hands` only on acceptance. Xoshiro state is held in locals. Results stay byte-identical. | Unchecked/incremental evaluator (prototype: −3%); deal "unseen" opponents straight from the deck (much faster, but it changes every seeded result → golden, playtest and bot hashes) | Prototype: full ring 71.9 → 51.8 ms p95 in Vitest with identical JSON output (HU, 5-way, 9-way checked) | yes (touches the TASK-7.1 engine) | n/a — no output change |
| D-2 | Early abort (§5 rule): z = 8 Wilson upper bound, checked every 8,192 rejections; the error message is unchanged | Smaller `maxRejections` for the calling-range run (changes advice wherever p is between 1/101 and the new cap); skip the calling-range run at ≥ N opponents (changes value advice); leave as is (fails AC#3/#4) | Only runs that would almost surely exceed the cap anyway end sooner; successful results don't change (false-abort probability below 1e-14 per run) | yes | user (Q-1) |
| D-3 | Perf tests make `WARMUP_RUNS = 15` untimed calls per scenario before the 20 timed runs | Keep 1 warm-up (HU flop vs every combo stays at 75–110% of 20 ms, so AC#1 fails); switch to wall-clock time (undoes the CPU-time choice) | `process.cpuUsage` counts V8's background compiler threads: measured run 8 was 19.0 ms CPU but 7.9 ms wall; steady state is 4.7 ms. With 15 warm-ups the prototype's p95 was 5.0–6.5 ms | yes (measurement method) | user (Q-2) |
| D-4 | Remove the global `testTimeout`, so Vitest's default 5,000 ms applies to every test. The 42 files in §10 (over 1,000 ms under coverage) set 30 s themselves with one `vi.setConfig({ testTimeout: 30_000 })` line | Keep 30 s globally (AC#2 fails); per-test arguments; a config project; 2,000 ms threshold | AC#2. One line per file is the smallest edit. The 1,000 ms threshold leaves CI headroom | yes (30 locked files) | user (Q-3) |

## 5. Design

### Files to create / modify
- `src/advice/equity.ts` — D-1 loop, D-2 early abort, exported `@internal` `SAMPLER_ABORT_Z`,
  `SAMPLER_CHECK_EVERY`, `rejectionsOverBudget`.
- `tests/advice/equity.test.ts` — unit tests SPEC-04, SPEC-05, SPEC-06.
- `tests/advice/equity.perf.test.ts` — `WARMUP_RUNS = 15` (D-3); header comment notes the 0.75 command.
- `tests/advice/postflop.perf.test.ts` — `WARMUP_RUNS = 15`, new SLOW-gated nothing-owed 9-opponent scenario
  (A-4), `slowScenarios` gets an `owed` flag (default `true`) for the `callAmount` assertion.
- `vite.config.ts` — remove `testTimeout: 30_000`.
- `package.json` — append `tests/advice/postflop.perf.test.ts` to `test:slow`.
- `README.md` — Speed targets: advice command, and the 0.75 headroom commands.
- The 42 test files in §10 "Measured timeout list" (41 besides `tests/advice/equity.test.ts`, which is already
  listed): one line each near the top, `vi.setConfig({ testTimeout: 30_000 });` after the imports, so every test
  in that file sets its own 30 s limit (Q-3). Files that already import `vi` reuse the import; the others add
  `vi` to their `vitest` import. No other edits in those files.

### Components, interfaces and data
- `sampledEquity(c, trials, maxRejections = 100 * trials): EquityResult`: signature, errors and results
  unchanged.
- `export const SAMPLER_CHECK_EVERY = 8192` (@internal) — how often (in rejections) the abort projection runs.
- `export const SAMPLER_ABORT_Z = 8` (@internal).
- `export function rejectionsOverBudget(accepted: number, rejections: number, trials: number, maxRejections: number): boolean`
  (@internal, pure). True iff `rejections + projected > maxRejections` (rule below).
- Inline generator: `const next = splitMix32(deriveSeed(c)); let s0 = next() | 0, s1 = next() | 0, s2 = next() | 0, s3 = next() | 0;`.
  Each draw applies the exact `Xoshiro128.nextUint32` update (`seeded-random.ts:68-80`) and then
  `Math.floor((u * n) / 4294967296)`. Opponent picks and runout cards draw from the same stream in the same
  order as today. A small local helper is fine if it keeps the stream identical.
- Invariant: for every input where today's `sampledEquity` returns, the new one returns a JSON-identical result.
  Where today's throws, the new one throws the same error, possibly sooner.

### Rules and algorithms
- Early abort: on a rejection, after `++rejections`, keep the existing check
  `if (rejections > maxRejections) throw …`. Then, if `rejections % SAMPLER_CHECK_EVERY === 0` and
  `rejectionsOverBudget(table.trials, rejections, trials, maxRejections)`, throw the same
  `RangeError('Sampling rejected too many deals')`.
- `rejectionsOverBudget(a, r, T, M)`: `n = a + r`, `z = SAMPLER_ABORT_Z`,
  `pHi = (a + z²/2 + z·√(a + z²/4)) / (n + z²)`, `projected = (T − a)·(1 − pHi)/pHi`; return `r + projected > M`.
  Worked examples (T = 30,000, M = 3,000,000 unless stated):
  - a = 0, r = 8,192 → pHi = 0.007752, projected ≈ 3,840,000 → **true**.
  - a = 147, r = 24,576 → pHi = 0.011342, projected ≈ 2,602,194 → **false**.
  - a = 150, r = 32,768 → pHi = 0.008643, projected ≈ 3,423,698 → **true** (the 9-opponent calling-range
    spot, acceptance ≈ 0.0049, stops here: about 33k attempts instead of about 3M).
  - a = 1,000, r = 32,768 → pHi = 0.038041, projected ≈ 733,338 → **false** (the whole-range 9-opponent run,
    acceptance ≈ 0.028, is never aborted).
  - T = 500, M = 50,000, a = 0, r = 8,192 → projected 64,000 → **true**; a = 40 → 28,480 → **false**.
- Why it is safe: pHi is an 8σ upper bound on the true acceptance rate p. An abort means that even at pHi the
  expected remaining rejections overflow the cap. With at most 30,000 accepted, pHi is ≥ 4.6% above p. The real
  run would then succeed only if the negative-binomial rejection count came in ≥ 8σ below its mean. Both events
  are < 1e-14.

### Error handling and configuration
- Errors are unchanged: `RangeError('Sampling rejected too many deals')`,
  `RangeError("Opponents' hands cannot all be dealt together")`, and validation errors. There are no new env
  vars. `WARMUP_RUNS` is a constant in each perf file.

## 6. Behaviour specification

### SPEC-01: Equity scenarios have 25% headroom
- Verifies: AC#1
- Behaviour: Given the reference Mac with `CI` unset, When `EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts` runs 3 times in a row, Then each run passes. Every scenario's logged p95 ≤ 0.75 × target (HU flop vs every unseen combo ≤ 15 ms; full ring flop vs 9 ranges ≤ 60 ms), and every scenario keeps its expected method.
- Verification: command `for i in 1 2 3; do EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts || exit 1; done`

### SPEC-02: Default per-test timeout everywhere except tests that set their own
- Verifies: AC#2
- Behaviour: Given `vite.config.ts`, When it is read, Then `test` has no `testTimeout` key, so every test without its own limit gets Vitest's default 5,000 ms. Each of the 42 files in §10 has exactly one added `vi.setConfig({ testTimeout: 30_000 });` after its imports, and no file outside §10 gains a `vi.setConfig` timeout. When `npm test` runs on the reference Mac, all tests pass.
- Verification: command `! grep -n "testTimeout" vite.config.ts && test "$(grep -rl 'vi.setConfig({ testTimeout: 30_000 })' tests src | wc -l | tr -d ' ')" = 42 && npm test`

### SPEC-03: 9-opponent advice facing a bet within 75 ms
- Verifies: AC#3
- Behaviour: Given the reference Mac with `CI` unset, When `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts` runs 3 times, Then each run passes and the logged `10-seat flop vs 9 opponents` p95 is ≤ 75.00 ms.
- Verification: command `for i in 1 2 3; do ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts | grep "10-seat flop vs 9 opponents:"; done` (each line p95 ≤ 75.00 ms; exit 0)

### SPEC-04: 9-opponent value-bet advice within 100 ms
- Verifies: AC#4
- Behaviour: Given a 10-seat flop checked to the SB with 9 live opponents (nothing owed; `bet` legal), When `TLH_SLOW_TESTS=1 ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts` runs, Then the new test `value-bet postflop advice latency within target times slack` passes with p95 ≤ 100 ms. Both equity runs happen (the calling-range run throws and the A-7 fallback applies), and `callAmount` is 0. Without `TLH_SLOW_TESTS=1` the test is skipped.
- Verification: command `TLH_SLOW_TESTS=1 ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t "value-bet postflop advice latency"`

### SPEC-05: Sampled results are byte-identical to the pre-change sampler
- Verifies: AC#1, AC#3, AC#4
- Behaviour: Given these inputs: HU preflop AsKs vs QhQd; HU flop AhKh on Qh7h2c vs every unseen combo; 6-max preflop AhKh vs 5 every-combo ranges; full ring Qh7h2c vs 9 every-combo ranges; 8 opponents holding `callingRange(unseen, Qh7h2c)`; and `BOT_EQUITY` on the 6-max input. When `computeEquity` / `BOT_EQUITY` run, Then the SHA-256 of `JSON.stringify` of the result list equals the hash pinned from base commit 6622918. The builder computes it there before editing and records the command in build-log.md.
- Verification: unit `tests/advice/equity.test.ts::sampled results are byte-identical to the pre-TASK-7.18 sampler`

### SPEC-06: Early abort throws the same error sooner and never aborts a feasible run
- Verifies: AC#3, AC#4
- Behaviour: Given the §5 worked examples, When `rejectionsOverBudget` is called, Then it returns exactly the listed true/false values. Given 9 opponents each holding `callingRange(unseenCombos(AhKh Qh7h2c), Qh7h2c)`, When `computeEquity` runs, Then it throws `RangeError('Sampling rejected too many deals')`. Given 9 every-unseen-combo ranges on the same board, Then it returns `method: 'sampled'` with `trials: 30000`. The existing `bounds the work when range sets cannot all be dealt` test still passes unchanged.
- Verification: unit `tests/advice/equity.test.ts::sampler aborts early only when the rejection cap cannot be met`

### SPEC-07: Advice, golden and playtest outputs unchanged
- Verifies: AC#3, AC#4
- Behaviour: Given the base commit and the change, When the default playtest runs (`npm run playtest`, 10,000 hands, seed 42), Then its stdout SHA-256 is the same on both. The locked golden suites (`tests/golden/*.acceptance.test.ts`), `tests/advice/value-bet.acceptance.test.ts`, `tests/advice/determinism.acceptance.test.ts` and `tests/advice/equity.acceptance.test.ts` pass with no assertion edits.
- Verification: command `npm run playtest | shasum -a 256` (equal to the base value in build-log.md) `&& npx vitest run tests/golden tests/advice/value-bet.acceptance.test.ts tests/advice/determinism.acceptance.test.ts tests/advice/equity.acceptance.test.ts`

## 7. Edge cases
- 1 opponent / no rejections possible: the abort check never runs (it runs only on rejection) — SPEC-05 HU inputs.
- An infeasible deal: the existing feasibility check throws first, unchanged — SPEC-06 (existing bounded-work test).
- A run that would end exactly at the cap: the `rejections > maxRejections` check is unchanged; the abort rule
  only adds earlier throws — SPEC-06.
- Small bot budgets (fewer trials, smaller cap): the rule scales with T and M — SPEC-06 worked example (T = 500).
- River (need = 0): the runout loop does nothing; the stamps still reset per attempt — SPEC-05 relies on
  existing exact/sampled coverage. River inputs are exact under the default budget.
- Concurrency, interruption, permissions: N/A (pure synchronous function).

## 8. Security considerations
- Trust boundaries: none new. Input validation in `canonicalise` is unchanged.
- Randomness: the sampler uses a deterministic seeded PRNG, not a fairness/security RNG (the deck shuffle is
  untouched). The stream is preserved exactly (A-6, SPEC-05).
- Bounded work: the early abort only shortens failing runs. The cap and the feasibility budget still bound
  every call.
- No new dependencies, secrets or logging.

## 9. Non-functional
Baseline on the reference Mac (2026-11-25, Vitest, CPU-time p95 of 20 runs, 1 warm-up):

| Scenario | Target | Baseline p95 | % | Required (≤75%) |
|---|---|---|---|---|
| HU preflop hand vs hand | 15 | 5.27 | 35% | 11.25 |
| HU flop hand vs hand | 2 | 0.59 | 30% | 1.5 |
| HU flop vs every unseen combo | 20 | 15.03 | 75.2% | 15 |
| HU turn vs every unseen combo | 15 | 6.43 | 43% | 11.25 |
| Three-way preflop AA vs KK vs QQ | 20 | 8.07 | 40% | 15 |
| 6-max preflop vs 5 ranges | 50 | 17.38 | 35% | 37.5 |
| Full ring flop vs 9 ranges | 80 | 71.86 | 90% | 60 |
| Advice: 10-seat flop vs 9 opponents (AC#3) | 100 | 201.87 | 202% | 75 |
| Advice: HU flop facing a bet | 25 | 22.60 | 90% | (not in AC) |
| Advice: 6-max flop vs 3 | 50 | 21.26 | 43% | — |
| Advice actions: 6-max HU / vs 3 | 25 / 50 | 21.54 / 25.67 | 86% / 51% | — |

Prototype (D-1 + D-3, in Vitest): full ring 51.3–52.5 ms (≈65%); HU flop vs every combo 5.0–6.5 ms. Rejection
rates on Qh7h2c: every unseen combo, 9 opponents: 2.8% accepted; calling ranges: 9 opponents 0.49% (so it hits
the cap after ~150 ms), 8 opponents ≈ 1.5% (it succeeds, 97 ms; out of scope). Expected advice at 9 opponents
after the change: ≈ 52 ms whole range + ≈ 2 ms aborted calling range + overhead → ≈ 55–60 ms. If the builder
measures above 75 ms after D-1/D-2/D-3, it escalates and doesn't widen scope.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `EQUITY_PERF_SCALE=0.75 npx vitest run tests/advice/equity.perf.test.ts && TLH_SLOW_TESTS=1 ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts`
- New tests: `tests/advice/equity.test.ts` → SPEC-05, SPEC-06; `tests/advice/postflop.perf.test.ts` (new SLOW
  test) → SPEC-04.
- Timeout candidates (A-5): see "Measured timeout list" below.
- Judge end-to-end: run SPEC-01 and SPEC-03 three times each, then SPEC-04, SPEC-07 and `npm test`, all on the
  reference Mac with `CI` unset.

### Measured timeout list
From `npx vitest run --coverage --testTimeout=1000 --reporter=json` on the reference Mac (2026-11-25). There
were 59 timed-out tests in 42 files. The one non-timeout failure (`tests/ci/apt-lock.test.ts`) followed on from
a timeout in that file. Columns: slowest test (ms; values near 1,000 were cut off at 1 s), number of tests over
1 s, file, lock owner(s). Every file listed sets `vi.setConfig({ testTimeout: 30_000 })`; every other file runs
under the 5,000 ms default. If a re-run after the change shows a different set, the builder records it in
build-log.md and applies the A-5 rule.

| ms | tests | File | Locked by |
|---|---|---|---|
| 12330 | 1 | tests/ui/review-shown.acceptance.test.tsx | TASK-9.5 |
| 9574 | 2 | tests/advice/postflop-ranges.property.test.ts | - |
| 7560 | 2 | tests/advice/postflop.acceptance.test.ts | TASK-7.3, TASK-7.9 |
| 7412 | 1 | tests/stats/trend-grouping.acceptance.test.tsx | TASK-11.5 |
| 5263 | 1 | tests/advice/postflop-coverage.acceptance.test.ts | TASK-7.22 |
| 5142 | 1 | tests/engine/illegal-actions.acceptance.test.ts | TASK-1.13 |
| 4880 | 2 | tests/playtest/runner.acceptance.test.ts | TASK-1.6 |
| 4217 | 1 | tests/bots/tag-playtest.acceptance.test.ts | TASK-6.1 |
| 4160 | 1 | tests/advice/equity-multiway.acceptance.test.ts | TASK-7.7 |
| 3955 | 1 | tests/advice/equity.acceptance.test.ts | TASK-7.1 |
| 3826 | 2 | tests/playtest/cli.test.ts | - |
| 3628 | 1 | tests/stats/bb100.acceptance.test.tsx | TASK-11.2 |
| 3274 | 1 | tests/ci/tooling-changed.test.ts | - |
| 2972 | 1 | tests/advice/grade.acceptance.test.ts | TASK-7.4 |
| 2364 | 1 | tests/table/action-bar-limits.acceptance.test.ts | TASK-3.7 |
| 2087 | 2 | tests/table/session.acceptance.test.ts | TASK-3.1, TASK-6.22 |
| 2052 | 1 | tests/engine/player-view.property.test.ts | TASK-1.5 |
| 2012 | 1 | tests/stats/style-stats.test.ts | - |
| 1956 | 2 | tests/git/prune-merged-branches-hardening.acceptance.test.ts | TASK-1.35 |
| 1874 | 1 | tests/bots/style.test.ts | - |
| 1778 | 1 | tests/advice/equity.test.ts | - |
| 1749 | 2 | tests/stats/trends.test.ts | - |
| 1726 | 1 | tests/storage/trend-data.test.ts | - |
| 1701 | 1 | tests/engine/invariant-messages.acceptance.test.ts | TASK-1.27 |
| 1615 | 1 | tests/support/cpu-clock.acceptance.test.ts | TASK-1.46 |
| 1543 | 4 | tests/git/prune-merged-branches.acceptance.test.ts | TASK-1.24 |
| 1445 | 1 | tests/table/decision-grades.test.ts | - |
| 1355 | 1 | tests/playtest/policy.test.ts | - |
| 1316 | 1 | tests/storage/hand-records.acceptance.test.ts | TASK-3.9 |
| 1287 | 2 | tests/advice/range-model.acceptance.test.ts | TASK-7.5 |
| 1258 | 1 | tests/table/pace.acceptance.test.ts | TASK-3.13 |
| 1187 | 1 | tests/table/resume.acceptance.test.ts | TASK-2.6 |
| 1176 | 1 | tests/playtest/shards.test.ts | - |
| 1115 | 1 | tests/table/table-size.acceptance.test.ts | TASK-2.2 |
| 1111 | 3 | tests/storage/resume.acceptance.test.ts | TASK-2.6 |
| 1111 | 1 | tests/storage/session-records.acceptance.test.ts | TASK-3.10 |
| 1048 | 1 | tests/storage/session-end-style.test.ts | - |
| 1010 | 3 | tests/ci/retry.test.ts | TASK-1.19 |
| 1009 | 1 | tests/ci/apt-lock.dpkg.acceptance.test.ts | TASK-1.39 |
| 1007 | 2 | tests/ci/apt-lock.test.ts | TASK-1.29 |
| 1007 | 1 | tests/ci/retry.sudo.test.ts | TASK-1.23 |
| 1005 | 2 | tests/ci/retry.reap.test.ts | TASK-1.37 |

30 of the 42 files are locked (owners as listed); 12 are unlocked.

## 11. Open questions
None. Q-1 (early abort), Q-2 (15 warm-ups) and Q-3 (one `vi.setConfig` line per file, 1,000 ms threshold) are
answered in `doit/TASK-7.18/qa.md`.

## 12. Clarifications log
See `doit/TASK-7.18/qa.md`.
