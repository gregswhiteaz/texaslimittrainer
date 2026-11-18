# TASK-7.2: Recommend a preflop action from the 6-max chart

Status: Built, review clean (judge and final CI pending) · Completed: 2026-11-18 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-0 · Requirements: REQ-025.2, REQ-032.2–032.6, REQ-061.2 · Branch: doit/TASK-7.2

## What was asked
As a learner, I want a preflop recommendation taken from an authored 6-max chart, so I learn which starting hands to play from each position. The advice reads chart data files rather than hard-coded logic. It takes only a `PlayerView`, so hidden cards cannot leak (REQ-025.2). It must return a legal action: a raise on a capped street becomes call, and a call with nothing to call becomes check. 6-max only; heads-up and full ring are TASK-7.6. Spec: doit/TASK-7.2/spec.md (8 acceptance criteria).

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Three modules (`hand-class.ts`, `preflop-chart.ts`, `preflop.ts`), a data folder `src/advice/charts/`, tests in `tests/advice/`. | yes | Matches the one-module-per-concern layout of earlier advice tasks. | Merge into one `preflop.ts` |
| A-2 | A raise is "with calls" only when someone called after the single raise. Limps before the raise do not count. The hero's own earlier limp is ignored. | yes | UTG can only face a raise after limping. Callers after the raise change the pot odds. | Count limpers as callers |
| A-3 | "Capped" means `view.betCount >= 4`, checked by the advice. A raise also becomes call when `legalActions` has no raise. | yes | The engine does not cap streets yet (TASK-1.12), but AC#7 needs call at the fourth bet. | Rely on `legalActions` only |
| A-4 | With nothing owed (BB facing limpers), call and fold both become check. The validator rejects `F` cells in that spot. | yes | Folding when you can check is never correct. | Allow F cells and convert silently |
| A-5 | The alternative goes through the same legality adjustment. It becomes `null` if it then equals the action. An alternative equal to the cell's own action is a validation error. | yes | Grading (TASK-7.4) and the mixing rule (TASK-6.2) need a legal, different alternative. | Return the raw alternative |
| A-6 | The result also carries `move`: the exact `Action` from `view.legalActions`. | yes | The TAG bot (TASK-6.1) needs a legal `Action` without repeating the lookup. | Leave lookup to callers |
| A-7 | `recommendPreflop` throws `RangeError` for a non-preflop view, a seat not to act, or a table without exactly 6 dealt-in seats. | yes | Same convention as engine and equity code. Other sizes belong to TASK-7.6. | Return an error field; map sizes now |
| A-8 | The validator collects every problem and throws one `ChartValidationError` with `problems: string[]`. | yes | Authors fix a chart in one pass. | Stop at first problem |
| A-9 | "Plain-English justification" is checked mechanically: chart-level text at least 50 words, each spot at least 15. A word is a run of letters. | yes | Gives AC#2 an objective rule. Originality stays a manual review. | Check non-empty only |
| A-10 | The shipped chart is parsed once at import (`SIX_MAX_CHART`). An invalid chart makes the import throw and `npm test` fail. | yes | Fails fast. Parsing 4,394 cells takes milliseconds. | Parse lazily |
| A-11 | Hand-class names put the higher rank first with `s`/`o` (`AKs`, `T9o`, `22`). Grid order A..2, suited above the diagonal, offsuit below, pairs on it. | yes | Standard chart layout. Matches REQ-042.6's "A9o". | Other orders |
| A-12 | Combo weights for width checks: pairs 6, suited 4, offsuit 12, out of 1,326. | yes | Exact combinatorics. | Count classes |

## Clarifications and decisions
All four questions were asked on 2026-11-18 and the user took the recommended option each time (doit/TASK-7.2/qa.md).

- Q-1 (D-1) Chart author and tightness: Claude writes an original first-principles TAG chart. Raise-or-fold first in, SB completes at most 10%, nested opening ranges, combo-share bands, AA/KK/QQ always raise. The user reviews the finished chart afterwards.
- Q-2 (D-2) Format: one JSON file `src/advice/charts/six-max.json`, format `tlh-preflop-chart` v1, 13×13 text grid. Tokens are `R`/`C`/`F`, `*` marks borderline, `/X` gives the alternative. Static import, no fetch.
- Q-3 (D-3) API: `recommendPreflop(view, options?: { chart? })` returns basis, referenceSize, position, situation, handClass, the raw cell, the legalised action, borderline and alternative, and `move`.
- Q-4 Fixed 26 spots ignore the raiser's position and lump re-raise cases together. The user chose to ship the 26 spots as specified and add a spike follow-up (see below).

