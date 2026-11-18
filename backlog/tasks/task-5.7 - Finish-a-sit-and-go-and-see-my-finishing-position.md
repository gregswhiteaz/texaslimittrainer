---
id: TASK-5.7
title: >-
  Finish a sit-and-go by busting or winning all the chips and see my finishing
  position
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.2
  - TASK-10.12
  - TASK-3.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the sit-and-go to end with my finishing position when it is decided, so that I get a clear tournament result without waiting for the bots to play it out.

When the user's stack is 0 at the end of a hand, the sit-and-go ends for the user: no further hand is dealt and the remaining hands are not played out. Finishing position = number of players left including the user = 1 + the number of other players holding chips after that hand (if a bot busts in the same hand it is not counted). When the user holds all chips, the sit-and-go ends with position 1. The session record stores finishing position and starting player count; the session then ends and the Session Report opens (E10-S01) showing e.g. '3rd of 6' (E10-S11). No rebuy is offered and no prize money is shown. With the Hand Review panel open, see E05-S06. Without it, the Session Report opens 1.5 s after the final result is shown (REQ-008.13). Leave table in a sit-and-go is E05-S10.

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-008

## Notes
Use the E10-S01 report builder; the result text comes from E10-S11.

Plan key: E05-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-player sit-and-go with the user and 2 bots holding chips, When the user's stack is 0 at the end of a hand and the Hand Review panel is not open, Then no further hand is dealt and the Session Report opens with the result '3rd of 6' [REQ-008.5, REQ-008.6]
- [ ] #2 Given 4 players hold chips at the start of a hand, When the user and one bot both reach 0 in that hand, Then the user's finishing position is 3rd (the 2 bots still holding chips plus the user) [REQ-008.5]
- [ ] #3 Given a 2-player sit-and-go, When the user's stack reaches 0, Then the result is '2nd of 2' [REQ-008.5, REQ-008.6]
- [ ] #4 Given a 9-player sit-and-go, When the user wins the last chips of the last remaining bot, Then no further hand is dealt and the Session Report opens with the result '1st of 9' [REQ-008.6]
- [ ] #5 Given the user busts in a sit-and-go, When the result is shown, Then no Rebuy or add-chips control is offered and no hand record exists for any later hand of that session [REQ-008.5]
- [ ] #6 Given an ended sit-and-go, When its session record and Session Report are read, Then the session holds the finishing position and starting player count and no screen shows a prize or money amount for the result [REQ-008.6]
- [ ] #7 Given a sit-and-go hand ends with the user's stack at 0 and the Hand Review panel closed, When the final result is shown, Then the Session Report opens 1.5 s after the result is shown and not before [REQ-008.13]
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
