---
id: doc-62
title: 'TASK-1.15: Show and muck cards at showdown in casino order'
type: other
created_date: '2026-11-21T08:25:00Z'
updated_date: '2026-11-21T08:35:00Z'
---
# TASK-1.15: Show and muck cards at showdown in casino order

Status: Done · Completed: 2026-11-21 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-019.4, REQ-019.5, REQ-019.6, REQ-019.8, REQ-025.1 · Branch: doit/TASK-1.15

## What was asked
At showdown, hands are revealed in casino order: the last river bettor/raiser shows first (else the first active seat left of the button). Each later hand is shown only if it beats or ties the best face-up hand, otherwise it is mucked. With side pots, the last side pot is settled first and the main pot last, so a hand that wins a side pot is never lost by mucking in the main pot. Mucked cards disappear from `HandResult.showdown`, `showdownOf` and all later `PlayerView`s. The hand result lists shown losing hands after the winners. Awards are unchanged. Spec: doit/TASK-1.15/spec.md.

## Answers auto-accepted for your review (autopilot)
| ID | Question | Answer taken | To change |
|---|---|---|---|
| Q-1 | The user's own hand at showdown | Same rule as bots: auto-show if it beats or ties, else auto-muck. Own cards stay face up at your seat; a shown hand reads "You show · <hand>". No Show/Muck control. | New story for a Show/Muck prompt |
| Q-2 | Table every hand when a player is all-in (TDA Rule 16)? | No. All-in hands follow the same pot-by-pot show/muck rule. | Show every live hand once an all-in runout starts |
| Q-3 | Display of shown losing hands | Second list "Shown hands" after Winners in "Hand over". Lines "Dee shows · Pair of fours" / "You show · Pair of eights", two 30x42 cards, muted #A7AEB8, regular weight, `<li data-shown-seat>` | Winner-style bold, hand name only, or no UI |
| Q-4 | Edits to four locked tests that assumed every hand is shown | Approved: E1 `tests/engine/hand.acceptance.test.ts:454` `[2,5]`→`[2]`; E2 `tests/engine/hand.property.test.ts:73-74` "all active seats shown" → exact computed show list; E3 `tests/engine/side-pots.acceptance.test.ts:151` `[1,3,4]`→`[3]`; E4 `tests/ui/user-shown-cards.acceptance.test.tsx:45` `[1,2,3,5]`→`[1,2,3]` + comment. Plus unlocked U1 (`tests/table/hand-result.test.ts`, adds `shown: []`). Nothing loosened; E2/E3 got stricter (reviewer confirmed). | Revert the edits and the rule together |

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | "Last to bet or raise on the river" = last river `bet`/`raise` record, counted or not. A short all-in raise (under half a bet, TASK-1.14) also makes its seat show first. | yes (one predicate) | The record is labelled "raise" for the user; REQ-019.4 has no exception. | Count only full bets/raises |
| A-2 | "Resolved and awarded first" = settle order (last side pot to main). The `awards` array keeps ascending pot order. | yes | Reversing it would change playtest `Result:` lines and many locked assertions. | Emit `awards` in settle order |
| A-3 | A pot only one seat is eligible for is awarded without a show. | yes | Casino practice; no rule requires showing. | Treat the lone seat as first shower |
| A-4 | `HandResult.showdown` and the shown list use seat order starting at the first shower, mucked seats left out (not pot-settle order). | yes | Stable and readable; keeps locked `all-in.acceptance.test.ts:146` `[2, 3, 1]`. | List in settle order |
| A-5 | A hand mucked in one pot is dead for lower pots. It never costs a pot because eligibility is nested and a face-up hand that beat it is eligible for every lower pot. | yes | Real-table rule; equivalent outcome. | Re-decide each pot independently |

