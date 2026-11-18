---
id: TASK-2.8
title: Change the style of one bot seat
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to change the style of a single bot seat, so that I can build exactly the table I want to practise against.

Each bot row on Game Config offers exactly the styles TAG, Calling station, Maniac and Rock (the storyboard's extra "Random" option is not in the requirements). Changing one row changes no other row. If any seat differs from the chosen preset's assignment, Start game records the line-up as Custom via E06-S07; if every seat matches, the preset name is kept.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.

Covers: REQ-009

Plan key: E02-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given any bot row, When its style options are listed, Then they are exactly TAG, Calling station, Maniac and Rock [REQ-009.2]
- [ ] #2 Given the Mixed preset at 6 players, When the user changes seat 3 from Maniac to Rock, Then seat 3 shows Rock and seats 1, 2, 4 and 5 keep TAG, Calling station, Rock and TAG [REQ-009.3]
- [ ] #3 Given the Mixed preset at 6 players with seat 3 changed to Rock, When the user chooses Start game, Then that bot plays as a Rock at the table and the session's line-up name is Custom [REQ-009.3, REQ-009.6]
- [ ] #4 Given the Tough preset with one seat changed to Rock and then back to its preset style, When the user chooses Start game, Then the session's line-up name is Tough [REQ-009.6]
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
