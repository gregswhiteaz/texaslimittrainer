---
id: TASK-10.10
title: See a first-use message on Home before any session has ended
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:03:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies: []
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: low
type: feature
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see a first-use message on Home until my first session ends, so that a fresh install tells me how to begin instead of showing an empty snapshot.

While no session has ended (no stored report), Home shows the text "No sessions yet — start a new game to begin training." and no snapshot. A paused session alone does not remove the message.

## Requirements covered
- REQ-003 (Could): Last-session snapshot and first-use state on Home — While at least one session has ended, the Home screen shall show a snapshot of the most recent ended session; while none has ended, it shall show a first-use message instead.

Covers: REQ-003

Plan key: E10-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When Home is shown, Then it shows "No sessions yet — start a new game to begin training." and no snapshot [REQ-003.3]
- [ ] #2 Given a paused session and no ended session, When Home is shown, Then the first-use message is shown and no snapshot [REQ-003.3]
- [ ] #3 Given the first session has just ended, When Home is shown, Then the first-use message is gone and the snapshot is shown [REQ-003.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
<!-- DOD:END -->
