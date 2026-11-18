---
id: TASK-10.11
title: See my playing time and hands per hour in the report
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-10.1
  - TASK-4.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: low
type: feature
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see the session's total playing time with its hands-per-hour pace, so that I can see how much practice I got through (G-5).

The report shows the session's total playing time and hands per hour = hands completed / playing hours, rounded to a whole number. Playing time is the elapsed playing time that E04-S09 stores with the session state (time at the table only, excluding paused time, REQ-072.1); this story reads that stored value when the session ends and saves it with the report; it does not measure or store elapsed time itself.

## Requirements covered
- REQ-072 (Could): Session clock and pace — The Table header shall show the session's elapsed playing time and its hands-per-hour pace.

Covers: REQ-072

## Notes
One elapsed-time source for header and report: E04-S09.

Plan key: E10-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session of 300 hands played over 1 h 30 min at the table with a 20 min pause in between, When its report is shown, Then it shows playing time 1 h 30 min and 200 hands per hour [REQ-072.3]
- [ ] #2 Given a session paused by closing the app after 45 min at the table and resumed for 15 min more, When its report is shown, Then it shows playing time 1 h 0 min [REQ-072.3]
- [ ] #3 Given a stored report, When it is reopened later, Then playing time and hands per hour equal the values shown when the session ended [REQ-072.3]
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
