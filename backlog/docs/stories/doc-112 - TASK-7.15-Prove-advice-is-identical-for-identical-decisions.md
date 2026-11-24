---
id: doc-112
title: 'TASK-7.15: Prove advice is identical for identical decisions'
type: other
created_date: '2026-11-24T08:11:00Z'
updated_date: '2026-11-24T08:11:00Z'
---
# TASK-7.15: Prove advice is identical for identical decisions

Status: Done · Completed: 2026-11-24 · Epic: TASK-7 · Milestone: m-1 · Requirements: REQ-025, REQ-036, REQ-062 · Branch: doit/TASK-7.15

## What was asked
Show that the advice a player sees is repeatable. The playtest gets a `--check-advice` flag that computes the advice and the grade twice at every decision point and reports any difference. The hint and the later review must agree even though the finished hand changes the opponents' observed stats. The hint and grade must ignore hidden cards (1,000 seeded variations). Output must be byte-identical for the same seed. A stored recommendation must re-grade to a deep-equal `GradeResult`. Spec: doit/TASK-7.15/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Under `--check-advice` each decision gets an observed-stat snapshot built from the run's own completed hands: one entry per other seat with at least 1 hand dealt. `vpip`/`pfr` come unrounded from `styleStats`. Hands with violations or no result are skipped, and a replaced seat is reset. | yes | REQ-036 names observed stats as an advice input. The playtest has no other source of stats. | Use an empty snapshot (then TASK-7.13 scaling is never exercised) |
| A-2 | The advice compared is the user-facing advice: `recommend(view, {opponentRanges:'actions', observedOpponents})`, then `gradeDecision(rec, action.type)`. | yes | Matches what the worker and review use. | Compare bot advice options instead |
| A-3 | A mismatch is reported as the custom invariant `advice-determinism` through the existing violation path. That hand stops, the run continues, and the exit code is 1. | yes | Reuses the replay line and hand dump. | A separate exit code or a stop-the-run mode |
| A-4 | `applyUserAction(table, action, observed?)` stores a copy of the snapshot. Without it, the decision has no `observed` key. | yes | Later changes to the caller's array can't reach the record. | Store the reference, or freeze it |
| A-5 | `reviewEntries` uses `decision.observed` only when present, and otherwise behaves as before. | yes | Keeps existing review tests green. | Always pass `[]` |
| A-6 | The AC#4 spot is a multiway flop decision facing a bet (so equity is sampled), with a fixed snapshot. The call is graded. | yes | Sampled equity is where a hidden-card leak into the seed would show. | River-only, or several spots |
| Q-1 | Auto-accepted: the `--check-advice` CLI text (Options echo, `Advice check:` line, `First advice mismatch:` line, two error lines, USAGE changes). | yes | User-visible text, following the `--check-styles` pattern. | Reword the strings in `src/playtest/cli.ts` and re-pin `tests/playtest/cli.test.ts` |
| B-1 | Build deviation, auto-accepted: the AC#4 test and the 100-hand `--check-advice` tests use 300 s timeouts, not the spec's 60 s. | yes | Plain runtime is 15-21 s, but under `npm test` coverage and load it reached 78-113 s. 120 s timed out in one gate run. | Lower the timeouts and run those tests uncovered |
| B-2 | Build deviation, auto-accepted: a second USAGE pin in `tests/playtest/cli.test.ts` (the line-1 regex) was re-pinned one-for-one, in addition to the USAGE literal. The check count is unchanged. | yes | It is a direct consequence of the approved USAGE change. | Revert the pin along with the USAGE text |
| B-3 | Build deviation, auto-accepted: `ActionHook`'s `view` parameter is optional. | yes | `tests/playtest/style-check.test.ts` calls `onAction(step)` with one argument. The runner always passes it. | Make it required and update that test |

## Clarifications and decisions
- Q-1 (CLI text): auto-accepted under the unattended-approvals rule. `tests/playtest/cli.test.ts` is not hook-locked, so its USAGE pins were re-pinned one-for-one.
- D-1: every seat's decision point is checked, not only seat 1.
- D-2: `ActionHook` gains the exact `PlayerView` given to the policy.
- D-3: each decision runs advice and grade twice from `structuredClone`d inputs, then compares with a deep compare that returns the first differing path.
- D-5: the 10,000-hand runs are in `test:slow` only. Every push runs the same assertions at 100 hands.

## What was built
Without the flag, the playtest output is byte-identical to before (the judge checked this against main).

