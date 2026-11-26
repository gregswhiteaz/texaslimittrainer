# Spec: TASK-7.34 — Make the advice speed checks opt-in and restore headroom on the remaining tight spots

Status: READY (approved 2026-11-26)
Task: TASK-7.34 · Parent/epic: TASK-7 · Requirements: n/a (follow-up of TASK-7.18 SC-1/SC-2, doc-151; REQ-055 context only) · Dream: limit-holdem-trainer

## 1. Summary
`tests/advice/equity.perf.test.ts` and `tests/advice/postflop.perf.test.ts` still run their timed scenarios in
every `npm test` (at 20x slack). That breaks the standing rule that speed checks are opt-in (`TLH_SLOW_TESTS=1`,
`npm run test:slow`). This task gates every timed test in both files behind the opt-in and adds the equity file
to `npm run test:slow`. It also adds an opt-in headroom test asserting p95 ≤ 75% of target for (a) HU advice
facing a bet and (b) a new 9-seat flop spot facing a bet with 8 opponents, where the calling-range equity run
succeeds. Re-measuring on 2026-11-26 shows (a) already has headroom. No identical-results speed-up was found
that gives (b) headroom at a 100 ms target, so (b) gets a 200 ms target (Q-1 = A), which it meets at 69–72%. No `src/` file changes, so
every advice result, golden and playtest hash stays byte-identical.

## 2. Scope
- In scope:
  - Both advice perf files: every `it` that times anything runs only when opted in (rule in §5). Every existing
    assertion is kept and moves with its test into the opt-in group.
  - `package.json` `test:slow`: add `tests/advice/equity.perf.test.ts`. `postflop.perf.test.ts` is already listed
    (`package.json:16`).
  - `postflop.perf.test.ts`: new opt-in test `headroom: HU facing a bet and 8 opponents within 75% of target times
    slack`, with a new scenario `9-seat flop vs 8 opponents` (target 200 ms, Q-1) plus the existing `HU flop facing a bet`
    (target 25 ms).
  - `README.md` "Speed targets": say that both advice perf files are opt-in, and add the headroom command.
- Not doing:
  - No change under `src/`. No sampler or advice optimisation. The prototypes in §9 show the rejection loop is
    already near its floor while keeping the random stream identical.
  - No change to `tests/ci/speed-limits.acceptance.test.ts` (locked, TASK-1.20) or any other locked test.
  - No change to targets or slack of existing scenarios, to `tests/engine/hand-evaluator.perf.test.ts`, or to
    CI workflows.
  - No headroom work for `actions: 6-max flop facing a bet, one opponent` (79% of 25 ms; see scope concerns).
- Scope budget: files=4, lines=90

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Opt-in for each perf file = `TLH_SLOW_TESTS=1` **or** that file's own scale variable being set (`EQUITY_PERF_SCALE` / `ADVICE_PERF_SCALE`). Setting a scale explicitly is an explicit opt-in. | yes | Locked `tests/ci/speed-limits.acceptance.test.ts:5-10,25` runs `equity.perf.test.ts` nested with `EQUITY_PERF_SCALE=0` and expects `Tests 2 passed` / `2 failed`. Gating on `TLH_SLOW_TESTS` alone would skip that test, break the locked test and need an unlock. The README commands (`README.md:225-245`) and recorded verifications of TASK-1.20/7.1/7.18 keep working unchanged. | Gate on `TLH_SLOW_TESTS` only and unlock speed-limits (TASK-1.20) to add `TLH_SLOW_TESTS: '1'` to its nested env (no assertion change) |
| A-2 | AC#2's "HU advice facing a bet" is the existing `HU flop facing a bet` scenario (`postflop.perf.test.ts:56-64`, 25 ms). The task text's "90% of its 25 ms target" is TASK-7.18 SC-2's figure for that row (doc-151). | yes | Same name, same target, same source | Also include `actions: 6-max flop facing a bet, one opponent` (measured 78–79%; would need an `estimateOpponentRanges` speed-up) |
| A-3 | AC#2's "8-opponent calling-range spot" is a new advice scenario: 9 seats, button 1, ordered deck, everyone limps, the SB completes, the BB checks, the SB bets the flop. Hero = BB (seat 3), owing 4 against 8 live opponents. The calling-range run succeeds there (it does not take the A-7 fallback). | yes | doc-151 SC-2 measures "the 8-opponent calling-range run" inside advice. Uses the same view builder as the 10-seat scenarios. | An equity-only scenario (computeEquity vs 8 calling ranges) in `equity.perf.test.ts` |
| A-4 | AC#2 is checked by the new headroom test, which enforces `p95 ≤ 0.75 × target × ADVICE_PERF_SCALE`, run 3 times in a row at `ADVICE_PERF_SCALE=1` with `CI` unset on the reference Mac (M4 Pro, Node 22.18.0). | yes | Same pattern as TASK-7.18 A-1/A-2. A scale-0.75 run of the whole file would also fail the out-of-scope actions-mode scenario (79%). | grep the p95 lines of a scale-1 run |
| A-5 | Under `npm run test:slow` the files run at their default 20x slack. Real targets stay env-var commands. | yes | Keeps `test:slow` stable when 23 files run in parallel. Matches the current comments (`equity.perf.test.ts:1-7`). | Default scale 1 when `TLH_SLOW_TESTS=1` |

