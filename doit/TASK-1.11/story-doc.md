# TASK-1.11: Play heads-up hands with heads-up blinds and order

Status: Done · Completed: 2026-11-20 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-015.1, REQ-015.2, REQ-015.3, REQ-062.1 · Branch: doit/TASK-1.11

## What was asked
The engine must play hands with exactly two players by heads-up rules. The button posts the small blind and the other player posts the big blind. The button acts first preflop, and the non-button player acts first on the flop, turn and river. `npm run playtest -- --size 2` must play 10,000 seeded hands with zero invariant violations. Spec: doit/TASK-1.11/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | CLI text changes only in the range: `Error: --size must be a whole number from 2 to 10.` and `[--size <2-10>]` | yes | Same wording with the new lower bound | Edit `SIZE_ERROR` and `USAGE` in `src/playtest/cli.ts` |
| A-2 | Engine error for a bad seat count is `Hand needs 2 to 10 seats, got <n>` | yes | Keeps the existing message pattern | Edit `validate` in `src/engine/hand.ts` |
| A-3 | `--size 2` uses the same $4/$8 stakes, $160 reset stacks and alternating button as other sizes | yes | Reuses `runPlaytest` unchanged | Add heads-up-specific values in `runner.ts` |

Design decisions without a question (no user approval needed): D-1 only the blind seats change for 2 seats. D-2 deal order is unchanged. D-3 the odd dollar goes to the non-button seat, as at other sizes. D-4 no new invariant id; position order is proved by tests.

## Clarifications and decisions
No questions were asked (autopilot run).

## What was built
- `src/engine/hand.ts`: `validate` accepts 2..10 seats. `createHand` sets `sb = button` and `bb = the other seat` when there are 2 seats. The first-actor rule (`clockwiseAfter(seats, bb)[0]`) already picks the button, and postflop order already starts with the non-button seat, so no other change was needed. The 3..10-seat path is untouched.
- `src/playtest/cli.ts`: `--size` range 2..10 in `parseArgs`, `SIZE_ERROR` and `USAGE`.
- Tests: new `tests/engine/heads-up.acceptance.test.ts` and `tests/playtest/heads-up.acceptance.test.ts`. Updated `tests/engine/hand.test.ts` and `tests/playtest/cli.test.ts` for the new range and message.
- No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04 | AC#1-3 | engine acceptance tests (blinds, preflop order, postflop order, deal and showdown) | PASS | judge round 1 |
| SPEC-05, 06 | AC#4, AC#5 | 10,000-hand `--size 2` hand-walk plus subprocess `npm run playtest` | PASS | judge round 1 |
| SPEC-07..09 | AC#1, 2, 4, 5 | unit tests (seat range, fold-out returns uncalled $2, CLI range) | PASS | judge round 1 |
| SPEC-10 | DoD#6 | 6-max baseline byte-identical | PASS | judge round 1 |
| SPEC-11 | DoD checks | lint, typecheck, `npm test`; branch CI run 44869653305 (#109) on 8c1dbfb | PASS | CI success, Visual green; judge round 2 |
| SPEC-12 | DoD#11 | this document | PASS (doc published) | doc-57 |

- Gate: 114 test files, 402 passed and 6 skipped. Overall coverage 96.72%, engine 99.85%. Lint and typecheck pass. The scope-budget check warned (346 changed lines against 280; the limit for failure is 560).
- Judge round 1: 10 of 12 items PASS; SPEC-11 and SPEC-12 were open. Round 2 (J-2-01): SPEC-11 PASS on CI, SPEC-12 PASS on publication, and this result block was added.
- Observed `npm run playtest -- --size 2`: `Table: 2 players, cash $4/$8, every stack reset to $160 before each hand`, `Hands played: 10000`, `Ended by fold: 8940`, `Ended at showdown: 1060`, `Invariant violations: 0`.

## Review
No blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR: the SPEC-09 CLI test repeats checks already in the `ERROR_CASES` table (test tidiness only).
- NIT: a code comment cites "(D-1)", which is optional.

## How to try it
- `npm run playtest -- --size 2`
- `npm run playtest -- --replay-code <first replay code> --size 2 --button 1`
- `npm run playtest -- --hands 10000 --seed 42` (6-max baseline, unchanged)
- `npm test`

## Run metrics
Questions 0 · assumptions logged 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 346 (budget 280).

## Known limitations and follow-ups
- [trainer] `src/table/table-view.ts:92` `positionName` labels the heads-up non-button seat "Small blind", but the engine now makes it the big blind. Fix the label for 2 seats. Owner: TASK-2.2 (choose how many players sit at the table).
- Heads-up raises have no special cap; the generic cap applies. Owner: TASK-1.12.
- Out of scope per spec: table-size choice in the app (TASK-2.2), mid-session heads-up and all-in blinds (TASK-1.16), heads-up bot or chart.

## Lessons for the factory (proposals — not applied)
- The scope budget (280 lines) was too low for a story with four test files. Tests for new behaviour should be counted separately, or the budget raised when the spec lists several new test files.
