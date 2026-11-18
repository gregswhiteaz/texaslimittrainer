---
id: TASK-13.11
title: Prove every screen passes automated accessibility checks
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-2.12
  - TASK-2.6
  - TASK-2.4
  - TASK-2.16
  - TASK-2.17
  - TASK-3.11
  - TASK-10.2
  - TASK-8.1
  - TASK-9.1
  - TASK-10.1
  - TASK-13.1
  - TASK-13.3
  - TASK-13.7
  - TASK-13.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every screen to pass automated accessibility checks, so that I can read and operate the trainer comfortably during long sessions.

A Playwright + axe suite in `npm run e2e` (so CI fails on any violation) runs in Chromium and WebKit over the screens and states built in earlier waves and in this epic, enumerated in AC1-AC3. Statistics (E11-S01), Settings (E12-S01), the Settings overlay (E12-S03), the reset dialog (E12-S08), the storage warning (E12-S09) and sit-and-go screens (E05) are in the same wave: each owning story carries its own axe check (global DoD and story DoD), and once they exist the suite's route list picks them up. The same sweep extends the no-real-money check of E02 to the screens and dialogs it visits.

## Requirements covered
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-057, REQ-061

## Notes
Add each same-wave screen (Statistics, Settings, sit-and-go) to the suite's route list when it lands; their pass/fail is owned by their stories.

Plan key: E13-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Splash (loading and load error), Home (first use, with last-session snapshot, with Resume session, with update notice) and Game Config (Cash game and Sit-and-go selected), When axe runs in Chromium and WebKit, Then it reports zero serious or critical violations [REQ-057.1]
- [ ] #2 Given the Table on the user's turn, with the hint card open, with the Hand Review panel open, with the rebuy dialog after busting, with the Leave-mid-hand dialog and with the last-hand-not-saved message, When axe runs in Chromium and WebKit, Then it reports zero serious or critical violations [REQ-057.1]
- [ ] #3 Given the Session Report, the unexpected-error screen and the migration-error screen, When axe runs in Chromium and WebKit, Then it reports zero serious or critical violations [REQ-057.1]
- [ ] #4 Given a screen with a deliberately unlabelled button in a test build, When the accessibility suite runs, Then it fails naming the screen and the rule [REQ-057.1]
- [ ] #5 Given the accessibility suite is part of `npm run e2e`, When CI runs on a push, Then a serious or critical violation fails the workflow [REQ-057.1]
- [ ] #6 Given every screen and dialog listed in AC1-AC3, When its text and controls are inspected, Then none offers a deposit, payment, purchase, cash-out, wager of real money or real-money conversion [REQ-061.1]
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
