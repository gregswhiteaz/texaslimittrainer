---
id: TASK-4.3
title: Keep the action log collapsed or expanded as I left it
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-4.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: medium
type: feature
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want the action log to stay collapsed or expanded as I last set it, so that I choose once how much of the table the log takes up.

The action log (E04-S01) has a collapse/expand control on the Table screen. The chosen state is stored locally and kept across hands, sessions and app launches. The control is a native button reachable with Tab and at least 44 x 44 CSS px (table control rules, E03-S17).

## Requirements covered
- REQ-023 (Should): Action log — The Table screen shall show an action log listing every action of the current hand in order, which the user can collapse and expand.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-023, REQ-057

## Notes
E13 owns schema versioning of local stores (REQ-054); store this UI preference where E13 can version it. Reset all data (E12) clears it.

Plan key: E04-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the action log is expanded, When the user collapses it, Then the entries are hidden and the control offers Expand; When the user expands it, Then the entries of the current hand are shown again in order [REQ-023.4]
- [ ] #2 Given the user collapsed the log during hand 20, When hand 21 is dealt, Then the log is still collapsed [REQ-023.4]
- [ ] #3 Given the user collapsed the log, When the session ends and a new session starts, Then the log is collapsed [REQ-023.4]
- [ ] #4 Given the user expanded the log, When the app is closed and relaunched and a table is opened, Then the log is expanded [REQ-023.4]
- [ ] #5 Given the Table screen at 1280 x 720, When the user tabs to the log's collapse control and presses Enter or Space, Then the log toggles; and the control is a native button at least 44 x 44 CSS px [REQ-057.2, REQ-057.4]
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
