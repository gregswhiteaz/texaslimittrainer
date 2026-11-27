# TASK-1.58: Stop the 3-seat style-check unit test timing out on CI

Status: In review (not set Done) · Completed: 2026-11-27 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: n/a (follow-up from TASK-7.37 SPEC-05) · Branch: doit/TASK-1.58

## What was asked
Main CI run 45992781358 failed once in "Unit tests with coverage": `tests/playtest/style-check-short-handed.test.ts` ("style check tallies TAG mixed spots with the short-handed chart at 3 seats") hit vitest's default 5000 ms timeout. It runs 300 hands under v8 coverage. The re-run passed (3296 ms). AC#1: the test finishes well inside its limit on CI and locally, with no assertion removed or loosened. Spec: doit/TASK-1.58/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Reduce to 200 hands (seed 42, 3 seats). | yes | Smallest measured count where both reachable TAG mixed spots see both actions (unopened 14/2, blind-defence 9/3). At 100 hands blind-defence never takes the alternative (5/0). | Set `HANDS` back to 300 (or 100). |
| A-2 | Capture playtest is computed lazily once per file; the `violations === 0` assertion still runs on every `preflopDecisions()` call. | yes | Removes one full playtest (second test took 1746 ms on CI) with no assertion lost; lazy so `-t` filtering still works. | Drop the cache. |
| A-3 | Per-test timeout is 20 000 ms. | yes | Worst passing CI time was 3296 ms at 300 hands; about 9x headroom, still fails fast on a real hang. | Change the constant. |

state.json records 0 assumptions logged and 0 questions; the three above are the spec's own table.

## Clarifications and decisions
- No questions asked (qa.md: "No ask items").
- D-1: fix in the test file only (fewer hands + shared capture + explicit timeout). No change under `src/`, `vite.config.ts`, `package.json` or CI.
- Recorded build deviation: the timeout is passed as vitest's options argument `{ timeout: 20_000 }` (shared constant) instead of the numeric third argument. Prettier would re-wrap both `it(...)` bodies and push the diff to about 88 lines against a 30-line budget. The limit is identical; the Judge confirmed vitest 5.1.0 honours it.

## What was built
- `tests/playtest/style-check-short-handed.test.ts` only (23 changed lines):
  - `HANDS` 300 → 200.
  - The capture playtest is split into `capturePreflop()` and cached lazily by `preflopDecisions()`, which still asserts the violation count is 0 on every call.
  - Both tests get `{ timeout: 20_000 }`, with a comment citing the CI measurement.
- No new dependencies; no production code touched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `npx vitest run --coverage` on the file | PASS | 2 passed; 1030 ms and 4 ms (limit 2000 each); options-form timeout holdout: `{timeout: 20_000}` survives a 6 s wait, `{timeout: 100}` fails |
| SPEC-02 | AC#1 | `git diff 116fd6a` on the file | PASS | All original assertions present and unconditional; test names unchanged |
| SPEC-03 | AC#1 | `npm run playtest -- --hands 200 --seed 42 --size 3 --check-styles` | PASS | unopened 14/2, blind-defence 9/3 |

- Full suite `npm test`: 1543 passed, 0 failed (348 files, 11 skipped files, 60 pre-existing opt-in skips); lint, typecheck and scope-budget gates pass (build-1 and fix-2: PASS; 23 lines vs budget 30, 1 file).
- `-t "6-max"` alone and test 1 alone both pass, so the lazy cache works under filtering.
- Judge: PASS in round 1 (3/3 items), no sendbacks.

## Review
No BLOCKER or MAJOR findings (code and security reviewers, round 1). Security: test-only change, no findings.

### Non-blocking review notes (deliberately not fixed)
- NIT (code): the shared options constant is named `LIMIT`, which reads like a bet limit in a limit hold'em codebase. Suggested rename to `TIMEOUT`.

## How to try it
`npx vitest run --coverage tests/playtest/style-check-short-handed.test.ts`

## Run metrics
Questions 0 · assumptions logged in state 0 (3 in spec) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 23 (1 file).

## Known limitations and follow-ups
- [trainer] Rename the `LIMIT` constant in `tests/playtest/style-check-short-handed.test.ts` to `TIMEOUT` (NIT); owner: TASK-1.58 itself if still open, otherwise a small new task.
- Whether CI is now reliably under limit is only proven locally; confirm on the next few main CI runs.

## Lessons for the factory (proposals — not applied)
- The spec's 30-line budget did not account for prettier re-wrapping of `it(name, fn, timeout)` forms, which forced the options-argument deviation. Spec guidance could note that a trailing-argument change to a multi-line test callback reformats the whole body, or the budget should exclude formatter-only lines.