## What was built
`recommendPreflop(view)` works out the acting seat's position (UTG, HJ, CO, BTN, SB, BB) by rotating `view.players` from `view.button`. It classifies the situation from `view.actions`, takes the hand class from the hole cards, and reads one cell of the chart. It then makes the action legal and returns the result. The engine is untouched.

26 spots: unopened (UTG, HJ, CO, BTN, SB), limpers (HJ, CO, BTN, SB, BB), raise (UTG, HJ, CO, BTN), raise-and-calls (UTG, HJ, CO, BTN), re-raise (UTG, HJ, CO, BTN, SB, BB) and blind-defence (SB, BB).

| File | Purpose |
|---|---|
| `src/advice/hand-class.ts` | 169 hand classes in grid order, `handClassAt`, `handClassOf`, `comboCount` |
| `src/advice/preflop-chart.ts` | Chart types, `APPLICABLE_SPOTS`, `parseChart`, `ChartValidationError`, `chartCell` |
| `src/advice/charts/six-max.json` | The authored chart: 26 spots × 169 cells, a chart-level justification and one per spot |
| `src/advice/preflop.ts` | `SIX_MAX_CHART`, `positionOf`, `situationOf`, `recommendPreflop`, legality adjustment, `move` |
| `tests/advice/*.test.ts` (5 files) | Acceptance (locked), unit, validator, hand-class and chart sanity tests |

No new dependencies. No changes to `src/engine`, `src/ui`, `e2e` or the toolchain.

### The chart, for your review
This is original content, authored by Claude from first principles. It is the strategy the TAG bot will play. Widths are shares of the 1,326 combos. Each justification is in the JSON. Open the JSON and read the 13×13 grids to judge the specifics.

| Spot | Raise % | Continue % |
|---|---|---|
| UTG unopened | 16.0 | 16.0 |
| HJ unopened | 19.2 | 19.2 |
| CO unopened | 27.0 | 27.0 |
| BTN unopened | 40.6 | 40.6 |
| SB unopened (completes 6.6) | 30.6 | 37.3 |
| HJ facing limpers | 9.4 | 15.5 |
| CO facing limpers | 10.9 | 17.6 |
| BTN facing limpers | 12.8 | 19.2 |
| SB facing limpers | 6.2 | 17.0 |
| BB facing limpers (checks free) | 9.4 | 100.0 |
| UTG facing a raise | 3.3 | 6.6 |
| HJ facing a raise | 5.3 | 6.6 |
| CO facing a raise | 6.6 | 8.4 |
| BTN facing a raise | 8.9 | 11.0 |
| UTG raise-and-calls | 2.6 | 10.4 |
| HJ raise-and-calls (after review fix) | 3.3 | 14.3 |
| CO raise-and-calls | 3.3 | 13.4 |
| BTN raise-and-calls | 4.5 | 16.1 |
| UTG re-raise | 2.6 | 9.7 |
| HJ re-raise | 2.6 | 10.4 |
| CO re-raise | 2.6 | 11.8 |
| BTN re-raise | 3.3 | 15.8 |
| SB re-raise | 2.6 | 6.9 |
| BB re-raise | 2.6 | 10.4 |
| SB blind-defence | 9.5 | 10.7 |
| BB blind-defence | 5.7 | 43.6 |

Source: the SPEC-12 output of `tests/advice/six-max-chart.test.ts`, re-run for this document. The build log's own list showed HJ raise-and-calls at 10.7% before the fix.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 to SPEC-08 | AC#1–AC#8 | Locked acceptance tests in `tests/advice/preflop.acceptance.test.ts` (46 asserts) | Pass | Gate runs 1 and 2 |
| SPEC-09, SPEC-10 | Position and situation rules, legality, API errors, speed | `preflop.test.ts` | Pass | Gate runs 1 and 2 |
| SPEC-11 | Validator messages and grid parsing | `preflop-chart.test.ts` | Pass | Gate runs 1 and 2 |
| SPEC-12 | Chart follows the authoring guide (width bands, nesting) | `six-max-chart.test.ts` | Pass | Width table above |
| SPEC-13 | Hand classes | `hand-class.test.ts` | Pass | Gate runs 1 and 2 |
| SPEC-14 | Lint, typecheck, coverage, headless and offline | `npm run lint`, `npm run typecheck`, `npm test` | Pass | Gate: 36 files, 110 passed and 1 skipped, advice 100% lines |
| SPEC-15 | Chart content is original and justified | Manual review | Pass in round 2 (fail in round 1) | Review r1 and r2 |
| SPEC-16 | CI green on the story branch | GitHub Actions | Pending | Final CI run after this document |
| SPEC-17 | Conditional DoD items and this document | This document | Written | — |

- Gates: build-1 PASS and fix-2 PASS. Changed lines 1,789 against a budget of 1,900. 9 files, equal to the budget.
- Judge: pending. No judge rounds yet.