## 3. Current system
- Test runner Vitest 5 (`package.json:13` `npm test` = `vitest run --coverage`). Opt-in slow tests use
  `const SLOW = process.env.TLH_SLOW_TESTS === '1'` and `it.runIf(SLOW)` (e.g. `tests/advice/postflop.perf.test.ts:20,153`).
  `npm run test:slow` sets `TLH_SLOW_TESTS=1` and lists files explicitly (`package.json:16`). It already lists
  `tests/advice/postflop.perf.test.ts` but not `equity.perf.test.ts`.
- `tests/advice/equity.perf.test.ts:59-82`: one test `equity latency within target times slack`, 7 scenarios.
  `SCALE = Number(process.env.EQUITY_PERF_SCALE ?? 20)` (`:14`). It runs unconditionally today.
- `tests/advice/postflop.perf.test.ts`: `postflop advice latency within target times slack` (`:148-150`, unconditional),
  `value-bet … ` (`:153-172`, `runIf(SLOW)`) and `actions-mode … ` (`:174-176`, unconditional). `slowScenarios`
  (`:82-109`) does the timing (15 warm-ups, 20 runs, p95 = 19th of 20, CPU time) and prints one line per scenario.
  `viewAfter` (`:26-40`) builds views. `fullRingPreflop` (`:43-51`) is the 10-seat limp sequence.
- `tests/support/speed.ts`: `speedLimitsEnforced()` (false when `CI=true`) and `cpuNowMs()`.
- `tests/ci/speed-limits.acceptance.test.ts` (locked by TASK-1.20) runs `hand-evaluator.perf.test.ts` and
  `equity.perf.test.ts` in a nested Vitest with `EQUITY_PERF_SCALE: '0'` (`:6-10`). With `CI=true` it expects
  `Tests 2 passed`; without it, `Tests 2 failed` (`:41,51`). `sandboxEnv()` scrubs only `VITEST*`, `NODE_V8_COVERAGE*`
  and `TEST*` (`tests/support/sandbox.ts:38`), so a `TLH_SLOW_TESTS` set by the caller would leak through, but
  plain `npm test` does not set it.
- Lock owners: neither advice perf file is in any task's `locked_tests` (checked every `doit/*/state.json`).
  TASK-7.1/7.3/7.5 reference them only as `unit` verifications. **No locked test is touched.**
- `src/advice/postflop.ts:140-182`: advice = whole-range run plus calling-range run, with the A-7 fallback on a
  RangeError. `src/advice/equity.ts:339-443` `sampledEquity`: rejection loop, already tuned by TASK-7.18.
- Bots use `BOT_EQUITY` = 500 trials (`src/bots/tag.ts:27-31`), not the 30,000-trial `computeEquity`. REQ-055.3
  (bot decision ≤ 100 ms) therefore does not depend on these advice scenarios. User hints have REQ-055.1 ≤ 1.0 s
  (`dreams/limit-holdem-trainer/requirements.md:1023-1025`).