- `src/playtest/advice-check.ts` (new): `AdviceCheck` (double advice and grade per decision, counters, first mismatch with hand number, replay code and action number), `userAdvice`, `firstDifference` (Object.is for primitives, arrays by length then elements, objects by key list then values, giving a path such as `recommendation.explanation`), and `observedSnapshot`.
- `src/playtest/cli.ts`: the `--check-advice` flag. A duplicate flag, `--replay-code` or `--help` with it gives an error with exit 2. It combines with `--check-styles` and `--lineup`. Output adds `Advice check: <n> decision points, <m> mismatches` and, on a mismatch, `First advice mismatch: hand <k>, replay code <code>, player action <n> (<action>), <path> differs`. The USAGE text changed. `main` takes an `advise` seam as its last parameter.
- `src/playtest/runner.ts`: the action hook receives the decision's `PlayerView`.
- `src/table/session.ts`: `UserDecision.observed?` and `applyUserAction(table, action, observed?)`.
- `src/table/advice-service.ts`: optional `observed` on the worker's `recommend` and `grade` requests.
- `src/table/review.ts`: the review grades with each decision's own snapshot.
- `docs/advice/determinism.md`: the guarantee, the input-hash seed, the decision-time snapshot rule, and how to run the check.
- `package.json`: the new acceptance file is added to `test:slow`.
- Tests: `tests/playtest/check-advice.acceptance.test.ts`, `tests/advice/determinism.acceptance.test.ts`, `tests/playtest/advice-check.test.ts`, `tests/table/decision-snapshot.test.ts`. `tests/playtest/cli.test.ts` was re-pinned.
- No new dependencies. Nothing in `src/advice/*` changed.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | acceptance, 100 hands every push, 10,000 in slow | PASS | 100113 decision points, 0 mismatches, exit 0. The count equals the sum of all seats' actions. |
| SPEC-02 | AC#2 | acceptance with a varying stub | PASS | The first mismatch is reported with the replay code and the Replay line, and the exit code is 1. |
| SPEC-03 | AC#3 | acceptance | PASS | The review equals the hint under later stats. |
| SPEC-04 | AC#4 | acceptance, 1,000 variations | PASS | Hint and grade are unchanged, and at least 900 variations really differ. |
| SPEC-05 | AC#5 | acceptance | PASS | Two runs are byte-identical, and the 10,000-hand `cmp` was identical. |
| SPEC-06 | AC#6 | acceptance | PASS | The stored recommendation re-grades deep-equal. |
| SPEC-07 to 10 | AC#1-3, 6 | unit and acceptance | PASS | Flag parsing, `firstDifference`, snapshot isolation, session and worker. |
| SPEC-11 to 14 | DoD | commands, manual | PASS | See below. |

- Judge round 1 passed 14/14. `npm test` had 237 files passed and 3 skipped, with 1171 tests passed and 43 skipped. `test:unit` held its coverage thresholds, and the golden suite had 282 passed. `test:slow` had 88 passed; the new 10,000-hand cases took 634 s and 569 s against a 1,200 s timeout. The integrity check found no tampering, and holdout checks passed (17/17).
- The judge's holdout runs also covered a turn-only stub, heads-up, sit-and-go and 9-max lineups.
- Gates: 4 runs, with no escalations or send-backs.

## Review
Round 1 had no BLOCKER or MAJOR findings (code and security). The judge raised one LOW finding, J-1-01: the docs example shows 98012 decision points where the real seed-42 run prints 100113. The orchestrator is correcting it.

### Non-blocking review notes (deliberately not fixed)
- MINOR `scope-budget-lines-exceeded`: 1048 changed lines against a budget of 900. About 680 are the four new test files, and every file is in the spec's list. Accepted as test-heavy.
- MINOR `ac5-every-push-is-the-cost-driver`: the 100-hand AC#5 case takes about 15 s of the file's 21 s, because the mixed lineup produces many multiway sampled-equity spots. This is within the spec's budgets and is a required correctness check. If sweep time becomes a problem, drop that variant to about 30 hands through a spec change.
- NIT `advice-check-built-when-flag-off`: `AdviceCheck` is constructed and `startHand(1, ...)` runs even without the flag. The cost is negligible, and the output is unaffected.
- NIT `observed-seat-not-validated` (security): `observedBySeat` in `src/advice/ranges.ts` doesn't check that `seat` is an integer from 1 to 10. A bad seat never matches, and the error travels back as data. No reachable exploit.

## How to try it
- `npm run -s playtest -- --hands 10000 --seed 42 --check-advice` (about 9 minutes) prints `Advice check: 100113 decision points, 0 mismatches`.
- `npx vitest run tests/playtest/check-advice.acceptance.test.ts -t AC#2` shows the mismatch report.
- `TLH_SLOW_TESTS=1` or `npm run test:slow` runs the 10,000-hand cases.

## Run metrics
Questions asked: 1 (auto-accepted) · assumptions logged: 6 (A-1 to A-6) · review rounds: 1 · judge rounds: 1 · gate runs: 4 · escalations: 0 · send-backs: 0 · changed lines: 1048 (src and tests about 1022 added, 26 removed).

## Known limitations and follow-ups
- AC#3 is proven at the API level only. Session wiring of observed stats (computing them in the app and passing them with each decision) stays with TASK-8.1.
- Without a caller-supplied snapshot, a decision has no `observed` data, so the review falls back to the caller's options.
- Follow-up `[trainer]`: validate `observed[i].seat` as an integer from 1 to 10 in `observedBySeat` (`src/advice/ranges.ts`) so a malformed snapshot fails with a clear message. This is optional, and no existing task is known to own it.
- Follow-up `[trainer]`: if sweep time becomes a problem, cut the every-push AC#5 case from 100 to about 30 hands (needs a spec change to SPEC-05).
- Follow-up `[trainer]`: move `startHand(1, ...)` inside `if (checkingAdvice)` in `src/playtest/cli.ts`. It is a NIT with negligible cost.
- Docs: the J-1-01 example count in `docs/advice/determinism.md` is being corrected by the orchestrator.
- Not tracked (infra, below the value bar): none. The 300 s test timeouts are ceilings only and caused no failure beyond the one 120 s gate timeout during the build.

## Lessons for the factory (proposals — not applied)
- The spec's 60 s test timeout and its 2 ms-per-advice estimate came from a preflop-heavy average. A multiway flop advice costs about 14 ms, and tests under coverage ran 5 to 6 times slower than plain. Spec timing estimates for acceptance tests should be measured under `npm test` (coverage and parallel load), and timeouts should be set accordingly. This cost one failed gate run and a deviation record.
- When a spec changes a pinned CLI text such as USAGE, it should list every place that pins it (here, two spots in `tests/playtest/cli.test.ts`). The builder found the second one only by running the tests.
- Docs examples that quote real run output should be generated or checked against the actual run. The J-1-01 count was wrong.
