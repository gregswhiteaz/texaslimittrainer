# TASK-7.26: Author heads-up and full-ring default opponent ranges

Status: Done · Completed: 2026-11-25 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-035 (035.1, 035.2, 035.5), REQ-029.2, REQ-061.2 · Branch: doit/TASK-7.26

## What was asked
Postflop advice and bot decisions at heads-up (2 seats) and full-ring (8-10 seats) tables weighed each opponent against every unseen combo, because default opponent ranges existed only for 6-max. The story asks for original heads-up and full-ring ranges keyed by position and preflop line, each with a plain-English justification and a documented width band. The range validator must reject a missing pair. Postflop advice must start each opponent from the authored range for that size, position and line, then narrow it with TASK-7.5's rule. Spec: doit/TASK-7.26/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Observed-stats scaling (REQ-035.2/035.6) also applies at heads-up and full ring, since those sizes now have a default range. | yes | `estimateOpponentRanges` already scales from whatever default it finds; one code path. | Keep observed scaling 6-max only |
| A-2 | Position keys come from the existing `positionOf`. Heads-up: button = `BTN`, other seat = `BB`. With 10 seats the two earliest seats are both `UTG` and share ranges; with 8 seats nobody is `UTG`. | yes | Same mapping the heads-up and full-ring charts use (TASK-7.6 A-1). | Add separate UTG2 ranges at 10 seats |
| A-3 | Heads-up lines use the existing `preflopLineOf` rules: a button that completes is `limp`; a BB that raises a limp is `open-raise`; a button that limps then re-raises is `three-bet`. | yes | No change to line detection, so 6-max cannot move. | Add heads-up line names |
| A-4 | Applicable pairs follow the 6-max rule (`check` only for BB, `limp` for all but BB, other five lines for every position): heads-up 12 pairs, full ring 54. | yes | Mirrors `LINE_POSITIONS`; every pair can occur. | Drop rare pairs |
| A-5 | 6-max validator labels, order and messages stay byte-for-byte unchanged; new sizes use the same templates with their own label. | yes | Locked `range-model.acceptance.test.ts` pins the 6-max messages. | — |
| A-6 | New ranges obey the 6-max invariants: four-bet inside three-bet, limp and open-raise disjoint, BB check and BB open-raise disjoint, full-ring open-raise width not falling from UTG to BTN. A unit test checks them. | yes | Keeps the data self-consistent. | Bands only |

## Clarifications and decisions
All four questions were auto-accepted on the recommended option (autopilot). Poker content in Q-1 is flagged for your review.
- Q-1: approve the 66 ranges and bands in spec Appendix A (12 heads-up, 54 full-ring). Poker content, changes advice and bot play at those sizes.
- Q-2: golden spots that stop being clear-cut are replaced on the same street, size and action and logged. This unlocked the locked `tests/golden/postflop-spots.json` (owner TASK-7.14).
- Q-3: the slow 100,000-hand check logs the five stats and asserts zero violations and non-null stats. It does not assert the healthy ranges.
- Q-4: tables with 3, 4, 5 or 7 dealt-in seats keep "every unseen combo". Follow-up TASK-7.35 moves them to the 6-max ranges (already exists).
- Block 1: locked `tests/advice/preflop.acceptance.test.ts` AC#6 copies a fixed file list into a sandbox. The orchestrator added the two new JSON paths (no assertion changed), as TASK-7.13 did for `hand-order.json`.
- D-1 to D-5: ranges per Appendix A; `rangesFor(n)` maps 2 to heads-up, 6 to 6-max, 8-10 to full-ring, else null; golden re-pins logged in `golden-spots.md`; slow-test measurement approach; one data file per size in format v1.

