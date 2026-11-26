# TASK-7.31: Give postflop golden spots chart-consistent preflop lines

Status: Done (judge round 2 PASS, 9/9) · Completed: 2026-11-25 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: none listed · Branch: doit/TASK-7.31

## What was asked
Follow-up from TASK-7.14 (doc-111). Many postflop golden spots reached their decision through hero preflop actions the project's own chart grades as Major errors (UTG opening 92o, 82o, T4o, K3o, K2o; CO opening 72o, 83o; full-ring UTG 94o; BB only calling an SB raise with AA). A trainer's reference spots should not model bad preflop play. Three acceptance criteria:
1. No postflop golden spot has a Major hero preflop action (a test enforces it), with decisions and clear-cut margins re-validated.
2. `6max-turn-bb-raise-92o` says "kings full", not "set of kings".
3. A `gradeDecision` throw during validation is listed as a problem for that spot id, not thrown.

Spec: doit/TASK-7.31/spec.md.

## Assumptions made without asking — please review
All reversible. No questions were asked of the user beyond the auto-accepted unlock Q-1.
| ID | Assumption | Why | To reverse |
|---|---|---|---|
| A-1 | Graded examples (`tests/golden/graded-examples.json`) are out of scope, although three still have Major hero preflop lines. | The AC names "every postflop golden spot"; graded examples are a separate file whose exact Minor margins are hard to re-pin. | Follow-up below. |
| A-2 | "Hero preflop actions" = every `before` step the hero takes while the street is preflop. Earlier hero postflop steps are not graded. | Matches the AC and the review finding. | Also grade earlier postflop steps. |
| A-3 | A step passes when `gradeDecision(recommend(view), step)` is not `major`. A borderline Minor step is allowed (every current one is Correct). | Same grade the learner gets in play; AC's literal bar. | Require Correct only. |
| A-4 | The rule lives in the validator `parsePostflopGoldenSpots` (as the clear-cut rule does), and the acceptance test re-checks it. | A future bad spot is rejected at parse. | Enforce in a test only. |
| A-5 | Problem texts: `Golden spot <id>: hero preflop step <k> "<action>" is a Major error on the chart (<size> <position> <situation> <hand class>: <chart action>)` and `Golden spot <id>: clear-cut check failed (<message>)`. | Fits existing message styles; developer-facing only. | Reword. |
| A-6 | Replacement order per spot: (a) change the hero's action to the chart's, keep id; (b) keep line and board, swap hole cards (TASK-7.32 convention, new id); (c) change line or position. Street, table size, recorded action, multiway and stats status stay the same. | Least change first; keeps coverage counts. | Different re-authoring policy. |
| A-7 | `6max-turn-bb-raise-92o` keeps its id and cards (2c 9d). Its line becomes a limped pot where the BB checks its option: `call, fold, fold, fold, fold, check, bet, call, bet, raise`. | AC#2 names the id; checking the option is the only chart-consistent way for 92o to see a flop. Advice raise, 88.0% equity, 23 points clear. | Move the hand to a new id (breaks AC#2). |
| A-8 | The acceptance test pins coverage exactly: 120 spots; flop 45, turn 40, river 35; 86 six-max, 18 heads-up, 16 full-ring; call 27, raise 24, bet 23, check 23, fold 23; 20 multiway; 4 with opponent stats. | Numbers measured before the change and documented. | Floors only. |

## Clarifications and decisions
- Q-1 — Unlock `tests/golden/postflop-spots.json` (locked, owner TASK-7.14) for like-for-like re-authoring of the 72 spots. Auto-accepted (recommended), as TASK-7.26 and TASK-7.32 did; every change logged.
- D-1 — Every changed spot is replaced like-for-like (A-6) and logged in `docs/advice/golden-spots.md` under "Changes from TASK-7.31 (chart-consistent hero lines)" with old id, new id and reason.

