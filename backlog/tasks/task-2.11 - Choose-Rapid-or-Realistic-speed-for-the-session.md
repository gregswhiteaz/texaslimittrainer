---
id: TASK-2.11
title: Choose Rapid or Realistic speed for the session
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.1
  - TASK-3.13
  - TASK-3.18
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: medium
type: feature
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to choose the bot speed before the session starts, so that I can drill many hands quickly or practise at a live pace.

Game Config offers Rapid and Realistic. The speed field is always pre-filled from the Settings default speed (REQ-050.1, default Rapid), never from the last started session (REQ-012.3). Until E12 adds the Settings screen, the default-speed setting is read from the settings store with its default Rapid; E12 must write the same setting. Rapid: each bot action is displayed within 300 ms of the previous action; Realistic: each bot waits a random 0.8-3.0 s before acting (pacing is implemented and fully tested by E03-S13 (Rapid) and E03-S18 (Realistic); the ACs here only verify that the speed chosen on Game Config reaches the table). The chosen speed is stored with the session (E03-S11/S14 keep it).

## Requirements covered
- REQ-011 (Should): Speed choice — The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.

Covers: REQ-011, REQ-012

Plan key: E02-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config, When the speed options are listed, Then they are exactly Rapid and Realistic, with Rapid selected on first use [REQ-012.2]
- [ ] #2 Given the Settings default speed is Realistic and the last started session used Rapid, When Game Config opens, Then Realistic is selected [REQ-012.3]
- [ ] #3 Given the Settings default speed is Rapid and the last started session used Realistic, When Game Config opens, Then Rapid is selected [REQ-012.3]
- [ ] #4 Given Realistic chosen on Game Config, When the started session plays its first 10 bot actions, Then each bot waits between 0.8 s and 3.0 s before acting, showing the chosen speed reached the table [REQ-011.2]
- [ ] #5 Given Rapid chosen on Game Config, When the started session plays its first 10 bot actions, Then each is displayed within 300 ms of the previous action, showing the chosen speed reached the table [REQ-011.1]
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
