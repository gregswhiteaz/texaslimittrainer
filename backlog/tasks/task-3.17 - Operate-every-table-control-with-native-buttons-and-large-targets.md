---
id: TASK-3.17
title: Operate every table control with native buttons and large targets
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.11
  - TASK-3.15
  - TASK-3.14
  - TASK-3.2
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: medium
type: feature
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every control on the Table screen to be a native, focusable control at least 44 x 44 px, so that I can play long sessions without misclicks and use the keyboard focus if I want.

Applies to all Table screen controls: action buttons, Leave table, speed control, seat stats targets, dialog buttons. Controls are native buttons, links or form fields reachable with Tab and activated with Enter or Space while focused (this is not a shortcut: REQ-022.3 still forbids single-key shortcuts when nothing is focused). Interactive targets are at least 44 x 44 CSS px. Action buttons' 44 x 44 px size is verified in E03-S02 and not re-measured here.

## Requirements covered
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-057

Plan key: E03-S17 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Table screen during the user's turn, When the user presses Tab repeatedly, Then focus reaches every action button, Leave table, the speed control and every bot seat's stats target, and each is a native button, link or form field [REQ-057.2]
- [ ] #2 Given the Call button has keyboard focus, When the user presses Enter, Then the user calls [REQ-057.2]
- [ ] #3 Given the Fold button has keyboard focus, When the user presses Space, Then the user folds [REQ-057.2]
- [ ] #4 Given the bust dialog is open, When the user tabs to Rebuy and presses Enter, Then the rebuy happens [REQ-057.2]
- [ ] #5 Given the Table screen and the bust dialog at 1280 x 720, When Leave table, the speed control, every seat stats target and the dialog buttons are measured, Then each is at least 44 x 44 CSS px [REQ-057.4]
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