## What was built
- `src/advice/golden.ts`: new private `heroPreflopProblems` rule. A postflop spot whose hero preflop step grades Major is rejected with the A-5 text before any advice runs. The clear-cut check now runs in its own try/catch, so a `gradeDecision` throw becomes `clear-cut check failed (<message>)` for that spot (AC#3).
- `tests/golden/postflop-spots.json` (unlocked by Q-1): 72 spots with Major hero preflop lines re-authored. 10 take the chart's action (ids kept), 59 swap hole cards (new ids), 2 change line, and `6max-turn-bb-raise-92o` follows A-7 ("kings full"). Every changed justification was rewritten, except `fr-flop-bb-raise-a3s`, whose justification was kept because it is still accurate for its cards and board.
- `tests/golden/postflop-lines.acceptance.test.ts` (new, locked): SPEC-01 to SPEC-05.
- `tests/golden/postflop-golden.test.ts`: heads-up second-pass probe now uses a chart-consistent line (`raise, raise, call`); new unit test for the rule and guarded check (SPEC-06).
- `docs/advice/golden-spots.md`: the postflop `before` rule and failure texts, "Adding a spot" step 2 (Major rule; a borderline Minor step is allowed), the example, the 72-row change table, and a note on the four wording-only fixes outside it.
- No new dependencies. 31 files changed on the branch including doit artifacts; final gate counted 783 changed lines in the five code and doc files.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 no Major hero preflop step | acceptance test | PASS | postflop-lines.acceptance.test.ts |
| SPEC-02 | validator rejects bad line | acceptance test | PASS | judge restored old `6max-turn-utg-fold-82o`; parse failed with the A-5 text |
| SPEC-03 | coverage, clear-cut, advice agreement | acceptance test | PASS | exact A-8 counts |
| SPEC-04 | AC#2 kings full | acceptance test | PASS | no "set of kings" |
| SPEC-05 | AC#3 throw becomes problem | acceptance test | PASS | |
| SPEC-06 | validator unit behaviour | unit test | PASS | postflop-golden.test.ts |
| SPEC-07 | docs and change log | manual (judge) | PASS | table rows match the diff |
| SPEC-08 | justifications factually accurate | manual fact check | PASS in judge round 2 | build-log.md table; 120-spot check |
| SPEC-09 | lint, typecheck, tests, locked-test diff | command | PASS | judge r2: 1439 tests passed (318 files), golden dir 288 passed |

- Gates: build-1, fix-2, fix-3, all PASS.
- Judge round 1 FAIL on SPEC-08: several justifications used "X-high" or named a playing card wrongly where a board card plays (nine wording fixes). Fixed with wording-only changes to `postflop-spots.json`. Round 2 PASS. A judge finding J-1-02 was withdrawn. J-2-01 (docs did not mention the four wording-only fixes) was fixed by the orchestrator with a docs sentence.

## Review
Three review rounds (code and security).
- Round 1 MAJOR: the `6max-turn-bb-raise-92o` justification listed the hands ahead of the hero incompletely (it left out nines full of fours). Fixed with a complete list.
- Round 1 MINOR: no-pair justifications named a high card the board outranks (`6max-river-sb-check-qjo`, `-utg-fold-t9s`, `-utg-fold-jts`, `-btn-fold-76s`). Fixed. "Adding a spot" overstated the rule (said "must be the chart's action"). Fixed. `fr-flop-bb-raise-a3s` justification unchanged: judged accurate and kept.
- Round 1 NIT (kicker that does not play in `6max-river-bb-check-53s`, `6max-turn-bb-check-85s`): fixed.
- Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- NIT `src/advice/golden.ts:548`: the `if (!result.ok) break;` and the `as Action` cast in `heroPreflopProblems` are unreachable, because `buildView` already replayed the same steps. Kept as a cheap guard.
- NIT `tests/golden/postflop-lines.acceptance.test.ts:122`: `expect(SPOTS).toHaveLength(RAW.spots.length)` cannot fail, since the parser returns every spot or throws. The `toHaveLength(120)` that follows is real. File is locked, so left alone.

## How to try it
- `npx vitest run tests/golden/` (golden suite, 288 tests)
- `npm run lint && npm run typecheck && npm test`
- To see the rule fire, put back a Major hero line (for example UTG raising 82o) in `tests/golden/postflop-spots.json`. The parse throws `Golden spot <id>: hero preflop step 1 "raise" is a Major error on the chart (6-max UTG unopened 82o: fold)`.

## Run metrics
Questions asked 0 (1 auto-accepted unlock) · assumptions logged 8 · review rounds 3 · judge rounds 2 · gate runs 3 · escalations 0 · sendbacks 1 · changed lines 783 (gate fix-3).

## Known limitations and follow-ups
- [trainer] Re-author the three graded examples in `tests/golden/graded-examples.json` whose hero preflop lines are still Major errors (`graded-postflop-fold-minor-6max-flop-gutshot`, `graded-postflop-check-minor-6max-river-top-pair`, `graded-postflop-check-major-6max-turn-trips`), re-pinning grade, rule id and margin, and extend the validator or test to cover that file. Owner: no existing task known; needs a new task under TASK-7 (this is spec A-1).
- [trainer] Optional cleanup of the two NITs above (unreachable break in `golden.ts:548`; tautological length assert, needs unlock of the locked test). Low value; fold into the graded-examples task when the test is unlocked anyway.

Not tracked (infra, below the value bar): none.

## Lessons for the factory (proposals — not applied)
- `doit.py verdict` is not idempotent. Re-running it inflated `item_failures` in state.json, and the orchestrator had to reset it. Proposal: make verdict record each (round, item) once, or refuse a second run for the same judge round. [infra] It caused a real wrong state value here, so it is worth tracking.
- SPEC-08 (wording accuracy of 72 rewritten justifications) failed in judge round 1 and cost a fix round, after a review MAJOR and MINORs of the same kind. Proposal: when a spec asks for many hand-written descriptions, the build step should generate and check the hand category and playing cards with the evaluator before writing the text, and the builder should run that check as a script, not by eye.
- The spec's A-1 scoping left a sibling file (`graded-examples.json`) with the same defect. Proposal: when a rule is added for one data file, the spec should list every file carrying the same kind of data and either cover it or name the follow-up task up front.
