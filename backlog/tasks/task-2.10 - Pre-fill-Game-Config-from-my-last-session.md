---
id: TASK-2.10
title: Pre-fill Game Config from my last session
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.4
  - TASK-2.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want Game Config to show the values of my last started session, so that I can start another session with fewer clicks.

The last configuration is created and updated on each Start game (not on Resume). When Game Config opens, game type, table size, stake, line-up preset and per-seat styles are pre-filled from the most recently started session. Speed is NOT remembered: it is always pre-filled from the Settings default speed (REQ-012.3, E02-S11). On first use (and after Reset all data, E12) the defaults are Cash game, 6 players, $4/$8, Mixed preset, Rapid.

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.

Covers: REQ-005, REQ-012

Plan key: E02-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the last started session was Cash, 9 players, $10/$20, Tough with seat 2 changed to Rock, When Game Config opens, Then exactly those values are pre-filled [REQ-012.1]
- [ ] #2 Given a fresh install, When Game Config opens, Then it shows Cash game, 6 players, $4/$8, the Mixed preset with its seat styles and Rapid [REQ-012.2]
- [ ] #3 Given the user started session A and later resumed an older paused session B, When Game Config opens, Then it shows session A's values [REQ-012.1]
- [ ] #4 Given the user changed fields on Game Config and chose Cancel, When Game Config opens again, Then it shows the last started session's values [REQ-012.1]
- [ ] #5 Given a stored last configuration fixture whose game type is Sit-and-go, When Game Config opens, Then Sit-and-go is selected as the game type [REQ-012.1, REQ-005.1]
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