## What was built
- `src/engine/hand.ts`: private `showdownOrder` (rotate to last river bet/raise, else left of button, including no-river-betting runouts) and `revealShown` (settles last side pot to main, show if tie/beat, mucks stay dead, lone-seat pots skipped). `endRound` awards each pot among shown eligible hands. `HandResult.showdown` now holds only shown hands.
- `src/engine/player-view.ts`: `showdownOf` doc comment only (it copies `result.showdown`, so mucked hands vanish from later views).
- `src/table/hand-result.ts`: `ShownHandView` and `HandResultView.shown` (shown seats with no award share, in showdown order).
- `src/ui/table/Table.tsx`, `src/ui/styles.css`: "Shown hands" list per Q-3.
- Tests: `tests/engine/showdown-order.acceptance.test.ts`, `showdown-order.test.ts`, `showdown-order.property.test.ts` (5,000 seeded random all-in hands), `tests/ui/hand-result-shown.acceptance.test.tsx`, `e2e/showdown-shown.spec.ts`; support: `tests/support/table-scenarios.ts` (`SHOWN_HANDS`), `e2e/support/table-scenes.tsx`.
- Outside the spec's file list: `e2e/support/table-harness-bundle.ts` (one type line for the new scene).
- No configuration; no new dependencies.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | Order, show/tie/muck, side-pot settle, showdownOf, hidden cards | `showdown-order.acceptance.test.ts` (W1-W5) | pass | gates/fix-2.json |
| SPEC-08 | Result lists shown losers, never mucked | UI acceptance test | pass | gates/fix-2.json |
| SPEC-09..11 | Short all-in first, lone-seat pot, no-river runout | `showdown-order.test.ts` (W6-W8) | pass | gates/fix-2.json |
| SPEC-12 | Random all-in hands | property test, 5,000 hands | pass | gates/fix-2.json |
| SPEC-13 | Locked tests change only as approved | E1-E4 diff check, "test integrity" gate | pass | gates/fix-2.json, reviews/round-1/code.json |
| SPEC-14 | UI in Chromium and WebKit, fits, axe clean | `e2e/showdown-shown.spec.ts` | pass (code reviewer ran both browsers) | reviews/round-1/code.json |
| SPEC-15 | Checks pass, playtest byte-identical | `npm test`, lint, typecheck; `playtest --hands 10000 --seed 42 --size 6` vs base | pass | gates/fix-2.json; code review |
| SPEC-16 | Story doc and N/A DoD items | this doc, `backlog doc` | see below | |

- Gates (fix-2): test, lint, typecheck, spec unchanged, test integrity and listed-changes all pass. Warns: 18 files vs budget 17; file outside spec list (`table-harness-bundle.ts`). 714 changed lines vs budget 850.
- N/A DoD items: DoD#3 (golden-spot suite not yet created), DoD#9 (no strategy content), DoD#12 (service worker doesn't exist yet).
- Judge round 1: PASS 16/16 (8,000-hand oracle, 8/8 mutants caught, no mucked-card leaks). See doit/TASK-1.15/judge/.

### Side-pot walk-through (spec W4/W5)
Both: button 2, seat 3 all-in for $8; main pot $28 (eligible 1, 3, 5), side pot $8 (eligible 1, 5). Order is 3, 5, 1. The side pot is settled first.
- W4 (seat 3 QQ, seat 5 KK, seat 1 AA): side pot: 5 shows, 1 shows (AA beats KK); seat 1 wins $8. Main pot: 3's QQ loses to the AA already face up, so it mucks; seat 1 wins $28. Showdown `[5,1]`; stacks 1:184, 3:0, 5:148.
- W5 (seat 3 AA, seat 5 KK, seat 1 QQ): side pot: 5 shows, 1's QQ mucks; seat 5 wins $8. Main pot: 3's AA beats the KK face up, so it shows; seat 3 wins $28. Showdown `[3,5]`; stacks 1:148, 3:28, 5:156. Settling the main pot first would have mucked 5 behind seat 3's aces and lost 5 the side pot.

## Review
Round 1: 0 blocking findings. The code reviewer ran a 200,000-hand differential fuzz of the base engine against the new one (2-10 seats, short stacks; 178k showdowns, 70k multi-pot, 139k with mucks). Awards, returns, pots and final stacks were identical in every hand, so mucking never changes who wins, and each new showdown entry equals the old one (a pure subset). It also killed 6 mutants: main-first settle, bet-only aggressor, any-street aggressor, uncounted short raise excluded, showing lone-seat pots, strict `>` instead of `>=`. Security found no leakage paths and no injection (mucked seats never reach `result.showdown`; React auto-escapes names and hand labels).

### Non-blocking review notes (deliberately not fixed)
- NIT `tests/engine/showdown-order.acceptance.test.ts:117`: SPEC-04's "no other field carries seat 1's cards" is checked field by field, not over the whole view. Optional: assert the serialized view lacks the mucked cards.
- NIT `src/engine/hand.ts:487`: the `mucked` set is an equivalent mutant (no outcome change; it states A-5 directly). Keep.

## How to try it
- `npm test`, `npm run lint`, `npm run typecheck`
- `npx playwright test e2e/showdown-shown.spec.ts`
- `npm run playtest -- --hands 10000 --seed 42 --size 6` (output must match the base commit's)

## Run metrics
Questions 4 (auto-accepted) · assumptions 5 · review rounds 1 · judge rounds pending · gate runs 2 · escalations 0 · changed lines 714 (18 files).

## Known limitations and follow-ups
- The user cannot choose Show or Muck (Q-1). Follow-up: [trainer] add a Show/Muck prompt for the user's hand. No existing task covers it (backlog search found none); new story if wanted.
- Opponents' shown cards in the review are TASK-9.5 (already exists, consumes `showdownOf`/shown data).
- Not tracked (infra, below the value bar): file-count budget warn (18 vs 17) and the one file outside the spec list.

## Lessons for the factory (proposals — not applied)
- The spec's file list missed `e2e/support/table-harness-bundle.ts`, which a new e2e scene always touches. Proposal: have the spec template list the harness bundle whenever a scene is added.
