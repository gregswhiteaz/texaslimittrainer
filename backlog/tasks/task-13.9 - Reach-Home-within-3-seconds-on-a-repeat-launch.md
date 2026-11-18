---
id: TASK-13.9
title: Reach Home within 3 seconds on a repeat launch
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-13.4
  - TASK-2.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the app to reach Home within 3 seconds when I launch it again, so that starting a practice session never feels like a chore.

Measured on the reference machine (Apple-silicon Mac, latest Chrome) from launch to Home interactive, on a repeat launch (app files cached by the service worker, no pending migration). Includes splash loading of the rules engine and strategy data (E02-S12). Timing test reports p95 over 200 samples.

## Requirements covered
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-053, REQ-055

Plan key: E13-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the installed app with files cached and no pending migration, When it is launched 200 times, Then the p95 time from launch to Home interactive is at most 3.0 s [REQ-055.4]
- [ ] #2 Given storage seeded with 100,000 hand records, When the app is launched 200 times, Then the p95 time to Home interactive is still at most 3.0 s [REQ-055.4, REQ-053.1]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The timing test runs on demand and its p95 result is recorded in the story notes for the reference machine [REQ-055.4]
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
