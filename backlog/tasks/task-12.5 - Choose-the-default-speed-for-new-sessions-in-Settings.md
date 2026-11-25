---
id: TASK-12.5
title: Choose the default speed for new sessions in Settings
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-25T15:55:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.1
  - TASK-2.11
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to set Rapid or Realistic as my default speed, so that every new game starts at the pace I prefer without changing it each time.

Settings 'Default speed': Rapid or Realistic, default Rapid. Writes the same settings-store value that E02-S11 reads to pre-fill Game Config's speed (REQ-012.3: speed always comes from this setting, never from the last session). The default speed does not change the speed of a session already running (that is the table's speed control, E03-S14); it applies from the next Game Config shown.

## Requirements covered
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.

Covers: REQ-012, REQ-050

Plan key: E12-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the Settings screen is shown, Then Default speed offers exactly Rapid and Realistic with Rapid selected [REQ-050.1]
- [ ] #2 Given the last session was started at Rapid and Default speed is Realistic in Settings, When Game Config opens, Then Realistic is pre-selected [REQ-050.1, REQ-012.3]
- [ ] #3 Given Default speed is Realistic, When the app is closed and relaunched, Then Settings shows Realistic and Game Config pre-selects Realistic [REQ-050.1]
- [ ] #4 Given a session running at Rapid, When the user sets Default speed to Realistic in the Settings overlay and closes it, Then the running session stays at Rapid and the next Game Config pre-selects Realistic [REQ-050.1, REQ-050.5]
- [ ] #5 Given the last session was started at Realistic and Default speed is Rapid in Settings, When Game Config opens, Then Rapid is pre-selected [REQ-050.1, REQ-012.3]
- [ ] #6 Given the settings store created by TASK-12.1, When the default speed is chosen in Settings, Then it is written through a validated write API next to readSettings() and read back on the next launch
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
AC added from TASK-12.1 follow-up (doc-141): store exists with defaults but nothing writes or reads it yet.
<!-- SECTION:NOTES:END -->
