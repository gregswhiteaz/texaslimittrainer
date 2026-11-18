---
id: TASK-5.5
title: See the current level, its limits and hands to the next level in the header
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.4
  - TASK-3.3
  - TASK-2.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: high
type: feature
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see the current level, its limits and how many hands remain until the limits rise, so that I can plan for the next increase in limits.

In a sit-and-go the Table header (E03-S03) shows the level, its limits and the hands remaining in place of the stake, e.g. 'Sit-and-go · 6 players · Level 3 · 40/80 · 7 hands to next level · Hand #24'. Hands remaining counts the hands of the current level not yet completed, including the hand in progress (hand 21 shows 10, hand 30 shows 1). From level 10 onward (hand 91 and later) the header reads 'Level 10 (final)' with no countdown. Resume (E02-S08) restores the level and hands remaining from the stored session state (E03-S11).

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-004, REQ-008

## Notes
The header also holds the session clock (E04-S09); keep the level text readable at 1280 x 720.

Plan key: E05-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given hand 24 of a 6-player sit-and-go is in progress, When the Table is shown, Then the header reads 'Sit-and-go', '6 players', 'Level 3', '40/80', '7 hands to next level' and 'Hand #24' and shows no stake [REQ-008.8]
- [ ] #2 Given hand 30 is in progress, When the header is shown, Then it reads '1 hand to next level'; and When hand 31 is dealt, Then it reads 'Level 4', '60/120' and '10 hands to next level' [REQ-008.8, REQ-008.3]
- [ ] #3 Given hand 91 or any later hand is in progress, When the header is shown, Then it reads 'Level 10 (final)' and '600/1,200' and shows no hands-to-next-level count [REQ-008.12, REQ-008.8]
- [ ] #4 Given a 6-player sit-and-go paused after hand 24 completed, When it is resumed, Then the next hand is #25 at Level 3 with limits 40/80, the header reads '6 hands to next level' and every stack equals its value at the end of hand 24 [REQ-008.3, REQ-004.3]
- [ ] #5 Given hand 30 was in progress after 29 completed hands when the app was closed, When the session is resumed, Then the next hand is #30 at Level 3 and hand 31 is the first hand at Level 4 [REQ-008.3]
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
