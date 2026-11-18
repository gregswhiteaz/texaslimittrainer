---
id: TASK-11.10
title: See my style stats separately for each table size I played
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-11.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: medium
type: feature
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my style stats per reference size when all table sizes are selected, so that heads-up, 6-max and full-ring play are each judged against the right ranges.

With the table size filter All, the style section shows one block per reference size that has at least one hand in the filter (Heads-up, 6-max, Full ring, in that order), each over that size's most recent 1,000 hands, with its own ranges and its own '<k> of 5 in range (goal: 4)'. Reference sizes with no hands get no block.

## Requirements covered
- REQ-049 (Should): Style stats and goal status — The Statistics screen shall show the user's five tracked style stats over their most recent 1,000 hands in the current filter against the healthy ranges, and state how many of the five are in range.

Covers: REQ-049

Plan key: E11-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given stored hands at 6-max and full ring and none heads-up, When the table size filter is All, Then the style section shows a 6-max block and a Full ring block, each with its own ranges and '<k> of 5 in range (goal: 4)', and no Heads-up block [REQ-049.3]
- [ ] #2 Given 3,000 6-max hands and 200 full-ring hands, When the table size filter is All, Then the 6-max block uses the most recent 1,000 6-max hands and the Full ring block uses all 200 full-ring hands [REQ-049.3, REQ-049.1]
- [ ] #3 Given hands from 4-player and 6-player sessions, When the table size filter is All, Then both count in the single 6-max block [REQ-049.3]
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
