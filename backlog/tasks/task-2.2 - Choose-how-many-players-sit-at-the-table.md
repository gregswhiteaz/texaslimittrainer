---
id: TASK-2.2
title: Choose how many players sit at the table
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T23:20:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-1.11
  - TASK-7.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to choose a table of 2 to 10 players including me, so that I can practise heads-up, short-handed and full-ring play.

Game Config offers the players options 2, 3, 4, 5, 6, 7, 8, 9 and 10 (including the user), labelled 2 (heads-up), 6 (6-max) and 10 (full ring) as in the Config storyboard. Mapping to reference sizes: 2 -> heads-up; 3, 4, 5, 6, 7 -> 6-max; 8, 9, 10 -> full ring. Sizes 2, 6, 9, 10 are exact; for 3, 4, 5, 7 and 8 the screen states that advice will be approximate and names the reference size used. Start game seats the user plus (size - 1) bots; heads-up rules come from E01-S09, the heads-up and full-ring charts from E07-S05.

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-015 (Must): Heads-up blinds and order — While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.

Covers: REQ-005, REQ-015

Plan key: E02-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config, When the players options are listed, Then they are exactly the integers 2 to 10 [REQ-005.2]
- [ ] #2 Given Game Config, When the user selects 3, 4, 5 or 7 players, Then the screen states that advice will be approximate and names 6-max as the reference size [REQ-005.3, REQ-005.4]
- [ ] #3 Given Game Config, When the user selects 8 players, Then the screen states that advice will be approximate and names full ring as the reference size [REQ-005.3, REQ-005.4]
- [ ] #4 Given Game Config, When the user selects 2, 6, 9 or 10 players, Then no approximate-advice notice is shown [REQ-005.3, REQ-005.4]
- [ ] #5 Given each size from 2 to 10 selected, When the user chooses Start game, Then the table seats the user and exactly size minus 1 bots and the header shows that number of players [REQ-005.2]
- [ ] #6 Given 2 players selected on Game Config, When the first hand of the started session is dealt, Then the button posts the small blind and the other player the big blind [REQ-015.1]
- [ ] #7 Given the player-count selector, When the user picks a table size, Then it writes SessionConfig.players and seats, replaces the read-only 'Players at the table' row, and the heads-up and full-ring size labels are either reachable and tested or removed
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.1 follow-up (doc-23).
<!-- SECTION:NOTES:END -->
