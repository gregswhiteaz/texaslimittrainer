---
id: TASK-11.12
title: Open Statistics within 2 seconds with 100,000 stored hands
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-11.2
  - TASK-11.9
  - TASK-11.10
  - TASK-11.11
  - TASK-11.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: medium
type: feature
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the Statistics screen to render quickly even after a very large number of hands, so that checking progress never feels slow, however long I have practised.

REQ-055.5: Statistics rendered <= 2 s (p95) with 100,000 stored hands on the reference machine (Apple-silicon Mac, latest Chrome). Covers every chart, the style section, totals and the G-2 verdict. Likely needs per-hand summary rows or indexed reads rather than scanning full hand records. This story is the single home of the Statistics <= 2 s measurement; E13-S11 covers the other screens.

## Requirements covered
- REQ-053 (Should): Storage capacity and failure — TLH Trainer shall keep at least 100,000 hand records, and if a storage write fails it shall stop dealing and tell the user that history could not be saved.
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-053, REQ-055

## Notes
Any summary data added must be written with the hand record (records are immutable) and covered by E13's schema versioning.

Plan key: E11-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 100,000 seeded stored hands over 400 sessions, When the Statistics screen is opened 200 times, Then the p95 time from choosing Statistics to all charts, the style section and totals being rendered is 2.0 s or less [REQ-055.5, REQ-053.1]
- [ ] #2 Given 100,000 seeded stored hands, When the plotted values are compared with values recomputed from the full hand records, Then they are equal for every grouping and filter [REQ-055.5]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Automated timing test reports the p95 over 200 samples with 100,000 hands and runs in CI as a non-flaky benchmark job [REQ-055.5]
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
