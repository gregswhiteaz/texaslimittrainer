---
id: TASK-10.7
title: See how many of my decisions used a hint in the report
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
  - TASK-3.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see how many of my decisions were hinted, so that I know how much I leaned on hints during the session.

Report shows hint usage: number of the user's decisions with the hinted flag set and that number as a percentage of all the user's decisions in the session, one decimal (e.g. "40 of 320 decisions (12.5%)"). Read from the hinted flag on E03-S10 decision records (E08 sets it true when the hint card was opened before acting).

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.

Covers: REQ-040, REQ-044

Plan key: E10-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session in which the user made 320 decisions of which 40 were hinted, When its report is shown, Then hint usage shows 40 hinted decisions and "12.5%" [REQ-044.3, REQ-040.4]
- [ ] #2 Given a session in which no hint was opened, When its report is shown, Then hint usage shows 0 hinted decisions and "0.0%" [REQ-044.3, REQ-040.4]
- [ ] #3 Given a session in which every one of the user's 25 decisions was hinted, When its report is shown, Then hint usage shows 25 hinted decisions and "100.0%" [REQ-044.3, REQ-040.4]
- [ ] #4 Given a scripted session, When its report is shown, Then the hinted count equals the number of stored decision records with the hinted flag set [REQ-044.3]
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