- Existing code to reuse:
  - `tests/advice/postflop.perf.test.ts` `slowScenarios`, `viewAfter` → time the headroom scenarios. Pass targets
    already multiplied by 0.75.
  - `tests/advice/postflop.perf.test.ts` `fullRingPreflop` → generalise to `limpedPreflop(seats)` for the 9-seat spot.
  - `src/advice/ranges.ts` `callingRange`, `unseenCombos` (already imported, `postflop.perf.test.ts:10`) → the
    calling-range check for the 8-opponent spot.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Gate each perf file's timed tests with one per-file `OPT_IN` constant (A-1) and `it.runIf(OPT_IN)`. The value-bet test moves from `SLOW` to `OPT_IN`. | `describe.runIf`; vitest `--exclude` in `npm test` | One gate per file, the same idiom as the other slow tests. Excluding via the script would break `npx vitest run <file>` commands. | no | n/a |
| D-2 | Make no `src/` change. Meet AC#2 by measurement, with the 8-opponent target set by Q-1. | Bitmask conflict check in the sampler (prototype: −7% on the loop, identical stream); buffered PRNG draws (prototype: +41%, slower) | Neither identical-results option comes close to the ~2x needed for ≤ 75 ms. Engine edits for 5 ms add review risk. | yes | Q-1 (auto-accepted A, 2026-11-26) |
| D-3 | New headroom test, not a scale-0.75 run of the whole file | Whole-file `ADVICE_PERF_SCALE=0.75` | The out-of-scope actions-mode HU scenario is at 79% and would fail | no | n/a |

## 5. Design

### Files to create / modify
- `tests/advice/equity.perf.test.ts` — opt-in gate; header comment updated.
- `tests/advice/postflop.perf.test.ts` — opt-in gate on all three existing tests; `limpedPreflop(seats)`; new
  `HEADROOM_SCENARIOS` and headroom test; header comment updated.
- `package.json` — `test:slow` gains `tests/advice/equity.perf.test.ts`.
- `README.md` — Speed targets: both advice perf files opt-in; headroom command.

### Components, interfaces and data
- `equity.perf.test.ts`:
  `const OPT_IN = process.env.TLH_SLOW_TESTS === '1' || process.env.EQUITY_PERF_SCALE !== undefined;`
  and `it.runIf(OPT_IN)('equity latency within target times slack', …, 120_000)`. Test name, scenarios and
  assertions are unchanged.
- `postflop.perf.test.ts`:
  `const OPT_IN = process.env.TLH_SLOW_TESTS === '1' || process.env.ADVICE_PERF_SCALE !== undefined;`
  (it replaces `SLOW`). All four tests use `it.runIf(OPT_IN)`, and existing test names stay the same.
  - `function limpedPreflop(seats: number): [SeatNumber, Action['type'], number?][]` returns seats 4..`seats` then
    seat 1 `call 4`, seat 2 `call 2`, seat 3 `check`. `fullRingPreflop` becomes `limpedPreflop(10)` (the same steps
    as today).
  - `const HEADROOM = 0.75;`
  - `HEADROOM_SCENARIOS: [string, PlayerView, number][]` =
    `['HU flop facing a bet', <same view as SCENARIOS[0]>, 25]`,
    `['9-seat flop vs 8 opponents', viewAfter(9, [...limpedPreflop(9), [2, 'bet', 4]]), 200]`.
    The 200 ms target is specific to this headroom scenario (Q-1); no existing scenario target changes.
  - New test `headroom: HU facing a bet and 8 opponents within 75% of target times slack`:
    1. For the 9-seat view, `computeEquity({ hero, board, opponents: 8 × callingRange(unseenCombos([...hole, ...board]), board) })`
       returns `method === 'sampled'` without throwing, so the calling-range run succeeds and this is a
       calling-range spot, not an A-7 fallback.
    2. `recommendPostflop(view).opponents` is 1 for the HU view and 8 for the 9-seat view.
    3. `expect(slowScenarios(HEADROOM_SCENARIOS.map(([n, v, t]) => [n, v, t * HEADROOM]))).toEqual([])`. Owed is
       checked by `slowScenarios` (`callAmount > 0`), and the printed target is `0.75 × target`.
- Header comments of both files: say the file runs only with `TLH_SLOW_TESTS=1` (`npm run test:slow`) or with its
  scale variable set. Give the headroom command
  `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom`.

### Rules and algorithms
- Opt-in rule (A-1): a timed test runs iff `TLH_SLOW_TESTS === '1'` or the file's scale variable is defined
  (any value, including `0`). Otherwise Vitest reports it as skipped and no scenario code is timed. View building at
  module load is untimed and stays as it is.
