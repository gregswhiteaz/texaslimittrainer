# Spec: TASK-1.56 — Keep postflop-ranges unit tests inside the coverage-run time limit

Status: READY (no questions; A-1..A-4 assumed)
Task: TASK-1.56 · Parent/epic: TASK-1 · Requirements: n/a · Dream: limit-holdem-trainer

## 1. Summary
Two tests in `tests/advice/postflop-ranges.test.ts` run real equity calculations (30,000-trial sampled runs), which
the v8 coverage instrumentation slows about 5x. On CI they took 36.0 s (timed out at 30 s) and 18.4 s in the
'Unit tests with coverage' job (run 45306421540). This task moves the two expensive checks, unchanged, into a new
`tests/advice/postflop-ranges.property.test.ts`. That file runs in the sweep job, which has no coverage. The cheap
checks stay in the coverage run. No assertion, seed, run count or case list changes.

## 2. Scope
- In scope:
  - Moving the fast-check property block of `actions mode is total, deterministic and falls back` (lines 105–146)
    and the whole `default advice stays on every unseen combo` test (lines 259–303) into a new
    `tests/advice/postflop-ranges.property.test.ts`, with their code unchanged.
  - Keeping the scripted fallback loop and the heads-up block (lines 148–200) in `postflop-ranges.test.ts` as their
    own test, and removing the imports that file no longer uses.
- Not doing:
  - No change to `src/**`, `vite.config.ts` (`testTimeout`, coverage thresholds), `package.json` scripts or
    `.github/workflows/ci.yml`.
  - No per-test timeout overrides. No stubbed, memoised or reduced-trial equity in the moved tests.
  - No change to any other slow test file (e.g. `tests/advice/postflop.test.ts`) and no shared helper module.
  - No new dependency.