## What was built
- `src/advice/ranges/heads-up.json` (new): 12 authored ranges, a file justification and one original justification per range.
- `src/advice/ranges/full-ring.json` (new): 54 authored ranges, same shape.
- `src/advice/ranges.ts`:
  - `APPLICABLE_LINES` is built per size from one line rule. The 6-max order is unchanged.
  - `parseDefaultRanges` accepts `heads-up`, `6-max` and `full-ring`. The size check uses `Object.hasOwn`, so `__proto__` and `toString` are rejected.
  - New exports: `HEADS_UP_RANGES`, `FULL_RING_RANGES`, `DEFAULT_RANGES` and `rangesFor(dealtIn)`.
  - `estimateOpponentRanges` calls `rangesFor(view.players.length)`. If it returns ranges, it keys the position by that size and starts from the authored class set. Observed scaling, dead-card removal and narrowing are unchanged. If it returns null, the old every-unseen-combo path runs.
- Docs: `docs/advice/range-model.md` (positions and files per size, band table, effect table, other table sizes), `docs/advice/postflop-rules.md` ("Not applied yet" now names only 3, 4, 5 and 7 seats), `docs/advice/golden-spots.md` ("Changes from TASK-7.26" log).
- `tests/golden/postflop-spots.json`: six spots re-pinned (Q-2). Only hole cards, id and justification changed. Counts 120/86/18/16 are kept.
- `package.json`: `test:slow` includes the new playtest file.
- No new dependency.

Example: heads-up, BTN raises, BB calls, BB checks, BTN bets. The opponent is `BTN open-raise` and starts from the authored heads-up range (width 49.3%), then is narrowed. Before this change it started from all 1081 unseen combos.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 | `size-ranges.acceptance.test.ts`: counts, order, word counts, exact problem lists for a missing pair | PASS | Judge holdouts: missing BTN limp, missing UTG+1 open-raise, short justification, blank hands each give exactly one problem |
| SPEC-02 | AC#1 | `ranges.test.ts` validator edge cases | PASS | Wrong-size pair, duplicate and unknown size (including `__proto__`) rejected; 6-max problem lists identical to base |
| SPEC-03 | AC#2 | Acceptance test, heads-up start, combos and equity input | PASS | Worked example start < 1081, advice equity input equals combos |
| SPEC-04 | AC#2 | Acceptance test at 8, 9, 10 seats | PASS | Starts from full-ring ranges |
| SPEC-05 | AC#3 | Acceptance test measures widths against bands in `range-model.md` | PASS | All 66 inside their bands |
| SPEC-06 | AC#1 | A-6 invariants and originality unit test | PASS | `ranges.test.ts` |
| SPEC-07 | measurement | Opt-in slow 100,000-hand all-TAG test at sizes 2 and 9 | PASS | `npm run test:slow`: 22 files, 100 tests passed; the new test took 452 s |
| SPEC-08 | measurement | Before/after stats in build-log and `range-model.md` | PASS | Table below |
| SPEC-09 | no regression | 6-max output byte-identical; 5-seat view still every unseen combo | PASS | `cmp` of 2,000-hand 6-max playtest identical |
| SPEC-10 | golden | `npx vitest run tests/golden` after six like-for-like replacements | PASS | 282 tests passed, re-pins logged |
| SPEC-11 | docs | Docs describe the three sizes | PASS | Judge |
| SPEC-12 | other checks | Gates and full suite | PASS | Gate build-1 and fix-2 PASS |

Suite results: `npm test` 316 files and 1428 tests passed (6 files and 48 tests skipped). Lint, typecheck and prettier are clean. `npm run e2e`: 375 passed, 19 skipped. `playtest:million --lineups`: PASS, 0 violations (588.6 s after vs 961.7 s before, so it got faster). 10,000-hand playtests at sizes 2, 6 and 9: 0 violations.

All-TAG stats (seed 42, summed over every seat; healthy ranges from `src/stats/healthy-ranges.json`):

| Size, hands | VPIP | PFR | Aggr | WTSD | W$SD |
|---|---|---|---|---|---|
| HU 5,000 before | 79.0 | 47.0 | 66.4 | 42.8 | 53.6 |
| HU 5,000 after | 79.0 | 46.9 | 69.4 | 43.4 | 53.8 |
| HU 100,000 after | 79.3 | 47.0 | 69.5 | 42.7 | 53.8 |
| HU healthy | 65-90 | 40-75 | 50-70 | 40-55 | 46-56 |
| 9-max 5,000 before | 15.2 | 11.3 | 59.6 | 51.2 (outside 28-40) | 50.2 |
| 9-max 5,000 after | 15.2 | 11.3 | 63.7 | 39.8 | 50.8 |
| 9-max 100,000 after | 15.1 | 11.3 | 63.8 | 38.4 | 50.9 |
| FR healthy | 13-20 | 9-16 | 50-66 | 28-40 | 47-57 |

