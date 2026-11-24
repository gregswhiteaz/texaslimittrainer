---
id: TASK-5.2
title: Leave a busted bot's seat empty for the rest of the sit-and-go
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T04:56:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.1
  - TASK-6.8
  - TASK-10.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want busted bots to leave the sit-and-go without being replaced, so that the table shrinks as in a real tournament until one player holds all the chips.

Bot replacement (E06-S08) applies to cash games only. In a sit-and-go a bot whose stack is 0 at the end of a hand leaves and its seat stays empty for the rest of the session; the button and blinds move past empty seats with the E01-S16 rules. The empty seat shows no name, style, stack or cards. Bot banter's 'a new player sits down' event therefore never fires in a sit-and-go. Seats left empty are skipped everywhere positions are counted, including the leak position groups (E10-S12).

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.

Covers: REQ-008, REQ-047

## Notes
Gate the E06-S08 replacement rule on game type rather than duplicating seating logic.

Plan key: E05-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-player sit-and-go in which a bot's stack is 0 at the end of a hand, When the next hand is dealt, Then that seat is empty, no new bot is seated and the hand is dealt to 5 players [REQ-008.4]
- [ ] #2 Given two bots bust in the same hand of a sit-and-go, When the next hand is dealt, Then both seats are empty and no bot has been added [REQ-008.4]
- [ ] #3 Given a sit-and-go with an empty seat, When the Table is shown, Then that seat shows no name, style, stack or card-back marker [REQ-008.4]
- [ ] #4 Given the empty seat is the seat the button would move to, When the next hand is dealt, Then the button and blinds move past the empty seat to occupied seats [REQ-008.4]
- [ ] #5 Given `npm run playtest -- --game sng --size 6 --hands 10000 --seed 42`, When it runs, Then no sit-and-go ever seats a bot after its first hand, each sit-and-go ends when one player holds all 9,000 chips, and zero invariant violations are reported [REQ-008.4]
- [ ] #6 Given a 9-seat sit-and-go in which 3 bots have busted and the user is the seat two after the big blind among the 6 players dealt in, When the user's preflop decision is classified for leaks, Then the empty seats are skipped and the decision falls in the middle position group, as at a 6-player table [REQ-047.6, REQ-008.4]
- [ ] #7 Given a sit-and-go where a seat reached $0 (today the interim 'stopped' step from TASK-3.21), When the next hand is due, Then play continues with that seat empty, the 'stopped' step and sitAndGoStopped interim are removed, no 'Deal next hand' button is left that does nothing, and the stored record is resumable (Home logs no 'Session record could not be read' for it)
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
AC added from TASK-3.21 follow-up (interim sit-and-go stop, doc-110).
<!-- SECTION:NOTES:END -->
