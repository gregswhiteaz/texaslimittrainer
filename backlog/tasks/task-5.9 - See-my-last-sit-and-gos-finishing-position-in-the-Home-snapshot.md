---
id: TASK-5.9
title: See my last sit-and-go's finishing position in the Home snapshot
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.7
  - TASK-2.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the Home snapshot to show my finishing position when my last session was a sit-and-go, so that I see my tournament result at a glance.

Extends the Home snapshot (E02-S16). When the most recently ended session was a sit-and-go, the snapshot shows the finishing position out of the starting players (e.g. '3rd of 6') instead of stake and BB/100; game type, table size, hands played, Major errors per 100 hands, top leak and the report link stay as for cash.

## Requirements covered
- REQ-003 (Could): Last-session snapshot and first-use state on Home — While at least one session has ended, the Home screen shall show a snapshot of the most recent ended session; while none has ended, it shall show a first-use message instead.

Covers: REQ-003

Plan key: E05-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the most recently ended session is a 6-player sit-and-go of 47 hands in which the user finished 3rd, When Home is shown, Then the snapshot shows 'Sit-and-go', '6 players', '47' and '3rd of 6' and shows no stake and no BB/100 [REQ-003.5]
- [ ] #2 Given that snapshot, When its values are compared with the session's stored report, Then the finishing position, hands played, Major errors per 100 hands and top leak are equal [REQ-003.5]
- [ ] #3 Given a sit-and-go ended and a later cash session ended, When Home is shown, Then the snapshot shows the cash session's stake and BB/100 and no finishing position [REQ-003.5]
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
