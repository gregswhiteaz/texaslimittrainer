---
id: TASK-5.11
title: Leave a sit-and-go early and get my finishing position
status: To Do
assignee: []
created_date: '2026-11-17T23:04:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.7
  - TASK-10.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to leave a sit-and-go while I still hold chips and have my finishing position recorded, so that I can stop a tournament at any time and still get a fair result.

Leave table in a sit-and-go while the user holds chips (REQ-008.10): the session ends with finishing position = number of players left including the user, and the remaining hands are not played. Between hands this happens at once (E10-S01). Mid-hand, the E10-S05 confirm-and-fold flow completes the hand first and the position is counted after it (bots that bust in that hand are not counted). The session record stores the position and starting player count and the Session Report shows it (E10-S11).

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-008

Plan key: E05-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-player sit-and-go between hands with the user and 3 bots holding chips, When the user chooses Leave table, Then the session ends, no further hand is dealt and the Session Report opens with the result '4th of 6' [REQ-008.10]
- [ ] #2 Given hand 40 in progress with the user and 2 bots holding chips, When the user confirms Leave table and a bot busts while hand 40 completes, Then no hand 41 is dealt and the result is '2nd of 6' [REQ-008.10]
- [ ] #3 Given a sit-and-go the user left with the result '4th of 6', When its session record is read, Then it holds finishing position 4 and starting player count 6 and no hand record exists after the hand in which the user left [REQ-008.10, REQ-008.6]
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
