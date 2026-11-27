# TASK-10.18: Keep the engine's bet-voiding rule in one place (liveLevels and voidedBets)

Status: Done (pending orchestrator) · Completed: 2026-11-27 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: n/a (follow-up of TASK-10.17, doc-184) · Branch: doit/TASK-10.18

## What was asked
`liveLevels` and `voidedBets` in `src/engine/hand.ts` each carried their own copy of the forced-fold voiding walk, so a later rule change could make bots and advice disagree with the engine's amount to match. AC#1: share one walk (or add a property test that they agree), with all engine/advice tests passing and the 10,000-hand seeded playtest byte-identical. Spec: doit/TASK-10.18/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Share one single-pass walk returning `{ levels, voided }`, rather than having `liveLevels` skip `voidedBets` indices. | yes | One pass is identical by construction. The skip-indices variant needs a second pass and only matches by fuzz evidence. | Split the walk again, or compose via skip-indices. |
| A-2 | Keep `liveLevels` and `voidedBets` as named wrappers; do not inline the walk at call sites. | yes | Keeps the diff small and call sites unchanged. | Replace calls with `voidingWalk(state).levels`. |
| A-3 | Also add a property test, although the AC's "or" made it optional. | yes | About 25 lines; guards the public contract against a future split. | Delete the test case. |

No questions were asked (qa.md: no ask items).

## What was built
- `src/engine/hand.ts`: new private `voidingWalk(state)` is the only `state.actions` walk with the forced-fold voiding rule. In the voiding branch it both pops levels above `live` and marks earlier same-street bet/raise indices with `amount > live`. `liveLevels` returns `.levels` (still private); `voidedBets` returns `.voided` (exported, signature unchanged). The rule is described once, on the walk.
- `tests/engine/force-fold.property.test.ts`: `playOut` takes an optional `afterForceFold` hook (no change to its random draws). New case "voidedBets agrees with the engine's amount to match after every forced fold" (seed 0x10d18, 2000 hands).
- No engine behaviour change, no new dependencies. `src/advice` and the lint allow-list are untouched.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | one walk owns the rule | grep + code reading | PASS | `grep -c "c > live) live = c" src/engine/hand.ts` prints 1; both functions delegate. Judge differential vs base: 7,500 random hands, 21,689 forced folds, 0 mismatches. |
| SPEC-02 | voidedBets agrees with engine after every forced fold | property test | PASS | Checks both directions plus a non-vacuity guard. Mutations (raised threshold; removed `voided.add`) make it fail. |
| SPEC-03 | engine, advice, playtest unchanged | `npm test`; playtest `cmp` vs base 46e6e83 | PASS | 10,000-hand seed-42 playtest identical (1130 bytes). Locked tests (`voided-bets.test.ts`, `preflop-voided-raise.acceptance.test.ts`) unedited. |

- `npm test`: 345 files passed, 11 skipped, 1534 tests passed. Lint and typecheck clean. Gates: build run 1 PASS, fix run 2 PASS.
- Judge: round 1, PASS on 3 of 3 items, no sendbacks.

## Review
Round 1: code and security reviews found no BLOCKER or MAJOR issues. Security: no findings.

### Non-blocking review notes (deliberately not fixed)
- NIT (code): in the property test, `voids += voided.size` adds the whole set at every forced fold, so a voided bet is counted more than once. The `voids > 0` guard still works. It could be renamed `voidedSeen`, but no change is needed.
- Gate warn: 110 changed lines against a budget of 90 (mostly prettier-wrapped test code). Reviewer accepted it.

## How to try it
- `npx vitest run tests/engine/force-fold.property.test.ts tests/engine/voided-bets.test.ts`
- `npm test`
- `npm run -s playtest -- --hands 10000 --seed 42`, then `cmp` the output with the same command run at 46e6e83.

## Run metrics
Questions 0 · assumptions 3 · review rounds 1 · judge rounds 1 · gate runs 2 · escalations 0 · changed lines 110 (2 files).

## Known limitations and follow-ups
- None from this story. Out of scope and unchanged: TASK-10.17 A-3 (a short all-in call after a voided raise still reads as a limper).
- Unrelated: TASK-1.57 (e2e flake fix) was created by the orchestrator on this branch and is not part of this story.

## Lessons for the factory (proposals — not applied)
- The spec's line budget (90) was too low for a refactor plus a property test (110). Estimate test lines when setting the budget. The gate only warned, so nothing was lost.
