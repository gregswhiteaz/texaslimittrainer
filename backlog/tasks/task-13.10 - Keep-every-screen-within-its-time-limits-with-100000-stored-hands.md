---
id: TASK-13.10
title: Keep every screen within its time limits with 100,000 stored hands
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-13.9
  - TASK-8.3
  - TASK-9.8
  - TASK-6.13
  - TASK-3.6
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: medium
type: feature
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every screen to stay responsive after 100,000 stored hands, so that years of practice never make the trainer slow or unusable.

Seed IndexedDB with 100,000 hand records (with sessions and reports) and verify the screens built in earlier waves still open and the REQ-055 limits hold (p95 over 200 samples on the reference machine): hint card <= 1.0 s, Hand Review panel <= 1.0 s, bot decision <= 100 ms, no frame over 100 ms during advice computation; launch to Home <= 3 s is E13-S10. Statistics with 100,000 hands (<= 2 s) is measured only in E11-S12 and Settings with 100,000 hands is checked in E12-S08, so this story does not repeat them. Likely needs indexed queries (by session id) rather than full scans.

## Requirements covered
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-053, REQ-055

Plan key: E13-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given storage seeded with 100,000 hand records across 500 sessions, When Splash, Home, Game Config, the Table, the Hand Review panel and the Session Report are each opened, Then each opens without error [REQ-053.1]
- [ ] #2 Given the 100,000-hand seed, When 200 hints and 200 hand ends are timed at the table, Then p95 is at most 1.0 s for the hint card and at most 1.0 s for the Hand Review panel [REQ-053.1, REQ-055.1, REQ-055.2]
- [ ] #3 Given the 100,000-hand seed, When 200 bot decisions are timed and the table is profiled during advice computation, Then bot decision p95 is at most 100 ms and no frame exceeds 100 ms [REQ-053.1, REQ-055.3, REQ-055.6]
- [ ] #4 Given the 100,000-hand seed, When the user ends a session and opens its Session Report, Then the report opens with values for that session only [REQ-053.1]
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