- Headroom limit = `target × 0.75 × SCALE`. Examples at SCALE 1: HU 25 → 18.75 ms. 8-opponent 200 → 150 ms (Q-1 = A).

### Error handling and configuration
- With `CI=true`, numbers are printed and not enforced (unchanged `speedLimitsEnforced`). The calling-range check
  in step 1 and the `opponents` / `callAmount` checks are enforced everywhere.

## 6. Behaviour specification

### SPEC-01: Plain npm test runs no advice timed scenario
- Verifies: AC#1
- Behaviour: Given `TLH_SLOW_TESTS`, `EQUITY_PERF_SCALE` and `ADVICE_PERF_SCALE` all unset, When both advice perf files run (directly or as part of `npm test`), Then Vitest reports all 5 tests skipped (1 equity + 4 postflop), prints no `p95` line, and exits 0.
- Verification: command `env -u TLH_SLOW_TESTS -u EQUITY_PERF_SCALE -u ADVICE_PERF_SCALE npx vitest run tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts 2>&1 | tee /dev/stderr | grep -E 'Tests +5 skipped \(5\)' && ! env -u TLH_SLOW_TESTS -u EQUITY_PERF_SCALE -u ADVICE_PERF_SCALE npx vitest run tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts 2>&1 | grep -q 'p95'` exits 0; and `npm test` exits 0

### SPEC-02: npm run test:slow runs both files in full
- Verifies: AC#1
- Behaviour: Given `npm run test:slow`, When it runs, Then its file list contains both `tests/advice/equity.perf.test.ts` and `tests/advice/postflop.perf.test.ts`, and with `TLH_SLOW_TESTS=1` the two files run all 5 tests with 0 skipped (15 `p95` lines: 7 equity, plus 3 + 1 + 2 + 2 postflop).
- Verification: command `node -e "const s=require('./package.json').scripts['test:slow'];process.exit(s.includes('tests/advice/equity.perf.test.ts')&&s.includes('tests/advice/postflop.perf.test.ts')?0:1)" && TLH_SLOW_TESTS=1 npx vitest run tests/advice/equity.perf.test.ts tests/advice/postflop.perf.test.ts 2>&1 | tee /dev/stderr | grep -E 'Tests +5 passed \(5\)'` exits 0; and `npm run test:slow` exits 0

### SPEC-03: An explicit scale still opts in (documented commands and the locked CI speed-limits test)
- Verifies: AC#1
- Behaviour: Given `EQUITY_PERF_SCALE=1` (resp. `ADVICE_PERF_SCALE=1`) and no `TLH_SLOW_TESTS`, When that file runs, Then its tests run (equity: 1 passed; postflop: 4 passed). And the unmodified locked `tests/ci/speed-limits.acceptance.test.ts` (nested run with `EQUITY_PERF_SCALE=0`) still passes both its tests.
- Verification: command `env -u TLH_SLOW_TESTS EQUITY_PERF_SCALE=1 npx vitest run tests/advice/equity.perf.test.ts 2>&1 | grep -E 'Tests +1 passed \(1\)' && env -u TLH_SLOW_TESTS ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts 2>&1 | grep -E 'Tests +4 passed \(4\)' && env -u TLH_SLOW_TESTS npx vitest run tests/ci/speed-limits.acceptance.test.ts && git diff --quiet main -- tests/ci/speed-limits.acceptance.test.ts` exits 0 (with `CI` unset)

### SPEC-04: Headroom at real targets for HU facing a bet and the 8-opponent calling-range spot
- Verifies: AC#2
- Behaviour: Given the reference Mac with `CI` unset, When `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom` runs 3 times in a row, Then each pass prints `HU flop facing a bet … p95 X ms (target 18.75 ms x 1 …)` with X ≤ 18.75 and `9-seat flop vs 8 opponents: 8 opponents … p95 Y ms` with Y ≤ 150 (`target 150 ms x 1`, i.e. 0.75 × the 200 ms target from Q-1), and exits 0.
- Verification: command `for i in 1 2 3; do ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom 2>&1 | tee /dev/stderr | grep -E 'Tests +1 passed' || exit 1; done`

