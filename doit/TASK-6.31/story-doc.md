# TASK-6.31: Judge the one-action style check only on mixed spots seen at least 10 times

Status: In Progress (Done not set by the Documentor) · Completed: 2026-11-28 (judge PASS) · Epic: TASK-6 — Face distinct opponents · Milestone: m-1 · Requirements: REQ-028 (fit criterion reworded by TASK-6.30, decision-9), REQ-028.3, REQ-027 · Branch: doit/TASK-6.31 · Label: follow-up

## What was asked
`npm run playtest -- --check-styles` failed a run when a mixed spot used only one action, even if the spot came up once. TASK-6.30 (decision-9, N = 10) changed the rule: a mixed spot is judged only when recommended + alternative >= 10. Spots with 1 to 9 decisions keep their `Mixed spot:` line and get a separate `Not judged (fewer than 10 decisions): <style> <spot>` line, and they do not fail the check. Spots with 0/0 pass as before. The tests that depended on the old rule are re-pinned, and the help text and docs are updated. Spec: doit/TASK-6.31/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | New `--check-styles` usage sentence says "every mixed spot that came up at least 10 times used both actions (rarer spots are listed as not judged)". | yes | Smallest edit to the existing line in `src/playtest/cli.ts`. | Edit the line and its two copies in `tests/playtest/cli.test.ts`. |
| A-2 | Fast never-mixing case re-pinned from `mixedSpots(300)` to `mixedSpots(1000)`; the slow twin (already 1,000) is unchanged. | yes | Measured: a never-mixing TAG sees `preflop-unopened` 8 times at 300 hands (below 10, so the case would stop failing), 34 at 1,000. About 8 s, well under the 60 s timeout. | Use 600 hands (17 decisions). |
| A-3 | Docs wording: `style-stats.md` gets the 10-decision rule; `range-model.md` 3-seat row becomes `exit 0` and its paragraph cites the REQ-028 fit criterion, not REQ-027.5. | yes | Facts were measured in spec §3. | Restore the old row and add a new one. |
| A-4 | `Not judged` lines come right after the last `Mixed spot:` line, before `Outside band:` and `One action only:` lines. | yes | AC#1 says it "follows the Mixed spot lines". | Move the line after the `One action only:` lines. |
| A-5 | A spot seen 1 to 9 times is "not judged" even if it used both actions (for example 3/4). | yes | One rule, no special case (TASK-6.30 D-1). | List only 1-9 spots that used one action. |
| A-6 | AC#1 is shown end to end by a new fast acceptance test: `--hands 1000 --seed 42 --lineup mixed --size 6 --check-styles`. | yes | The only fast real run with 1-9 spots and no band failure; it fails on the base commit. | Drop the test (leaves the line unproven end to end). |

## Clarifications and decisions
- Q-1 (user chose a, Recommended): AC#3 contradicted current main. The 3-seat 100,000-hand run already exits 0 on main, because TAG `preflop-limpers` is 0/0 since TASK-7.40 to 7.42. AC#3 was reworded (task updated via CLI) to: the 3-seat seed 42 run exits 0 with `Style check: passed` and no `One action only` line, and the locked 3-seat test asserts that again. The `Not judged` line is proven by the new fast 1,000-hand mixed 6-max test.
- D-1: judge when recommended + alternative >= 10; 1-9 listed as not judged; 0/0 silent (decided in TASK-6.30).
- D-2: the threshold is one exported constant, `MIN_JUDGED_DECISIONS = 10`, used by the rule and the message.
- D-3: AC#3 as reworded in Q-1.