Every stat is inside its healthy range after the change, so no bot-tuning follow-up is needed. The closest to an edge are HU aggression at 69.5 (ceiling 70) and 9-max WTSD at 38.4 (ceiling 40). Before the change, 9-max WTSD was outside its range.

Judge round 1: PASS, 12/12 items, no failures, no escalation. The judge's test-integrity check was clean. Finding J-1-01 was the golden justification for `fr-river-utg-fold-jto`, which claimed a straight draw that the J-T hand did not have on that board. The orchestrator reworded it after the judge round.

## Review
Round 1: code review had no blocking findings. Security review had none (the new JSON is bundled and validated at load, and `Object.hasOwn` blocks prototype keys). The MINOR about the wrong `fr-river-utg-fold-jto` poker reasoning (a non-existent straight draw) was fixed by the orchestrator as J-1-01.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the `rangesFor` null case is tested only at 5 seats. A mistake in the 3, 4 or 7 mapping would pass every test. It should assert null for 3, 4, 5 and 7, and non-null for 2, 6, 8, 9 and 10.
- NIT: `DEFAULT_RANGES` is exported as the spec asked, but nothing in src or tests reads it.
- NIT: the effect table in `docs/advice/range-model.md` shows 10,000 and 100,000-hand figures, not the 5,000-hand ones SPEC-08 named. The build log has all three.

## How to try it
- `npm test` for the fast suite, including `tests/advice/size-ranges.acceptance.test.ts`.
- `npm run test:slow` for the 100,000-hand heads-up and 9-max measurement (about 8 minutes).
- `npm run -s playtest -- --hands 10000 --size 2` (or `--size 9`) to see the stats and violations.
- `npm run e2e` for the browser suite.

## Run metrics
Questions asked: 4 (plus one orchestrator-resolved block) · assumptions logged: 6 · review rounds: 1 · judge rounds: 1 · gate runs: 2 · escalations: 0 · sendbacks: 0 · changed lines: 1189 across 13 files (the spec budget was 1100 lines).

## Known limitations and follow-ups
- Tables with 3, 4, 5 or 7 dealt-in seats still use every unseen combo. This is owned by existing TASK-7.35 (move them to the 6-max ranges).
- [trainer] Strengthen the `rangesFor` test to assert null for 3, 4, 5 and 7 seats, and the exact ranges for 2, 6, 8, 9 and 10. Owner: TASK-7.35, which touches the same mapping.
- [trainer] Remove the unused `DEFAULT_RANGES` export, or use it in `rangesFor`. Owner: TASK-7.35.
- [trainer] Put the 5,000-hand before/after rows in the `range-model.md` effect table so it matches SPEC-08. This is a docs-only change and can be an AC on TASK-7.35.
- Poker content of the 66 ranges (Q-1) is auto-accepted and awaits your review.
- The 2,073-line `state.json` is large for a small run. It looks like the test snapshot dominates, and that was not investigated.

### Not tracked (infra, below the value bar)
- The new slow test takes 452 s. It is opt-in only and has caused no failure.

## Lessons for the factory (proposals — not applied)
- A locked test that copies a fixed file list into a sandbox (`preflop.acceptance.test.ts` AC#6) failed `npm test` once a new data file was imported. The spec's Files list could include a step: "grep locked tests for explicit file lists that need the new paths". This also happened in TASK-7.13 and was only caught at build time.
- The scope budget of 1100 lines was exceeded (1189), and the range JSON dominates. Spec budgets could count authored data files separately.
- A golden justification with wrong poker reasoning was only caught at review. The re-pin step could ask the builder to check each new justification against the board.