### SPEC-05: The 8-opponent spot really is a calling-range spot facing a bet
- Verifies: AC#2
- Behaviour: Given the 9-seat view, When the headroom test runs (any scale, `CI` set or not), Then computeEquity with 8 copies of the hero's calling range returns `method: 'sampled'` without throwing, `recommendPostflop` reports `opponents: 8` and `callAmount > 0`, and the HU view reports `opponents: 1` and `callAmount > 0`. If any of these fails, the test fails regardless of timing.
- Verification: unit `tests/advice/postflop.perf.test.ts::headroom: HU facing a bet and 8 opponents within 75% of target times slack`

### SPEC-06: Advice results unchanged
- Verifies: AC#2
- Behaviour: Given the change, When the default playtest runs, Then no file under `src/` differs from `main` and the playtest stdout SHA-256 equals the value on `main` (recorded in build-log.md before editing).
- Verification: command `git diff --quiet main -- src/ && npm run playtest | shasum -a 256` (equal to the base value in build-log.md)

## 7. Edge cases
- Scale variable set to `0` or another value: it counts as opt-in (A-1). That is exactly what the speed-limits test relies on (SPEC-03).
- `TLH_SLOW_TESTS` set to something other than `1`: it does not opt in (same as every other slow test).
- `CI=true` with opt-in (CI sweeps never set it, so the files are skipped there now): it prints and does not
  enforce. The SPEC-05 structure checks still apply.
- A scale variable exported in the user's shell makes plain `npm test` run that file. This is accepted under A-1.
- Concurrency, interruption, permissions, invalid input: N/A (test-only change, with no new input surface).

## 8. Security considerations
- No trust boundary, input, secret, logging or dependency change. Only test gating and documentation change.
  Randomness: N/A (the sampler is untouched).

## 9. Non-functional
Measured 2026-11-26 on the reference Mac (Apple M4 Pro, Node 22.18.0, `CI` unset), CPU-time p95 of 20 runs after
15 warm-ups:

| Scenario | Target | p95 (3 passes) | % of target | ≤ 75%? |
|---|---|---|---|---|
| Advice: HU flop facing a bet (Vitest, scale 1) | 25 | 10.32 / 9.40 / 13.77 | 38–55% | yes |
| Advice: 9-seat flop vs 8 opponents (node harness, same method) | 200 (Q-1) | 137.32 / 144.89 / 136.86 | 69–72% (137–145% of 100) | yes (thin 3–6-point margin) |
| (breakdown) whole-range run, 8 opponents | — | 34.6–35.5 | | |
| (breakdown) calling-range run, 8 × 324 combos, 2,855,184 rejected deals | — | 102.3–108.5 | | |
| Advice actions: 6-max facing a bet, one opponent (Vitest) | 25 | 19.48 / 19.75 / 19.72 | 78–79% | no (out of scope) |
| Advice: 10-seat flop vs 9 opponents (Vitest) | 100 | 53.7–53.9 | 54% | yes |

Identical-stream prototypes of the calling-range rejection loop without scoring (baseline 75–77 ms): a bitmask
conflict check gives 71 ms (−7%); pre-generated PRNG buffers give 108 ms (slower). Scoring accounts for about 27 ms.
To reach ≤ 75 ms at a 100 ms target, the calling-range run would have to drop from ~102 to ~38 ms. That is not
reachable with byte-identical results, hence the 200 ms target for this spot (Q-1 = A).

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `ADVICE_PERF_SCALE=1 npx vitest run tests/advice/postflop.perf.test.ts -t headroom && npm run test:slow`
- New tests (path → SPEC ids): `tests/advice/postflop.perf.test.ts::headroom: HU facing a bet and 8 opponents within 75% of target times slack` → SPEC-04, SPEC-05. Gating → SPEC-01..03 (commands).
- Judge end-to-end: record the playtest SHA on `main`. Then run SPEC-01, SPEC-02 (including the full `npm run test:slow`),
  SPEC-03, SPEC-04 three times and SPEC-06, then `npm test`, all on the reference Mac with `CI` unset.

## 11. Open questions
None. Q-1 resolved (A): the `9-seat flop vs 8 opponents` headroom scenario has a 200 ms target (headroom limit
150 ms at scale 1); every advice result stays byte-identical (no `src/` change). Its margin is thin (69–72% of
200 ms measured), so the judge runs SPEC-04 three times as specified.

## 12. Clarifications log
See `doit/TASK-7.34/qa.md`.
