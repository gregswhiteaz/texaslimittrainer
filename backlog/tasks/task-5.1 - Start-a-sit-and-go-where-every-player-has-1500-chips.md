---
id: TASK-5.1
title: Start a sit-and-go where every player has 1,500 chips
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.4
  - TASK-3.10
  - TASK-1.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to start a sit-and-go in which every player begins with 1,500 chips, so that I can practise tournament-style play where everyone starts equal.

Game Config already passes game type Sit-and-go with no stake (E02-S04). This story makes Start game play the sit-and-go structure: the engine receives a sit-and-go table definition instead of a cash stake; every player (user and bots) starts with 1,500 chips at level 1 (small bet 20, big bet 40, blinds 10/20). There is no buy-in and no rebuy in a sit-and-go. The session record (E03-S11) stores game type sit-and-go and the starting player count. The playtest CLI's `--game sng` option (E01) plays successive sit-and-gos with this structure, each starting fresh, until the requested number of hands is reached. Rising limits are E05-S02, empty seats E05-S04, finishing E05-S05.

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-008

## Notes
Model the sit-and-go as a table definition with a level schedule so E05-S02 only adds levels. PlayerView must expose game type and the current level's big bet (E07-S17 needs both).

Plan key: E05-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config with Sit-and-go and 6 players chosen, When the user chooses Start game, Then the Table opens with the user and 5 bots each holding 1,500 chips and the first hand posts blinds of 10 and 20 [REQ-008.1, REQ-008.2]
- [ ] #2 Given each table size from 2 to 10, When a sit-and-go starts, Then every seated player holds exactly 1,500 chips before the first hand [REQ-008.1]
- [ ] #3 Given a sit-and-go has started, When the session record is read, Then it holds game type sit-and-go, the starting player count and no stake or buy-in [REQ-008.1, REQ-008.6]
- [ ] #4 Given `npm run playtest -- --game sng --size 6 --hands 10000 --seed 42`, When it runs, Then every sit-and-go it plays starts with 1,500 chips per player, the chips at each table always total 9,000, zero invariant violations are reported and it exits 0 [REQ-008.1]
- [ ] #5 Given the same sit-and-go playtest seed and options, When it is run twice, Then the two outputs are byte-identical [REQ-008.1]
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
