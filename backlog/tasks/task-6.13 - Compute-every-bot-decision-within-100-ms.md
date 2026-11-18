---
id: TASK-6.13
title: Compute every bot decision within 100 ms
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-6.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: medium
type: feature
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bots that decide within 100 ms, so that hands keep moving at Rapid speed and I can play 200 or more hands an hour.

REQ-055.3: bot decision computed in at most 100 ms at the 95th percentile on the reference machine (Apple-silicon Mac, latest Chrome). Fit: automated timing test reporting p95 over 200 samples. Postflop multiway equity is the likely bottleneck; sample all streets and table sizes up to 10.

## Requirements covered
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-055

## Notes
In the app, bot decisions run off the main thread with the advice engine (REQ-055.6, E03).

Plan key: E06-S14 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 200 sampled decision points per style spanning preflop, flop, turn and river at table sizes 2, 6 and 10, When each bot decision is timed in latest Chrome on the reference machine, Then the 95th-percentile time for each style is at most 100 ms [REQ-055.3]
- [ ] #2 Given the timing test, When a style's 95th-percentile time exceeds 100 ms, Then the test prints the style and its p95 and fails [REQ-055.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Measured p95 per style on the reference machine is recorded in the story notes [REQ-055.3]
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
