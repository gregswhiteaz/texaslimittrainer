---
id: TASK-2.13
title: Sit at a random seat with a random starting button
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T23:20:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: medium
type: feature
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each session to start from a randomly drawn table position, so that I practise from every position.

When a session starts, the user's seat is drawn uniformly from all seats and the starting dealer button seat is drawn uniformly from all seats, independently. Bots fill the other seats in order (E06-S06). The user is always drawn at the bottom centre of the Table (E03-S01). Game Config shows "You: seat chosen at random each session" (storyboard). Use crypto randomness in the app and a seeded generator in tests.

## Requirements covered
- REQ-010 (Should): User seat and starting dealer button — When a session starts, TLH Trainer shall seat the user at a seat chosen at random and place the dealer button at a seat chosen at random.

Covers: REQ-010

Plan key: E02-S13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 1,000 seeded session starts at each of 2, 6 and 10 players, When the user's seat is tabulated, Then each seat receives the user 1/n of the time within 3 percentage points [REQ-010.1]
- [ ] #2 Given 1,000 seeded session starts at each of 2, 6 and 10 players, When the starting button seat is tabulated, Then each seat receives the button 1/n of the time within 3 percentage points [REQ-010.2]
- [ ] #3 Given a 6-player session started with the user drawn at seat 4 and the button at seat 2, When the first hand is dealt, Then the user is drawn at the bottom centre, the button marker is at seat 2 and seats 3 and 4 post the blinds [REQ-010.1, REQ-010.2, REQ-010.3]
- [ ] #4 Given a session starts, When seats are assigned, Then userSeat and button are drawn for that session and written to SessionConfig, and Game Config's 'You — Seat 5' row is replaced by the storyboard's random-seat text
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
