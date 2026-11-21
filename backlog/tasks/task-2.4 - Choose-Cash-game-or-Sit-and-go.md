---
id: TASK-2.4
title: Choose Cash game or Sit-and-go
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T19:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to choose the game type for the session, so that I can practise the format I am preparing for.

Game type options are exactly Cash game and Sit-and-go. On first use Cash game is selected; pre-selecting the game type of the most recently started session (REQ-005.1 "default is the last used value", REQ-012) is delivered with the remembered configuration in E02-S10. When Sit-and-go is chosen the stake selector (and the cash buy-in) is hidden; switching back to Cash game shows it again with the stake that was selected. Start game passes the game type in the session configuration; the sit-and-go structure itself (1,500 chips, level schedule, results) is E05.

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.

Covers: REQ-005, REQ-006, REQ-012

## Notes
E05 must make Start game with Sit-and-go play the sit-and-go structure.

Plan key: E02-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config, When the game type options are listed, Then they are exactly Cash game and Sit-and-go [REQ-005.1]
- [ ] #2 Given a fresh install, When Game Config opens, Then Cash game is selected [REQ-012.2]
- [ ] #3 Given Game Config with $6/$12 selected, When the user chooses Sit-and-go, Then the stake selector is not shown [REQ-006.4]
- [ ] #4 Given Sit-and-go was chosen after $6/$12 was selected, When the user chooses Cash game again, Then the stake selector is shown with $6/$12 selected [REQ-006.4]
- [ ] #5 Given Sit-and-go chosen, When the user chooses Start game, Then the session configuration has game type Sit-and-go and carries no stake [REQ-005.1, REQ-006.4]
- [ ] #6 Given a sit-and-go game is chosen, When the user's action bar is built, Then userActionBar passes the 'chips' unit so labels read e.g. 'Call 40' / 'Raise to 80' with no $ sign (TASK-3.7 actionBar(view, 'chips'))
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
1. SessionConfig as a cash | sit-and-go union (Q-3); sng constants 1,500 chips at 20/40.
2. Game Config: game-type radio group (Q-4); Stakes/Buy-in hidden for Sit-and-go; stake kept while switching back.
3. Start game with Sit-and-go opens a 1,500-chip 20/40 table (Q-1); header per Q-2.
4. userActionBar passes 'chips' for sit-and-go (AC#6).
5. Q-5 extraction-only edits to two locked tests; unit + e2e (Chromium + WebKit) tests.

Full spec: doit/TASK-2.4/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow-up from TASK-1.5 (doc-13): PlayerView cannot show game type or sit-and-go level until HandConfig carries them; add both to HandConfig and PlayerView here.

AC added from TASK-3.7 follow-up (wire chip labels)

Autopilot Q-1..Q-5 auto-accepted (qa.md); unlocks under TASK-2.1 and TASK-2.3.

Build blocked: locked TASK-3.4 text check requires 'buyIn(' in the top-up. Resolved (orchestrator): sng interim top-up refills to buyIn(tableStake) = 800 (recorded deviation from A-3); no locked test touched; TASK-3.21 AC added (sng never refills).
<!-- SECTION:NOTES:END -->