## What was built
- `src/playtest/style-check.ts`: exports `MIN_JUDGED_DECISIONS = 10`. `formatStyleReport` judges a spot only at 10 or more decisions and prints `Not judged (fewer than 10 decisions): <style> <spot>` lines after the `Mixed spot:` lines. No new counter; `StyleCheck.add` and `MixedCounts` unchanged.
- `src/playtest/cli.ts`: `--check-styles` usage line (A-1).
- `tests/playtest/cli.test.ts`: the two copies of the usage line.
- `tests/playtest/style-check.test.ts`: new test "formatStyleReport judges a mixed spot only when it came up at least 10 times" (cases 0/0, 1/0, 9/0, 0/9, 3/4, 9/1, 10/0, 0/10, no check).
- `tests/playtest/check-styles.acceptance.test.ts` (locked by TASK-6.11 and TASK-6.25, unlocked with reason): fast case `mixedSpots(300)` becomes `mixedSpots(1000)`.
- `tests/playtest/check-styles-three-seats.acceptance.test.ts` (locked by TASK-7.46, unlocked with reason): asserts exit 0, `Style check: passed`, no `One action only:`; comment cites the REQ-028 fit criterion.
- `tests/playtest/check-styles-not-judged.acceptance.test.ts`: new fast acceptance test (SPEC-09).
- `docs/stats/style-stats.md`, `docs/advice/range-model.md`: rule and current 3-seat measurement.
- `doit/TASK-6.11`, `TASK-6.25`, `TASK-7.46` `state.json`: unlock records.
- Git diff against base for src, tests and docs: 9 files, +114 / -33. No bot, advice, engine or stats code changed (diff empty). No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1, AC#2 | unit test in style-check.test.ts (10-decision boundary) | pass | judge verdict-1 |
| SPEC-02 | AC#2 | same unit test (1-9 not judged; 10/0 and 0/10 fail) | pass | judge verdict-1 |
| SPEC-03 | AC#3, AC#6 | locked 3-seat acceptance test, 100,000 hands, slow | pass | 73 s |
| SPEC-04 | AC#2, AC#4 | check-styles acceptance, fast never-mixing case at 1,000 hands | pass | about 8 s |
| SPEC-05 | AC#4 | slow: 100,000 Mixed 6-max hands, seeds 42, 7, 1234 | pass | 770 s |
| SPEC-06 | AC#5 | `--help` grep plus cli.test.ts cases | pass | judge verdict-1 |
| SPEC-07 | AC#6 | docs grep for "at least 10 times" and "exits 0"; no REQ-027.5 | pass | judge verdict-1 |
| SPEC-08 | AC#1 | `npm test`, lint, typecheck, empty diff on src/bots, advice, engine, stats | pass | 358 files passed, 11 skipped; 1590 tests passed, 60 skipped |
| SPEC-09 | AC#1, AC#3 | new fast acceptance test (1,000-hand mixed 6-max, seed 42) | pass | fails on base 29ec6ce0 (exit 1), passes now (about 2.9 s) |

- End to end by the judge: 3-seat 100k seed 42 exits 0 with `Style check: passed` and no `Not judged`, `One action only` or `Outside band` lines. The 1,000-hand mixed 6-max run exits 0 with `Not judged` lines for TAG `preflop-limpers` and `preflop-raise-and-calls`; the same command on the base commit exits 1.
- Gates: 2 runs (build-1, fix-2). Judge round 1: PASS, 9/9 items, no missing results, no unproven AC.

## Review
No blocking findings (code and security reviews, round 1). Judge: no blocking findings; no sendbacks.

### Non-blocking review notes (deliberately not fixed)
- MINOR (code review; same as judge J-1-01, LOW): no test pins that `Not judged` lines come before `Outside band:` and `One action only:` lines (A-4). Swapping the order in `lines.push(...)` would still pass. The observed order is correct. Below the value bar, so not tracked.

## How to try it
- `npm run playtest -- --hands 1000 --seed 42 --lineup mixed --size 6 --check-styles` (exit 0, two `Not judged` lines)
- `npm run playtest -- --hands 100000 --seed 42 --size 3 --check-styles` (exit 0, `Style check: passed`)
- `npm run playtest -- --help` (new usage sentence)
- `npx vitest run tests/playtest/style-check.test.ts tests/playtest/check-styles-not-judged.acceptance.test.ts`
- Slow, opt-in: `npm run test:slow`

## Run metrics
Questions 1 · assumptions 6 (A-1 to A-6) · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0 · changed lines +114 / -33 across 9 files in src, tests and docs.

## Known limitations and follow-ups
- Follow-ups: none worth a task. The ordering gap (A-4) is below the value bar.
- The `Not judged` rule is verified at 1,000 hands (fast) and by the slow 100,000-hand runs; the fast never-mixing case now depends on a never-mixing TAG seeing at least 10 `preflop-unopened` decisions in 1,000 hands (34 measured).

## Lessons for the factory (proposals — not applied)
- The task's AC#3 was written from a measurement that had gone stale (TASK-7.40 to 7.42 landed in between), which cost a question to the user. Proposal: when a follow-up task cites a measured failing run, have the spec stage re-run that command on current main before drafting the ACs, and flag a mismatch at spec time (this run did so at spec time; keep it as a standing step).
- The locked-test unlock covered three owners and wrote state.json records into other tasks' folders; this worked but is easy to miss. Proposal: list unlock records in the spec's Scope as a line item.
