# TASK-10.13: Decide how a forced fold of the top bettor is settled (dead money vs refund)

Status: Judge PASS (not yet Done) · Completed: 2026-11-26 · Epic: TASK-10 — Read the session report · Milestone: m-1 · Requirements: REQ-004 (004.7, 004.8), REQ-018 (018.4, 018.5) · Branch: doit/TASK-10.13

## What was asked
Follow-up from TASK-10.2. When Leave table force-folds the user while they hold the top bet, the engine kept that bet as the amount to match, so bots still had to call it. If one seat remained, the uncalled part was refunded to the leaver. The task asked for a decision (forfeit vs keep), the engine and invariant changes to follow it, a property test for several forced folds in one hand (J-1-02), and a non-timing-dependent bot-freeze e2e check. Spec: doit/TASK-10.13/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | When a void lowers the amount to match, live seats' `hasActed` is recomputed from street history (acted = a non-blind record at/after the last surviving counted bet). A limper is not asked again after the raise over it is voided. | yes | Plays the street as if the voided bet was never made. | Leave `hasActed` as is (limper gets one extra turn). |
| A-2 | Bots and advice read history as is. `situationOf` (`src/advice/preflop.ts:104-118`) still counts a voided raise, so a bot may use its "facing a raise" cell while only the BB is to call. All bot actions stay legal. | yes | The user has left; advice is out of scope. | Filter voided records in `situationOf` (follow-up below). |
| A-3 | An all-in call below a voided raise stays a call; bet levels come only from `bet`/`raise` records. | yes | Existing level rule (REQ-016.5). | Treat a big enough all-in as a raise. |
| A-4 | J-1-02 is fixed in the checker: a fold-out winner who put in $0 is valid when it is the only seat with cards (wins dead blinds). `forceFold` does not throw. | yes | The break comes from an ordinary fold after the forced folds, so a throw would not prevent it. | Make `forceFold` throw. |
| A-5 | Checker uncalled-bet rule (C5) and pot-structure matching use the last betting street's records, not hand totals. | yes | Dead money on an earlier street breaks the totals shortcut. | Keep totals and subtract dead money per street. |
| A-6 | New tests live in new files; locked `force-fold.acceptance.test.ts` unchanged. | yes | It needs no change. | Unlock and extend it. |
| A-7 | No record/stats change. With no `result.returned`, `netResult` gives the user minus all chips put in; the forced fold is still never graded. | yes | The record stores engine results as is. | — |
| A-8 | The worker-traffic counter for the e2e is an init script inside `e2e/leave-mid-hand.spec.ts`. | yes | Keeps the locked edit in one file. | Move it to `e2e/support/paused-clock.ts`. |

## Clarifications and decisions
- Q-1: Settlement of a forced fold of the top bettor. Answer (a): forfeit. Chips stay in the pot as dead money, and the amount to match drops to the highest live bet.
- Q-2: Preflop floor. Answer yes: the amount to match stays at least one big blind (dead big blind).
- Q-3: Reword REQ-004.8 and REQ-018.4 with changelog row 1.15. Answer yes.
- Q-4: Locked edit of `e2e/leave-mid-hand.spec.ts` (owner TASK-10.2). Answer yes, no assertion loosened.
- The orchestrator records Q-1..Q-4 in the task's implementation notes at finish (AC#1, CLI step). Judge J-1-01 (LOW) noted this was not yet present at judging time.

## What was built
- `src/engine/hand.ts`: private `liveLevels` (void-aware street bet levels) behind `fullBetLevel`. `gather` no longer returns chips to a folded top seat. `forceFold` voids a strict top bet down to the live top (preflop at least the BB). It lowers `currentBet` and `betCount` and recomputes `hasActed` and `toAct`.
- `src/engine/invariants.ts`: void-aware `countedBets`. New `uncalled` (per street, live top seat only) feeds C5 and the pot-structure check, with no dead-money cap. P5 allows a $0 sole survivor of a fold-out.
- Tests: `tests/engine/force-fold-top-bet.acceptance.test.ts` (worked examples E1-E7 and 500 seeded normal hands) and `tests/engine/force-fold.property.test.ts` (2,000 hands, several forced folds each, in the normal suite).
- `e2e/leave-mid-hand.spec.ts`: worker-traffic init script. The bot-freeze check now waits for every worker reply and advances the clock again before asserting.
- Docs: `docs/ui/navigation.md` (decision bullet and Tests list), `dreams/limit-holdem-trainer/requirements.md` (REQ-004.8, REQ-018.4, row 1.15).
- No API changes (`applyAction`, `createHand`, `PlayerView`, record format). Normal play output is byte-identical. No new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01 | AC#1 docs | grep of navigation.md and requirements.md | PASS | Bullet and rows match the spec. Notes entry is the orchestrator's finish step. |
| SPEC-02..06 | AC#2 | acceptance tests plus built-app run | PASS | In the app, a user raise to $8 over the BB left seat 6 facing $4, the BB won $14, nothing was returned, and the report Result was -$8. A 3-bet to $12 over $8 left seat 6 calling $8. |
| SPEC-07 | AC#3 | property test | PASS | `checkState` holds across 2,000 hands. |
| SPEC-08 | AC#4 | `leave-mid-hand.spec.ts --repeat-each 5` | PASS | 40/40 across chromium and webkit. |
| SPEC-09 | Suite and gates | `npm test`, lint, typecheck | PASS | 1503 tests passed, 56 skipped. Engine coverage 99.48% lines. |

Gates: 4 runs (build x3, fix x1), all PASS. Judge round 1: PASS, with test-integrity PASS. The new tests fail 5/6 against the base engine (the 6th is a regression guard).

## Review
Round 1 (code and security): no blocking findings.

### Non-blocking review notes (deliberately not fixed)
- MINOR `src/engine/hand.ts:791`: redundant `toAct` ternary. `clockwiseAfter(open, toAct === seat ? seat : toAct - 1)` could be `toAct - 1` with a comment.
- NIT `src/engine/invariants.ts:292`: compute `sole` once.
- NIT: spec R2 wording differs from the implementation (no change).

## How to try it
`npm test`; `npx playwright test e2e/leave-mid-hand.spec.ts --repeat-each 5`; `npm run dev`, raise preflop, then Leave table and Confirm, and read the Session report.

## Run metrics
Questions 4 (all answered) · assumptions logged 8 · review rounds 1 · judge rounds 1 · gate runs 4 · escalations 0 · sendbacks 0 · changed lines 559 across 7 files.

## Known limitations and follow-ups
- [trainer] Filter voided raises out of `situationOf` (`src/advice/preflop.ts:104-118`), so bots and advice do not use the "facing a raise" cell after a forced fold voids the raise (A-2). Owner: none known.
- [trainer] Tidy the MINOR/NIT items above (`hand.ts:791`, `invariants.ts:292`). Low value, so bundle with the next engine task.
- Remaining TASK-10.2 NITs (`|| leaving`, `userMade` placement) stay open.

## Lessons for the factory (proposals — not applied)
None. The run went through with no send-backs.
