---
id: doc-10
title: 'TASK-1.4: Play a complete fixed-limit hand from blinds to showdown'
type: other
created_date: '2026-11-18T05:03:00Z'
updated_date: '2026-11-18T05:03:00Z'
---
# TASK-1.4: Play a complete fixed-limit hand from blinds to showdown

Status: Done (judge result pending, appended by the orchestrator) · Completed: 2026-11-17 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-0 · Requirements: REQ-014.1–014.5, REQ-016.1, REQ-019.3 · Branch: doit/TASK-1.4

## What was asked
Build the core hand engine as pure functions: start a fixed-limit Hold'em hand for 3–10 seats from a given deck order, list the exact legal actions for the seat to act, and apply an action to get the next state. A hand runs from the blinds through preflop, flop, turn and river betting to showdown or a fold-out, with pot award and odd-chip splitting (AC#1–AC#8). Later stories build on this API (PlayerView, playtest CLI, invariants, all-in, side pots, cap, bots, UI). Spec: doit/TASK-1.4/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | One module `src/engine/hand.ts`; tests in `tests/engine/hand.{acceptance,property}.test.ts` and `hand.test.ts` | yes | Same layout as TASK-1.2/1.3 | Split types/pot award into separate files |
| A-2 | Seats numbered 1–10; clockwise = increasing seat, wrapping. `players` lists only dealt-in seats ascending; seats need not be contiguous | yes | Matches the ACs; needed later for busted seats | Use 0-based indices or a fixed 10-slot array |
| A-3 | Withdrawn (no burn cards), replaced by D-5 / Q-3 | n/a | n/a | n/a |
| A-4 | Deck injected via `HandConfig.deck` (52 distinct cards); engine does not store the replay code | yes | One code path; tests script their own deck | Accept `{ replayCode }` in config |
| A-5 | `createHand` throws `RangeError` for invalid config; only `applyAction` returns typed errors | yes | Same style as `cards.ts`/`deck.ts`; bad config is a bug | Typed result for config too |
| A-6 | Immutability by contract (readonly types, new state per action), no `Object.freeze` | yes | Freezing costs time in 100,000-hand runs; a unit test proves inputs are untouched | Deep-freeze in dev builds |
| A-7 | `createHand` rejects any stack below `8 × smallBet + 8 × bigBet` ($96 at $4/$8) | yes (TASK-1.9 lifts it) | No all-in support yet; a short stack could face a call it cannot pay | Allow short stacks |
| A-8 | `legalActions` omits a call/bet/raise costing more than the stack | yes | Keeps stacks non-negative without cap or all-in logic | Allow negative stacks |
| A-9 | Fewer than 3 or more than 10 seats throws `RangeError` | yes | Heads-up is TASK-1.11 | Allow 2 seats |
| A-10 | The action that closes a betting round also deals the next street or resolves showdown in the same `applyAction` call | yes | Caller loop is just legalActions → applyAction | Explicit `advance(state)` step |
| A-11 | AC#8 seeds everything from one `new Xoshiro128(20261117)`; the policy drops bet/raise when `betCount >= 4` | yes | Deterministic and reproducible; no cap enforcement needed | Per-seat generators |
| A-12 | Every remaining player's hand is listed in `result.showdown`, clockwise from left of the button | yes | Showdown order and mucking are TASK-1.15 | Order by rank |
| A-13 | At hand completion `pots[0].amount` is reset to 0 and the payout is recorded in `result.awards` | yes | Needed so stacks sum to the starting total at completion; SPEC-09's $27 is checked via the award | Keep the pot and derive stacks separately |
| A-14 | SPEC-18's "burned cards never in result" is checked by confirming no burned card is on the board or in any shown hole cards and that the result has no burn field | yes | Cards are plain integers, so a JSON text search is meaningless | Add a stricter structural check |

## Clarifications and decisions
- Q-1 (engine public API, D-1): user approved `createHand` / `legalActions` / `applyAction` with `HandConfig`, `HandState` (players[], pots[], betCount, toAct, actions[], result), the `Action` shapes and automatic street advance.
- Q-2 (illegal actions, D-2): user chose a typed result. `applyAction` returns `{ok:true,state}` or `{ok:false,error:{code,message}}` with codes `hand-complete`, `out-of-turn`, `illegal-action`; state is unchanged on error.
- Q-3 (burn cards, D-5; raised by the orchestrator): user chose casino burns. One card is burned before the flop, turn and river. With n players, hole cards are deck positions 1..2n, then burn 2n+1, flop 2n+2..2n+4, burn 2n+5, turn 2n+6, burn 2n+7, river 2n+8. Burned cards are stored in `HandState.burned` and never appear in `board` or `result`.
- D-3: odd units of a split pot go one each to tied winners clockwise from the left of the button (REQ-019.3/019.9).
- D-4: AC#7 runs through the engine at $3/$6 ($1/$3 blinds), because at $4/$8 every amount is even and a $27 pot cannot occur. `splitPot` also has its own unit test.

