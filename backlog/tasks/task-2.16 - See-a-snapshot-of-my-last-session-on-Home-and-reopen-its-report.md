---
id: TASK-2.16
title: See a snapshot of my last session on Home and reopen its report
status: To Do
assignee: []
created_date: '2026-11-17T23:04:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.1
  - TASK-10.1
  - TASK-10.4
  - TASK-10.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my most recent ended session summarised on Home, so that my progress is visible at a glance every time I open the app.

Moved from E10 (former E10-S08). While at least one session has ended (a stored Session Report exists, E10-S01), Home shows a snapshot of the most recently ended session: game type, table size, stake, hands played, BB/100, Major errors per 100 hands (E10-S02) and the top leak (first-ranked leak title, E10-S07), all read from that session's stored report. A paused session is not an ended session. The snapshot has a link that opens that session's stored Session Report. When that session had no leaks the snapshot shows "Top leak: none". The sit-and-go variant (finishing position instead of stake and BB/100, REQ-003.5) is E05.

## Requirements covered
- REQ-003 (Could): Last-session snapshot and first-use state on Home — While at least one session has ended, the Home screen shall show a snapshot of the most recent ended session; while none has ended, it shall show a first-use message instead.
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.

Covers: REQ-003, REQ-044

## Notes
E05: the sit-and-go snapshot story (E05-S08) should depend on this story instead of the retired E10-S08.

Plan key: E02-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given two ended sessions where the later is a 6-player $4/$8 cash session of 214 hands with BB/100 +2.7, Major errors /100 6.1 and top leak "Calling too often on the turn", When Home is shown, Then the snapshot shows "Cash", "6 players", "$4/$8", "214", "+2.7", "6.1" and "Calling too often on the turn" [REQ-003.1]
- [ ] #2 Given an ended session and a newer paused session, When Home is shown, Then the snapshot shows the ended session's values [REQ-003.1]
- [ ] #3 Given an ended session, When Home is shown, Then each snapshot value equals the same value in that session's stored report [REQ-003.1]
- [ ] #4 Given the Home snapshot, When the user follows its link, Then that session's stored Session Report opens with its stored values [REQ-003.2, REQ-044.7]
- [ ] #5 Given the app was closed and relaunched after a session ended, When the user follows the snapshot link, Then the reopened report shows the same values as when the session ended [REQ-044.7]
- [ ] #6 Given the most recently ended session had no leaks, When Home is shown, Then the snapshot shows "Top leak: none" [REQ-003.4]
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
