# Spec: TASK-1.58 — Stop the 3-seat style-check unit test timing out on CI

Status: READY (approved 2026-11-27, autopilot)
Task: TASK-1.58 · Parent/epic: TASK-1 · Requirements: n/a (follow-up from CI run 45992781358, TASK-7.37 SPEC-05) · Dream: limit-holdem-trainer

## 1. Summary
`tests/playtest/style-check-short-handed.test.ts` plays 300 3-seat hands three times (once through `main()`,
once per test through `preflopDecisions()`) under v8 coverage. On CI the first test took 3296 ms on the passing
re-run and over 5000 ms (vitest's default timeout) on the failed attempt. This task cuts the work to 200 hands,
plays the capture playtest once per file instead of once per test, and gives each test an explicit 20 000 ms
timeout, without removing or loosening any assertion.

## 2. Scope
- In scope:
  - `tests/playtest/style-check-short-handed.test.ts` only: `HANDS` 300 → 200; memoise the captured decisions
    (and the playtest's violation count) so the second test reuses them; an explicit per-test timeout of
    `20_000` on both `it(...)` calls; a one-line comment that cites the measurement.
- Not doing:
  - No change to anything under `src/` (CLI, runner, style check, TAG bot, charts).
  - No change to `vite.config.ts` (no global `testTimeout`), `package.json` scripts or CI workflow; the test
    stays in `npm test` / `test:unit` (it is a unit test, not a slow/opt-in one).
  - No change to any other test file, including the locked
    `tests/playtest/check-styles-three-seats.acceptance.test.ts` and `tests/bots/tag-short-handed*.acceptance.test.ts`.
  - No assertion removed, weakened, or moved behind a condition; no new assertions beyond what the memoisation
    needs to keep the existing `violations` check per call.
- Scope budget: files=1, lines=30

### Assumptions (decided without asking — reviewed by the user after completion)
| ID | Assumption | Reversible? | Rationale | Alternatives |
|---|---|---|---|---|
| A-1 | 200 hands is the new sample: with seed 42 at 3 seats it is the smallest measured count where both reachable TAG mixed spots (`preflop-unopened`, `preflop-blind-defence`) see both the recommended move and the alternative (unopened 14/2, blind-defence 9/3), and the 6-max tally still differs. | yes | Keeps the test as meaningful as at 300 hands (both actions in both spots) while cutting playtest work by a third. Measured: at 100 hands blind-defence has alternative 0; at 25 hands both spots are non-zero but blind-defence is one-action only. | 100 hands (both spots non-zero, faster, but blind-defence alternative never taken); keep 300 and rely on the timeout alone. |
| A-2 | The captured decisions are computed lazily once per file (module-level cache) and both tests read the cache; the `expect(summary.violations).toBe(0)` check runs on every call of the getter against the cached count, so each test still asserts it. | yes | Removes one full 200-hand playtest per run (the second test took 1746 ms on CI) with no assertion lost. Lazy, not top-level, so `-t` filtering either test alone still works. | `beforeAll` hook; no caching. |
| A-3 | Explicit per-test timeout is `20_000` ms. | yes | Measured worst passing CI time was 3296 ms at 300 hands; at 200 hands with caching the expected CI time is ~2.2 s, so 20 s is ~9x headroom and still fails fast on a real hang. Matches the repo's habit of explicit per-test timeouts (`tests/advice/equity-multiway-reference.test.ts:117` uses `60_000`). | 10 000 ms; 30 000 ms; global `testTimeout` in `vite.config.ts` (rejected: changes every test). |

## 3. Current system
- The file under change: `tests/playtest/style-check-short-handed.test.ts:14` (`const HANDS = 300`),
  `:23-36` (`preflopDecisions()` runs `runPlaytest` with `composeChecks(checkStep, capture)` and asserts
  `violations === 0`), `:73-88` (test 1: `main([... '--check-styles'])` then `tally(preflopDecisions(), …)`),
  `:90-95` (test 2: calls `preflopDecisions()` again and compares the 6-max and short-handed tallies).
- It is a `unit` test of TASK-7.37 SPEC-05 (`doit/TASK-7.37/spec.md:198`) and is **not locked**:
  `doit/TASK-7.37/state.json` `locked_tests` lists only the two `tests/bots/tag-short-handed*.acceptance.test.ts`
  files; later tasks only snapshot it (no lock entries).
- Vitest config: `vite.config.ts:9-23` — no `testTimeout`, so the default 5000 ms applies; coverage is v8.
  `npm test` = `vitest run --coverage`; CI's "Unit tests with coverage" uses `npm run test:unit`
  (`package.json` scripts), which includes this file.
- Measured locally (2026-11-27, this machine):
  - Without coverage: test 1 486 ms, test 2 224 ms.
  - With coverage, file alone: test 1 1489 ms, test 2 724 ms.
  - `preflopDecisions()` alone without coverage: 25 hands 44 ms, 100 hands 82 ms, 200 hands 151 ms, 300 hands 225 ms.
  - Mixed-spot tallies (seed 42, 3 seats, short-handed chart): only `preflop-unopened` and
    `preflop-blind-defence` are ever reached; 100 hands → unopened 10/2, blind-defence 5/0; 200 hands →
    14/2 and 9/3; 300 hands → 21/4 and 11/4. The 6-max tally differs at every measured count.
- CI (run 45992781358 re-run, from `gh run view --log`): test 1 3296 ms, test 2 1746 ms; the failed attempt
  exceeded 5000 ms on test 1.
- Existing code to reuse:
  - `tests/playtest/style-check-short-handed.test.ts` `preflopDecisions()` / `tally()` → keep as is; only wrap
    the playtest in a lazy cache.

## 4. Decisions
| ID | Decision | Alternatives considered | Rationale | Material? | Approved by |
|---|---|---|---|---|---|
| D-1 | Fix in the test file only: fewer hands (A-1) + one shared capture playtest (A-2) + explicit timeout (A-3). | Timeout only; fewer hands only; tally inside `main` via a new hook in `src/`. | Combines a real runtime cut (~half the playtest work) with headroom against CI noise; no production code change. | no | n/a |

## 5. Design

### Files to create / modify
- `tests/playtest/style-check-short-handed.test.ts` — `HANDS = 200`; lazy cached capture; `20_000` timeout on both tests.

### Components, interfaces and data
- `preflopDecisions(): Decision[]` keeps its signature. Internally it computes once
  `{ decisions, violations }` from `runPlaytest({ hands: HANDS, seed: 42, size: 3, game: 'cash' }, …)` and
  stores it in a module-level `let` (or equivalent); on every call it runs `expect(violations).toBe(0)` and
  returns the cached `decisions`.
- Both `it(name, fn, 20_000)` — test names unchanged.

### Rules and algorithms
- `main([...'--hands', String(HANDS), ...])` and the capture playtest must use the same `HANDS` and seed, so the
  CLI's printed tally and the expected tally still describe the same hands.

### Error handling and configuration
- N/A — test-only change.

## 6. Behaviour specification

### SPEC-01: The 3-seat style-check test runs well inside its time limit
- Verifies: AC#1
- Behaviour: Given the changed file, When `npx vitest run --coverage tests/playtest/style-check-short-handed.test.ts`
  runs locally, Then both tests pass, each test's reported duration is at most 2000 ms (one tenth of its
  20 000 ms limit), and the file's two `it(...)` calls each pass `20_000` as the timeout.
- Verification: command `npx vitest run --coverage tests/playtest/style-check-short-handed.test.ts`

### SPEC-02: No assertion removed or loosened
- Verifies: AC#1
- Behaviour: Given the diff against the base commit, When the file is compared, Then every assertion of the
  original is still present with the same matcher and operands — `expect(summary.violations).toBe(0)` (or the
  same check on the cached count, run on every `preflopDecisions()` call), the `expect.fail(...)` in strict
  `tally`, `expect(lines).toEqual(...)`, `expect(lines.length).toBeGreaterThan(0)`, and
  `expect(tally(decisions, SIX_MAX_CHART, false)).not.toEqual(tally(decisions, TAG_SHORT_HANDED_CHART, true))`
  — none is inside a new condition, and both test names are unchanged.
- Verification: command `git diff <base> -- tests/playtest/style-check-short-handed.test.ts`

### SPEC-03: Both reachable TAG mixed spots are still exercised with both actions
- Verifies: AC#1
- Behaviour: Given seed 42, 3 seats, 200 hands, When test 1 runs, Then the CLI prints
  `Mixed spot: TAG preflop-unopened, recommended 14, alternative 2` and
  `Mixed spot: TAG preflop-blind-defence, recommended 9, alternative 3` (equal to the independently computed
  tally, which the existing `toEqual` already checks).
- Verification: command `npm run playtest -- --hands 200 --seed 42 --size 3 --check-styles | grep 'Mixed spot: TAG'`

## 7. Edge cases
- Running one test alone with `-t`: the lazy cache computes on first use, so either test passes alone (covered by
  A-2; Judge may run `npx vitest run tests/playtest/style-check-short-handed.test.ts -t "6-max"`).
- CI load spikes: covered by the 20 s timeout headroom (A-3).
- Other cases (invalid input, concurrency, permissions): N/A — test-only change with fixed inputs.

## 8. Security considerations
N/A — test-only change; no input, secrets, dependencies or randomness beyond the existing fixed seed.

## 9. Non-functional
- Local, with coverage, file alone: each test ≤ 2000 ms (baseline 1489 ms / 724 ms at 300 hands).
- Expected CI time (scaled from 3296 ms / 1746 ms): test 1 ≈ 2.2 s, test 2 well under 1 s, against a 20 s limit.

## 10. Test plan
- Test command: `npm test`
- Lint command: `npm run lint`
- Typecheck command: `npm run typecheck`
- Format command: `npm run format`
- Run command: `npx vitest run --coverage tests/playtest/style-check-short-handed.test.ts`
- New tests: none; changed test `tests/playtest/style-check-short-handed.test.ts` → SPEC-01, SPEC-02, SPEC-03.
  Judge scenario: run the Run command and read both durations (≤ 2000 ms each); run the `-t "6-max"` single-test
  filter; run the SPEC-03 playtest command; read the diff for SPEC-02.

## 11. Open questions
(none)

## 12. Clarifications log
See `doit/TASK-1.58/qa.md`.
