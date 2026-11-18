---
id: TASK-8.3
title: Get the hint card within one second
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-8.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-8
priority: medium
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the hint card to appear within a second of asking, so that hints never slow my practice down.

REQ-055.1: on the reference machine (Apple-silicon Mac, latest Chrome) the hint card is shown <= 1.0 s (p95) after clicking Hint, measured by an automated timing test over 200 samples. Computation stays in the advice worker (E03-S12) so the table never freezes (REQ-055.6).

## Requirements covered
- REQ-055 (Should): Response times — On the reference machine (Apple-silicon Mac, latest Chrome), TLH Trainer shall meet these 95th-percentile response times.

Covers: REQ-055

## Notes
Precompute or cache advice for the current decision point if needed; output must stay identical (REQ-036.1).

Plan key: E08-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the reference machine and 200 scripted Hint clicks over preflop, flop, turn and river decisions at 2, 6 and 10 players, When the timing test runs, Then it reports the p95 time from click to visible card and that p95 is at most 1.0 s [REQ-055.1]
- [ ] #2 Given a hint is being computed for a multiway river decision, When a long-task observer runs in Chromium, Then no main-thread task longer than 100 ms is recorded [REQ-055.6]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The hint timing test reports p95 over 200 samples in its output [REQ-055.1]
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
