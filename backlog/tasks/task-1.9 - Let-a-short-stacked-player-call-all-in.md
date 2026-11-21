---
id: TASK-1.9
title: Let a short-stacked player call all-in
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T04:33:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a player who cannot match a bet to call all-in for the chips they have, so that short stacks play out exactly as in a casino.

A player who cannot match a bet calls all-in for their remaining chips, stays in to showdown and makes no further actions. Uncalled bets are returned to the bettor before showdown. When all remaining players but at most one are all-in, the remaining board is dealt without betting. The playtest keeps resetting every seat to $160 before each hand until E01-S16, which switches it to real stacks once side pots, the short all-in rule, pot-by-pot showdown and short-blind all-ins all exist.

## Requirements covered
- REQ-014 (Must): Hand sequence — The engine shall play each hand in the sequence: post blinds, deal two hole cards to each player, preflop betting, flop (3 board cards) and betting, turn (1 card) and betting, river (1 card) and betting, then showdown, ending the hand early when all but one player have folded.
- REQ-018 (Must): All-in and side pots — When a player cannot match a bet, the engine shall let that player call all-in for the chips they have and shall create side pots so that each player can win only the amounts they matched.

Covers: REQ-014, REQ-018

Plan key: E01-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a player with $3 facing a $4 bet, When they call, Then they put in $3, are marked all-in and are never asked to act again in the hand [REQ-018.1]
- [ ] #2 Given an all-in player who has not folded, When the hand reaches showdown, Then that player's hand is included in the showdown [REQ-018.1]
- [ ] #3 Given all remaining players but at most one are all-in, When the betting round ends, Then the remaining board cards are dealt with no further betting [REQ-014.6]
- [ ] #4 Given a $8 bet called all-in for $5 and nobody else in, When the hand goes to showdown, Then $3 is returned to the bettor before showdown [REQ-018.4]
- [ ] #5 Given a bet that every other player folds to, When the hand ends, Then the bet is returned to the bettor and is not counted as won from opponents [REQ-018.4]
- [ ] #6 Given an all-in call for less than the full bet or an uncalled bet returned, When the invariant checker runs after that action, Then legal-action and chips checks accept it and still catch a wrong amount
- [ ] #7 Given uncalled bets are returned, When the hand result is shown, Then the 'wins $X' amount reflects only chips won from others plus the winner's matched contribution, and TASK-3.4's uncontested example ($16) is rechecked
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. createHand stack floor -> bigBlind+1 (Q-1).
2. Call all-in for the remaining stack when owe > stack; mark allIn on any action that empties the stack; all-in players never asked to act.
3. When at most one player can still act, deal the rest of the board with no betting.
4. Return uncalled bets (blinds included, Q-2) via HandResult.returned (Q-3); awards exclude them.
5. Invariant checker: chips rules account for returned; new check that returned equals the uncalled amount.
6. Update 8 earlier locked tests' amounts/messages (Q-4); playtest report byte-identical.

Full spec: doit/TASK-1.9/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.8 follow-up (doc-16).

AC added from TASK-3.4 follow-up (doc-25).

Autopilot Q-1..Q-4 auto-accepted (qa.md). Cross-story locked-test unlocks recorded under TASK-1.4, 1.44, 9.1, 3.4, 1.21, 1.31.

Build: all-in calls, allIn flag, skip all-in seats, board runout, uncalled-bet return via HandResult.returned, stack floor bigBlind+1, checker C3/C4/C5; 3 new acceptance files; E1–E8 locked edits as listed; playtest identical to baseline; gate PASS
<!-- SECTION:NOTES:END -->