- Scope budget: files=2, lines=260   (postflop-ranges.test.ts ~-115/+3, postflop-ranges.property.test.ts ~+135 incl. imports)

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | Fix by moving the heavy cases to the uncovered sweep job (option 2 in the story) rather than raising per-test timeouts or cutting the equity work | yes | Measured: the property block takes 8.1 s of the 8.2 s test under coverage locally, and 36 s on CI. To get 3x headroom with a timeout alone it would need ≥110 s for that test and ≥55 s for the other, and the margin is set by how slow the runner happens to be. Making equity cheaper means changing `computeEquity` (out of scope) or injecting a cheaper equity, which weakens the determinism check. Moving them costs no coverage: `npm run test:unit` with the whole file excluded still passes every threshold (exit 0, lines 92.65 %) | Per-test timeouts of 120 s / 60 s (2-line diff, but it keeps ~55 s in the coverage job and leaves it at the runner's mercy); inject `equityWithBudget` with fewer trials (loosens the check) |
| A-2 | AC#1 ("every test in postflop-ranges.test.ts under coverage has ≥3x headroom") is met for the tests that stay in that file. The moved tests are held to the same ≥3x bar in the sweep job's log | yes | The story names moving the heavy case to the sweep job as an allowed fix, so after the move the coverage-run file is the cheap remainder. Applying the same bar to the moved tests keeps the AC's intent | Hold only the coverage-run file to the bar |
| A-3 | The scripted-fallback test gets a new name, `actions mode falls back on scripted lines and heads-up`. The property test is named `actions mode is total and deterministic`. `default advice stays on every unseen combo` keeps its name. The `describe` name `postflop advice with action ranges` is kept in both files | yes | Splitting one `it` into two needs two names. Each name says what that test checks | Keep the old name on the fallback test |
| A-4 | `STAKES_4_8` and `ALL_CARDS` (2 lines) are copied into the new file instead of being shared through a helper module | yes | Two constants don't justify a new module, and test files must not import from each other | New `tests/advice/fixtures` helper |

## 3. Current system
- `tests/advice/postflop-ranges.test.ts` (304 lines, 30 `expect(` calls) has three tests:
  - `:104` `actions mode is total, deterministic and falls back`. Part one (`:105–146`) is a fast-check property
    with `{ numRuns: 60, seed: 7505 }`. It calls `recommendPostflop(view, ACTION_RANGE_ADVICE)` twice per run,
    using the real `computeEquity`. Part two (`:148–184`) loops over 3 scripted lines (FLOP/TURN/RIVER_STEPS
    with sizes 1081/1035/990) using the stub `failingEquity`. Part three (`:186–200`) is a heads-up view that
    makes one real `recommendPostflop` call.
  - `:203` `a fully blocked start …` mocks `six-max.json` through `vi.doMock`. The `afterEach` at `:98–101`
    exists for this test.
  - `:259` `default advice stays on every unseen combo` builds 200 postflop views from
    `playHand(handReplayCode(7505, k), …)`. It compares stubbed `recommend` calls on all 200, then makes 2 real
    `recommend` calls on each of `views.slice(0, 10)`.
- Measured locally (`--coverage`, temporary instrumented copy, removed afterwards): property block 8.09 s,
  fallback loop + heads-up 0.08 s, blocked-start test 0.09 s, default-advice test 5.05 s (1.84 s stubbed part,
  3.2 s for the 10 real-equity views). Plain run (orchestrator): 1.7 s and 1.6 s. CI coverage job (run
  45306421540): 36021 ms (timed out), 434 ms, 18400 ms.
- `vite.config.ts:10` sets `testTimeout: 30_000`. `vite.config.ts:11–20` sets coverage thresholds of 70 % lines
  overall and 90 % for `src/{engine,bots,advice,stats,playtest,table}/**`. `vite.config.ts:9` uses the verbose
  reporter, which prints a duration for every test in CI logs. Fast tests are printed too, e.g. `ranges.test.ts …
  1ms`.
- `package.json` `test:unit` runs `vitest run --coverage` and excludes `**/*.property.test.*` (and `.acceptance.`,
  `.perf.`, tooling). `test:sweeps` runs `.acceptance.test. .perf.test. .property.test.` without coverage.
  `npm test` is `vitest run --coverage` over everything (local only).
- `.github/workflows/ci.yml`: the job `coverage` ('Unit tests with coverage') runs `npm run test:unit`. The job
  `sweeps` runs `npm run test:sweeps -- --shard=N/2` across 2 shards. The new file is picked up automatically
  because of its name.
- Naming convention: fast-check sweeps already use `*.property.test.ts`, e.g. `tests/engine/hand.property.test.ts`
  and `tests/engine/side-pots.property.test.ts`.
- Locks: no `doit/*/state.json` lists `tests/advice/postflop-ranges.test.ts` under `locked_tests`.
  `doit/TASK-7.5/state.json` and `doit/TASK-7.8/state.json` hold it only in `test_snapshot`, a record from those
  finished tasks. No owner approval is needed to edit it.
- Existing code to reuse:
  - `tests/advice/postflop-ranges.test.ts:104–146, 259–303` → move these bodies verbatim. No rewriting.
  - `tests/advice/postflop-ranges.test.ts:20–21` → `STAKES_4_8`, `ALL_CARDS`, copied (A-4).

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Move the real-equity property block and the default-advice test, unchanged, to `postflop-ranges.property.test.ts`, so they run in the uncovered sweep job | per-test timeout; cheaper equity | See A-1. The checks stay byte-identical, the coverage job gets shorter, and the coverage thresholds are proven to hold | no | n/a |

## 5. Design

### Files to create / modify
- `tests/advice/postflop-ranges.test.ts` — modify. Delete `:105–146` (the property block, including the `streets`
  check) and `:259–303` (the default-advice test). Rename the `:104` test to
  `actions mode falls back on scripted lines and heads-up`. Its body becomes the old `:148–200`, unchanged. Drop
  the imports that are now unused (expected: `fc`, `legalActions`, `playHand`, `handReplayCode`, `recommend`; `createHand`, `EquityInput`/
  `EquityResult` stay because `stateAfter` and `failingEquity` use them). Keep `afterEach`, the helpers and the step lists.
- `tests/advice/postflop-ranges.property.test.ts` — new. Contains the imports it needs, the two copied constants,
  and `describe('postflop advice with action ranges')` with:
  - `it('actions mode is total and deterministic', …)`: the old `:105–146`, verbatim.
  - `it('default advice stays on every unseen combo', …)`: the old `:260–302`, verbatim.

### Components, interfaces and data
- No production interface changes. Test-only.

### Rules and algorithms
- Invariant (AC#2): the multiset of `expect(` statements in the two new files equals the one in
  `git show main:tests/advice/postflop-ranges.test.ts`, which is 30 in total. The literals `numRuns: 60, seed: 7505`,
  `[FLOP_STEPS, 1081]`, `[TURN_STEPS, 1035]`, `[RIVER_STEPS, 990]`, `views.length < 200`, `views.slice(0, 10)` and
  `handReplayCode(7505, k)` each appear exactly once across the two files.
- Expected timings: in the coverage run, the remaining file's tests are each <1 s locally and about 0.5 s on CI.
  In the sweep job, without coverage, the moved tests take about 1.7 s and 1.6 s locally, which projects to about
  7 s on CI at the observed ~4.3x CI/local factor. That is well under the ≤10 s needed for 3x headroom.

### Error handling and configuration
- N/A. No configuration changes, and the timeout stays at the global 30 s.

## 6. Behaviour specification

### SPEC-01: Coverage-run tests in postflop-ranges.test.ts have ≥3x headroom
- Verifies: AC#1
- Behaviour: Given `npm run test:unit` runs on a CI runner (ubuntu-24.04), When `tests/advice/postflop-ranges.test.ts`
  runs, Then each of its tests (`actions mode falls back on scripted lines and heads-up`, `a fully blocked start
  uses every unseen combo and an empty narrowing keeps the range`) passes, and the verbose log shows a duration of
  ≤10000 ms for each (30 s timeout / 3). Locally, `npx vitest run --coverage tests/advice/postflop-ranges.test.ts`
  shows each under 1000 ms.
- Verification: command `gh run view <run-id> --log | grep 'Unit tests with coverage' | grep 'postflop-ranges.test.ts'` on each of the three AC#3 runs; every line shows ✓ and ≤10000ms

### SPEC-02: Moved tests have the same ≥3x headroom in the sweep job
- Verifies: AC#1
- Behaviour: Given `npm run test:sweeps -- --shard=N/2` runs on CI, When `tests/advice/postflop-ranges.property.test.ts`
  runs (in whichever shard it lands), Then `actions mode is total and deterministic` and `default advice stays on
  every unseen combo` both pass, with logged durations of ≤10000 ms each.
- Verification: command `gh run view <run-id> --log | grep 'Sweep tests' | grep 'postflop-ranges.property.test.ts'` on each of the three AC#3 runs; both tests ✓ with ≤10000ms

### SPEC-03: The moved and kept checks are unchanged
- Verifies: AC#2
- Behaviour: Given the old file `main:tests/advice/postflop-ranges.test.ts` and the two new files, When they are
  compared, Then (a) the count of `expect(` is 30 in the old file and 30 summed over the new files; (b) every `expect`
  line in the old file appears unchanged in one of the new files (sorted lists of trimmed `expect` lines are
  identical); (c) `numRuns: 60, seed: 7505`, the three `[…_STEPS, n]` tuples, `views.length < 200`,
  `views.slice(0, 10)` and `handReplayCode(7505, k)` appear exactly once across the two files; (d) no `.skip`,
  `.only`, `.todo` or timeout argument is added; (e) the new file runs and passes with 2 tests, and the old file
  with 2.
- Verification: command `diff <(git show main:tests/advice/postflop-ranges.test.ts | grep -E 'expect\(|numRuns|_STEPS, [0-9]|views.length < 200|slice\(0, 10\)|handReplayCode' | sed 's/^ *//' | sort) <(cat tests/advice/postflop-ranges.test.ts tests/advice/postflop-ranges.property.test.ts | grep -E 'expect\(|numRuns|_STEPS, [0-9]|views.length < 200|slice\(0, 10\)|handReplayCode' | sed 's/^ *//' | sort) && npx vitest run tests/advice/postflop-ranges.test.ts tests/advice/postflop-ranges.property.test.ts` — diff prints nothing; vitest reports 2 files and 4 tests passed (old file: `actions mode falls back on scripted lines and heads-up`, `a fully blocked start …`; new file: `actions mode is total and deterministic`, `default advice stays on every unseen combo`)

### SPEC-04: The coverage job and its thresholds still pass
- Verifies: AC#3
- Behaviour: Given the change is pushed to `doit/TASK-1.56`, When CI runs three times in a row (one push plus
  two re-runs, done by the orchestrator), Then the 'Unit tests with coverage' job passes in all three, including
  every coverage threshold from `vite.config.ts:14–17`, and both sweep shards also pass.
- Verification: command `gh run list --branch doit/TASK-1.56 --workflow CI --limit 3 --json databaseId,conclusion` plus `gh run view <id> --json jobs` for each attempt; 'Unit tests with coverage' conclusion = success in 3 consecutive attempts. Local precheck: `npm run test:unit` exits 0

## 7. Edge cases
- Sweep shard balance: the new file adds about 3–7 s to one of 2 shards. Vitest assigns files to shards. This is
  acceptable and covered by SPEC-02 and SPEC-04.
- `npm test` (local, coverage over all files) still runs the moved tests under coverage at about 8 s and 5 s
  locally, inside 30 s. This is not a CI path, so no spec item covers it.
- Module mocking: the moved tests use no `vi.doMock`, so the new file needs no `afterEach` reset. The kept
  blocked-start test keeps its `afterEach`.
- Unused imports after the move would fail `npm run lint` (eslint `--max-warnings 0`). Covered by the Lint command.

## 8. Security considerations
N/A. A test-only reorganisation with no untrusted input, secrets, dependencies or randomness changes. The
fast-check seed is kept.

## 9. Non-functional
- Each test in `postflop-ranges.test.ts` in the CI coverage job: ≤10 s (expected <1 s). Measured from the verbose
  log durations.
- Each test in `postflop-ranges.property.test.ts` in the CI sweep job: ≤10 s (expected about 7 s or less).
- Coverage thresholds are unchanged and still met (`npm run test:unit` exit 0).

## 10. Test plan
- Test command: `npm run test:unit && npx vitest run tests/advice/postflop-ranges.property.test.ts`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run --coverage --coverage.thresholds=false tests/advice/postflop-ranges.test.ts && npx vitest run tests/advice/postflop-ranges.property.test.ts` (shows per-test durations, with and without coverage)
- New tests: `tests/advice/postflop-ranges.property.test.ts` → SPEC-02, SPEC-03. Modified
  `tests/advice/postflop-ranges.test.ts` → SPEC-01, SPEC-03. Judge: run the SPEC-03 diff command, then the Run
  command. Then read the three CI runs' logs for the durations in SPEC-01 and SPEC-02 and the job conclusions in
  SPEC-04.

## 11. Open questions
- none

## 12. Clarifications log
See `doit/TASK-1.56/qa.md`.
