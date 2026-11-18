---
id: TASK-12.4
title: Delete all my data after confirming
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.3
  - TASK-2.17
  - TASK-2.10
  - TASK-4.3
  - TASK-12.5
  - TASK-12.6
  - TASK-12.7
  - TASK-12.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to delete all stored data after a confirmation, so that I can start my training fresh, knowing nothing was deleted by accident.

Settings 'Your data' section: the text 'Hands, sessions and statistics are stored only in this browser. Clearing browser data deletes them, and there is no backup in this version.' and a 'Reset all data…' button (storyboard). It opens a confirmation dialog stating that all history will be permanently deleted and there is no backup, with Cancel (default focus) and 'Delete everything'. Delete everything removes every stored session (active and paused), hand record, session report, last configuration (Game Config returns to first-use defaults: Cash, 6 players, $4/$8, Mixed, Rapid; E02-S10), settings (back to defaults), and UI preferences such as the action-log collapse state (E04-S02); statistics are derived from hands and reports so they disappear too. Reset is the only deletion path in the app (REQ-052.6). After deletion the app shows Home in its first-use state (E02-S17 message, no snapshot, no Resume session). If Reset is chosen from the Settings overlay at a table, the active session is deleted too (no report is written) and Home opens.

## Requirements covered
- REQ-051 (Should): Reset all data — When the user chooses Reset all data and confirms in a dialog, TLH Trainer shall delete every stored session, hand, report, statistic, paused session and setting.
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-051, REQ-053, REQ-057

## Notes
Delete store contents inside one IndexedDB transaction (or delete the database and recreate it with current schema versions, E13) so a crash mid-reset never leaves half the data.

Plan key: E12-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Settings screen, When the user chooses 'Reset all data…', Then a dialog opens stating that all history will be permanently deleted and there is no backup [REQ-051.1]
- [ ] #2 Given the reset dialog opens, When it is shown, Then it has exactly the buttons Cancel and 'Delete everything' and Cancel has keyboard focus [REQ-051.2]
- [ ] #3 Given seeded storage with 3 ended sessions, 500 hands, 3 reports, a paused session and changed settings, When the user chooses Cancel (or presses Enter on the default focus), Then the dialog closes and every stored record is byte-identical to before [REQ-051.4, REQ-051.2]
- [ ] #4 Given the same seeded storage, When the user chooses 'Delete everything', Then IndexedDB holds no session, hand record, session report, paused session, last configuration, settings or action-log preference record [REQ-051.3]
- [ ] #5 Given the deletion has completed, When the app shows the next screen, Then Home shows "No sessions yet — start a new game to begin training.", no snapshot and no Resume session [REQ-051.3]
- [ ] #6 Given the deletion has completed, When Settings and Game Config are opened, Then Settings shows Rapid, auto-open on, opponent styles on, four-colour off and banter on, and Game Config shows Cash game, 6 players, $4/$8, Mixed and Rapid [REQ-051.3]
- [ ] #7 Given the Settings overlay is open over an active session at hand 30, When the user confirms 'Delete everything', Then the session and its 29 stored hands are deleted, no report is written and Home opens in its first-use state [REQ-051.3]
- [ ] #8 Given storage seeded with 100,000 hand records across 500 sessions, When Settings is opened and 'Delete everything' is confirmed, Then Settings opens without error and afterwards no hand record remains and Home opens in its first-use state [REQ-053.1, REQ-051.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 axe reports zero serious or critical violations on Settings with the reset confirmation dialog open, in Chromium and WebKit [REQ-057.1]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
