---
id: TASK-4.5
title: See each player's bet as chips in front of their seat
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-4.4
  - TASK-3.4
  - TASK-3.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: medium
type: feature
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to see the chips each player has put in this street in front of their seat, so that I can follow where the money goes on every street.

While a betting round is in progress, each seat with chips put in on the current street shows a chip stack (chip art from E04-S03) with the amount in front of the seat. When the street ends, those stacks move into the pot and the pot amount updates. When the hand ends, the pot moves to each winner's seat with the amount won (split pots: each winner's share; side pots: each pot to its winner, E03-S07). Timing of the movement is E04-S05; this story makes the state changes correct.

## Requirements covered
- REQ-068 (Should): Bet chips in front of players — While a betting round is in progress, the Table screen shall show each player's chips put in on that street as a chip stack with its amount in front of their seat, and shall move those chips into the pot when the street ends and the pot to the winner when the hand ends.

Covers: REQ-068

## Notes
Drive chip positions from engine state after each action so the shown amounts can never drift from the engine.

Plan key: E04-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted 6-max $4/$8 hand, When each action is taken, Then the amount shown in front of every seat equals that seat's current-street contribution, and a seat with no chips put in this street shows no chip stack [REQ-068.1]
- [ ] #2 Given a new $4/$8 hand after the blinds are posted, When the table is shown, Then the small blind shows a chip stack of $2 and the big blind a chip stack of $4 in front of their seats [REQ-068.1]
- [ ] #3 Given preflop ends with three players each having put in $8 and a folded small blind's $2, When the flop is dealt, Then no chip stack remains in front of any seat and the pot shows $26 [REQ-068.2]
- [ ] #4 Given every other player folds to Ava's $8 turn bet, When the hand ends, Then Ava's bet joins the pot and the pot moves to Ava's seat showing the amount won and her stack increases by that amount [REQ-068.2, REQ-068.3]
- [ ] #5 Given Ben wins a $122 pot at showdown, When the hand ends, Then the pot moves to Ben's seat with "$122" shown there and the pot area is empty [REQ-068.3]
- [ ] #6 Given two players split a $60 pot, When the hand ends, Then $30 moves to each winner's seat with "$30" shown at each [REQ-068.3]
- [ ] #7 Given a main pot of $60 won by the short stack and a side pot of $80 won by another player, When the hand ends, Then $60 moves to the short stack's seat and $80 to the other winner's seat, each with its amount [REQ-068.3]
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
