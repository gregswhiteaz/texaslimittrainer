# TASK-7.36: Give graded postflop examples chart-consistent preflop lines

Status: Done · Completed: 2026-11-26 · Epic: TASK-7 — Get trustworthy advice · Milestone: m-1 · Requirements: REQ-037, REQ-038, REQ-039, REQ-061.2 · Branch: doit/TASK-7.36

## What was asked
TASK-7.31 stopped postflop golden spots from reaching their decision through a hero preflop action the chart grades as a Major error. It left `tests/golden/graded-examples.json` out of scope. This story applies the same rule to postflop graded examples. It re-authors the three examples that broke it, like-for-like (same id, seats, street, user action, grade, rule id and margin). It also removes an unreachable `if (!result.ok) break;`. Spec: doit/TASK-7.36/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The rule applies only to postflop graded examples (`view.street !== 'preflop'`). | yes | The four preflop examples have no hero step in `before`. | Apply it to every example. Today that gives the same result. |
| A-2 | "Like-for-like" means id, seats, street, user action, grade, rule id and margin stay exactly the same. Swap hole cards first, then change the line. | yes | Exact-margin replacements exist for all three examples. | Accept a nearby margin. |
| A-3 | The gutshot example takes a line change, not a card swap. The button limps, the small blind folds, the big blind (hero) checks its option and checks the flop, and the button bets. Hero holds Kd 4h. | yes | No card swap on the old line gives a gutshot hand the chart allows. Kd 4h is a real gutshot at exactly 4.6. | Keep the old line with Kd Td and rename the id. |
| A-4 | Failure text: `Graded example <id>: hero preflop step <k> "<action>" is a Major error on the chart (...)`. | yes | It reuses the TASK-7.31 helper output with the existing graded-example prefix. | Other wording. |
| A-5 | The gutshot justification is rewritten. The other two name their new kicker. Every claim is checked against the evaluator output in the build log. | yes | The old gutshot text is false for K4o. | Rewrite all three. |

Also decided: the cross-story edit to the locked file `graded-examples.json` (owner TASK-7.14) was auto-accepted as recommended. No questions were asked.

## What was built
- `src/advice/golden.ts`: `parseExample` runs `heroPreflopProblems` for postflop examples and reports each Major hero preflop step. The unreachable `break` became a narrowing cast to the `ApplyResult` success branch. The doc comment now reads "spot or graded example" and was rewrapped to 120 columns.
- `tests/golden/graded-examples.json`: three examples re-authored. Gutshot is Kd 4h on a limped line. Top pair is Kh 7h, and its justification names the seven kicker. The seven does not play on that board, so the builder corrected the justification. Trips is Ah 3c with the ace kicker.
- `tests/golden/graded-lines.acceptance.test.ts`: new acceptance tests SPEC-01 to SPEC-04.
- `docs/advice/golden-spots.md`: the rule, its failure text, and a "Changes from TASK-7.36" table.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 to SPEC-04 | Rule, failure text, the three re-authored examples | `tests/golden/graded-lines.acceptance.test.ts` | PASS | judge/round-1.json |
| SPEC-05 | Justification facts | Fact-check table against the evaluator | PASS | build-log.md |
| SPEC-06 | Docs and cleanup | Judge review | PASS | judge/verdict-1.json |

Judge round 1: PASS (6/6), test suite and end-to-end PASS. Gate runs: 2 (build, fix).

## Review
One review round (code and security). There were no blocking findings.

### Non-blocking review notes
- NIT: the widened doc comment in `golden.ts` ran past 120 columns (judge J-1-01). The orchestrator rewrapped it.

## How to try it
Run `npm test -- tests/golden`. To see the rule fire, change a postflop example's line to a Major preflop error and run the validator.

## Run metrics
Questions 0 · assumptions logged 5 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · sendbacks 0.

## Known limitations and follow-ups
- None identified in the artifacts.

## Lessons for the factory (proposals — not applied)
- None. The run was clean. The only slip was a lint-invisible long comment line, since Prettier does not rewrap comments.