## What was built
- `src/engine/hand.ts` (new): types `Stakes`, `HandConfig`, `HandState`, `PlayerState`, `Pot`, `Action`, `ActionRecord`, `HandResult`, `ApplyResult`. Functions `createHand`, `legalActions`, `applyAction`, `splitPot`. It covers blinds, deal order, casino burns, action order, fixed bet/raise sizes, round end, fold-out, showdown through `evaluate`, and the odd-chip split.
- `tests/engine/hand.acceptance.test.ts` (locked): AC#1–AC#7 and the burn-card test.
- `tests/engine/hand.property.test.ts` (locked): AC#4 bet-size property over 2,000 hands; AC#8 100,000 seeded random hands.
- `tests/engine/hand.test.ts`: BB option and reopening, `splitPot`, illegal actions, config validation including the stakes relationships, and purity.
- No new dependencies. Imports only `./cards` (type) and `./hand-evaluator`.
- Stakes rule added in review: `smallBlind <= bigBlind <= smallBet < bigBet`, otherwise `RangeError('Invalid stakes')`.

Usage: `const s = createHand({stakes, seats, button, deck: shuffledDeck(code)})`, then loop `legalActions(s)` and `applyAction(s, action)` until `s.toAct === null`; `s.result` holds awards.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..04, 06, 08, 09, 18 | AC#1–AC#7, burns | acceptance tests in hand.acceptance.test.ts | pass | gates/fix-2.json |
| SPEC-05, 11 | AC#4, AC#8 | property tests (2,000 hands; 100,000 hands with legal end states) | pass | gates/fix-2.json |
| SPEC-07, 10, 12, 13, 14 | BB option, odd-chip split, typed errors, config validation, purity | unit tests in hand.test.ts | pass | gates/fix-2.json |
| SPEC-15 | DoD lint/typecheck/test/no-forbidden-API grep | npm run lint, typecheck, test, grep | pass | gates/fix-2.json |
| SPEC-16 | CI on branch | `gh run list` | not run in this pipeline; no evidence in the artifacts | n/a |
| SPEC-17 | diff scope and docs | manual check | this document and the backlog doc | n/a |

- `npm test`: 24 files, 74 tests passed; `hand.ts` 100% line coverage. The gate passed at build and after the fix (gate runs 2; changed lines 1,254 over 4 files).
- Judge rounds: pending (the judge runs after this document).

## Review
Round 1 found one MAJOR (security): `src/engine/hand.ts:stakes-relationships-unvalidated`. `validate()` checked each stake alone, so blinds could exceed a stack. Stacks then went negative (for example stakes {500,1000,1,1}, stacks 16 gave [16,-484,-984]). With smallBlind > bigBlind (stakes {8,4,4,8}) a check/call loop never closed the round. Fixed in round 1 by requiring `smallBlind <= bigBlind <= smallBet < bigBet`, with a SPEC-13 test per rule and a valid $1/$3 blinds at $3/$6 case. Round 2 was clean: the code review passed all rubric items. The security review reran the reproductions (all now throw) and fuzzed 12,000 boundary-stake hands (3,000 each for {1,1,1,2}, {1,1,4,5}, {3,3,3,4}, {2,4,4,8}). Every hand completed, no stack went negative and chips were conserved.

### Non-blocking review notes (deliberately not fixed)
- MINOR (security) `unsafe-integer-amounts`: `Number.isInteger` accepts values above `MAX_SAFE_INTEGER`; a stack of 2**60 posts a blind without decreasing. Use `Number.isSafeInteger`. No external path today.
- MINOR (security) `stakes-object-aliased`: `createHand` stores the caller's `stakes` object by reference, so later mutation bypasses validation. Fix: `stakes: { ...config.stakes }`.
- MINOR (code) `fold-eligible-and-total-contribution-untested`: no test asserts that a fold removes the seat from pot eligibility or that `totalContribution` tracks chips.
- MINOR (code) `sb-equals-bb-boundary-untested`: the rule allows smallBlind == bigBlind, but no test accepts it, so `>` changing to `>=` would go unnoticed.
- NIT `fold-out-resets-bet-counters`, NIT `single-use-isPositiveInteger` (round 1), NIT `uneven-blinds-assert-splits-minimum-check` (round 2, test lines in an awkward order).

## How to try it
`npm test -- tests/engine/hand` for the engine tests; `npm run lint && npm run typecheck && npm test` for the full gate.

## Run metrics
Questions asked: 3 · assumptions logged: 14 (A-3 withdrawn) · review rounds: 2 · judge rounds: pending · gate runs: 2 · escalations: 0 · send-backs: 0 · changed lines: 1,254 (4 files; spec budget 1,250 lines).

## Known limitations and follow-ups
Follow-ups are noted only, none created.
- Cap enforcement is deferred to TASK-1.12. Until then `legalActions` still offers a raise after the 4th bet, so callers must filter on `betCount` (as the AC#8 policy does).
- Spec §5's wording of "Invalid stakes" is outdated, because the validation now also covers stakes relationships.
- Two security MINORs (safe integers, stakes aliasing) are worth a small hardening task.
- Two test-gap MINORs (fold eligibility/totalContribution, SB == BB boundary).
- Out of scope, as specced: all-in and short stacks (1.9), side pots (1.10), heads-up (1.11), showdown order and mucking (1.15), button movement (1.16), detailed illegal-action codes (1.13), PlayerView (1.5).

## Lessons for the factory (proposals — not applied)
- The spec's config-validation section covered each field alone but not relationships between fields. A spec-template prompt such as "which inputs must be consistent with each other?" would have caught the one MAJOR finding before build.
- Q-3 (burn cards) surfaced after spec drafting and replaced A-3. Asking about dealing procedure details when a spec fixes a card order would avoid the rewrite.
