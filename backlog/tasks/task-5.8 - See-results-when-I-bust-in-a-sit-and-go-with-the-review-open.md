---
id: TASK-5.8
title: See results when I bust in a sit-and-go with the review open
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.7
  - TASK-9.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 152000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a See results control on the review panel when my sit-and-go is over, so that I can study my last hand before going to my tournament result.

Sit-and-go counterpart of E09-S06 (cash Continue). When the user's stack is 0 at the end of a sit-and-go hand and the Hand Review panel is open, the panel's next-hand control reads 'See results'; choosing it ends the session and opens the Session Report with the finishing position (E05-S05). No hand is dealt. Closing the panel keeps the See results control visible on the table, as Deal next hand does (REQ-043.10). The same applies when the user wins all the chips while the panel is open (REQ-008.11).

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-008

## Notes
Hook into the same next-hand control E09-S06 switches to Continue.

Plan key: E05-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a sit-and-go hand ends with the user's stack at 0 and the Hand Review panel open, When the panel is shown, Then its next-hand control reads 'See results' and no 'Deal next hand' or 'Continue' control is offered [REQ-008.9]
- [ ] #2 Given that panel, When the user selects See results, Then the session ends, no further hand is dealt and the Session Report opens with the user's finishing position [REQ-008.9, REQ-008.5]
- [ ] #3 Given that panel, When no control is chosen, Then no hand is dealt and the Session Report does not open until See results is chosen [REQ-008.9]
- [ ] #4 Given that panel, When the user selects Close, Then the See results control stays visible on the table and selecting it opens the Session Report [REQ-008.9]
- [ ] #5 Given a sit-and-go hand ends with the user's stack at 1 chip or more and the panel open, When the panel is shown, Then its next-hand control reads 'Deal next hand' [REQ-008.9]
- [ ] #6 Given the user wins the last remaining bot's chips and the Hand Review panel is open, When the panel is shown, Then its next-hand control reads 'See results', and selecting it ends the session and opens the Session Report with the result '1st of <starting players>' [REQ-008.11]
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
