---
id: TASK-1.4
title: Play a complete fixed-limit hand from blinds to showdown
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.3
  - TASK-1.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each hand to follow the casino fixed-limit sequence from blinds to showdown, so that my practice matches a real casino table.

Pure, seeded engine for 3-10 players (heads-up is E01-S09). Sequence: post blinds, deal two hole cards each, preflop betting, flop (3 cards) and betting, turn (1) and betting, river (1) and betting, showdown; ends early when all but one fold. Small blind = player left of button, big blind = next player. Preflop action starts left of the big blind; later streets start with the first active player left of the button. Bets/raises are one small bet preflop and flop, one big bet turn and river. At $4/$8 blinds are $2/$4. Pot goes to the best hand; tied pots split equally, an odd dollar to the first tied player left of the button. The engine exposes (and an AC verifies) the legal action set with exact amounts for the player to act. Cap, all-ins, side pots, showdown order and button movement come in M2 stories. Money and chips are integers; the odd-unit rule is the same for sit-and-go chips (tested in E01-S13). Interim M1 behaviour (until E01-S10, and until E01-S16 for stacks, in M2): every seat starts each hand with the $160 cash buy-in (20 big bets at $4/$8, REQ-007.1), which exceeds the $96 the most one player can put into a capped hand ($16 preflop + $16 flop + $32 turn + $32 river), so no all-in can arise; and seat policies never make a fifth bet on a street, so the 4-bet cap invariant holds before the engine enforces it.

## Requirements covered
- REQ-014 (Must): Hand sequence — The engine shall play each hand in the sequence: post blinds, deal two hole cards to each player, preflop betting, flop (3 board cards) and betting, turn (1 card) and betting, river (1 card) and betting, then showdown, ending the hand early when all but one player have folded.
- REQ-016 (Must): Fixed-limit betting and cap — The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.

Covers: REQ-014, REQ-016, REQ-019

## Notes
Model the engine as pure functions: applyAction(state, action) -> state, legalActions(state). Keep money as integer dollars/chips.

Plan key: E01-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 6 players at $4/$8 with the button at seat 1, When a hand starts, Then seat 2 posts the $2 small blind and seat 3 posts the $4 big blind [REQ-014.1]
- [ ] #2 Given a scripted deck and 6 players with the button at seat 1, When hole cards are dealt, Then cards go one at a time clockwise from seat 2 for two rounds, so seat 2 receives deck cards 1 and 7 and seat 1 receives cards 6 and 12 [REQ-014.2]
- [ ] #3 Given blinds are posted with the button at seat 1, When preflop begins, Then seat 4 acts first; Given the flop, turn or river, When betting begins, Then the first active player left of the button acts first [REQ-014.3]
- [ ] #4 Given 6 players at $4/$8 with the button at seat 1, When the engine lists legal actions, Then seat 4 preflop gets exactly fold, call $4 and raise to $8, the first player to act on the turn with no bet facing gets exactly check and bet $8, and every bet or raise is exactly $4 preflop and on the flop and exactly $8 on the turn and river [REQ-016.1]
- [ ] #5 Given a betting round, When every active player has acted and all have put in the same amount, Then the round ends and the next street deals 3 flop cards, then 1 turn card, then 1 river card [REQ-014.4]
- [ ] #6 Given all players but one have folded, When the last fold is applied, Then the remaining player wins the pot without showing cards and no further cards are dealt [REQ-014.5]
- [ ] #7 Given river betting has ended with seats 2 and 5 tied for the best hand in a $27 pot with the button at seat 1, When the pot is awarded, Then seat 2 receives $14 and seat 5 receives $13; with the button at seat 3 instead, seat 5 receives $14 and seat 2 receives $13; with one best hand, that player receives the whole $27 [REQ-019.3]
- [ ] #8 Given 100,000 random seeded hands with 3 to 10 players, every seat starting the hand with the $160 buy-in and random legal actions that never make a fifth bet on a street, When each is played, Then every hand terminates in a legal end state (one player left or a completed showdown) [REQ-014.4, REQ-014.5]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