## Review
Round 1 (code and security):
- MAJOR, SPEC-15: `hj-raise-and-calls-wrong-premise`. The HJ raise-and-calls justification said the raiser "came from an early seat". That spot cannot occur, because HJ sits directly after UTG. HJ only faces raise-and-calls after limping itself, when a later seat raised and others called. The grid was built on the same wrong idea and folded hands (A9s–A6s, KTs, QTs, 87s) that CO raise-and-calls calls. Resolved in the fix round (commit 5f18b57, data only). The justification now describes the real spot and the grid was re-authored, so the continue width went from 10.7% to 14.3% (raise 3.3%). That sits within the 6–18% band and between CO (13.4%) and BTN (16.1%).
- Security round 1: no BLOCKER or MAJOR.

Round 2: code review had no BLOCKER or MAJOR. Security round 2 was clean. The reviewer found the fix coherent, with no raise/fold inversions against CO.

### Non-blocking review notes (deliberately not fixed)
- MINOR: BB blind-defence marks K9o as a borderline call (`C*/F`) while the weaker Q9o, J9o and T9o are plain `C`. Grading and golden spots would treat K9o as the close decision.
- MINOR: No test checks that a word is a run of letters (A-9). Mutating `/\p{L}+/gu` to `/\S+/` in `wordCount` passes every test, so a justification of 60 numbers would be accepted.
- NIT: The HJ raise-and-calls text says we "usually close" the action. HJ always closes it here. It also says "suited aces", but A7s, A6s, A3s and A2s fold.
- NIT: `chartCell` throws `RangeError('Unknown hand class …')`, which the spec does not list. It is a reasonable guard, but it is unrequested behaviour.
- NIT: In `positionOf`, `start <= 0` could be `start < 0`. The two are equivalent, so the mutant survives.
- NIT (security): validator messages echo raw tokens without a length limit. It is not reachable, because the only input is the bundled JSON.

## How to try it
- `npm run lint && npm run typecheck && npm test`
- `npx vitest run tests/advice/six-max-chart.test.ts` prints the width table above.
- Read `src/advice/charts/six-max.json` for the grids and justifications. To see that advice follows the data, flip the `A9o` token in a copy of the JSON and pass it as `options.chart`.

## Run metrics
Questions asked: 4 · assumptions logged: 12 · review rounds: 2 · judge rounds: 0 so far · gate runs: 2 · escalations: 0 · changed lines: 1,789 (9 files).

## Known limitations and follow-ups
- Only 6 dealt-in seats are supported. Other sizes throw (A-7, TASK-7.6).
- The 26 spots ignore the raiser's position, and all re-raise cases share one cell (Q-4).
- Until TASK-1.12 caps streets, the advice caps at `betCount >= 4` by itself.

Follow-ups, one line each. The orchestrator turns them into tasks:
1. Spike: decide whether to split chart spots by raiser position and by open-was-re-raised versus cold re-raise (REQ-032.2 change, Q-4).
2. Retune the 6-max chart if the TAG bot's VPIP/PFR fall outside REQ-027.1 when measured in TASK-6.16.
3. Add display labels for positions and situations (such as "the cutoff", "facing a raise") for the REQ-042.6 hint text.
4. Add a script that prints each chart spot as a 13×13 grid with raise and continue percentages, for user review of the chart.
5. Once TASK-1.12 caps streets, confirm `legalActions` and the advice's `betCount >= 4` rule agree (owner: TASK-1.12).
6. Handle preflop advice when the hero cannot afford a full call or raise, once short all-ins exist (owners: TASK-1.9, TASK-7.17).
7. Chart: make K9o a plain `C` in BB blind-defence, or name it as the edge hand in the justification.
8. Add a validator test where a justification of 60 numeric or punctuation tokens is rejected as missing (pins A-9 letters-only).
9. Chart text: change HJ raise-and-calls "usually close" to "close", and "suited aces" to "the better suited aces".
10. Record the `chartCell` unknown-hand-class `RangeError` as a deliberate guard, or add it to the spec's error list.
11. Optional: change `start <= 0` to `start < 0` in `positionOf` in `src/advice/preflop.ts`.
12. Optional: truncate echoed tokens in `parseChart` error messages, if the validator ever takes non-bundled input.

## Lessons for the factory (proposals — not applied)
- The HJ raise-and-calls spot was authored on a premise the position order makes impossible, and only review caught it. Proposal: for a content-authoring story, the spec should list which seats can occupy each spot. The builder could then check each justification against that list before review.
- Three review items (K9o, the letters-only test, the wording NITs) were carried unchanged into round 2 because the fix brief limits fixes to MAJOR and above. Proposal: allow the fix brief to include cheap MINOR items when the file is already being edited.
