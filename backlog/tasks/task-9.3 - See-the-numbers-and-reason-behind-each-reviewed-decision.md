---
id: TASK-9.3
title: See the numbers and reason behind each reviewed decision
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-9.1
  - TASK-3.12
  - TASK-3.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-9
priority: high
type: feature
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each review entry to explain the advice with its equity numbers, so that I understand why a decision was right or wrong, not just that it was.

Completes REQ-043.1. Entries are read from the decision entries stored in the hand record (E03-S10), which were computed at the decision point with the decision-time observed-stats snapshot, not recomputed after the hand. Each entry shows street, board at that point, the user's action, the recommended action, the grade, equity % and required equity % (one decimal), the plain-English explanation (E07-S12) and the basis per opponent ('typical player' or 'based on N hands of this opponent'). The hint card (E08) and the review entry for the same decision must show the same recommendation and numbers (REQ-036.2). Reading or grading must not block the main thread (E03-S12). Preflop entries show the chart basis instead of equity numbers (REQ-043.9).

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- REQ-036 (Must): Deterministic advice — Given the same player view and the same observed opponent statistics, the advice engine shall always return the same recommendation, numbers, explanation and grade.
- REQ-043 (Must): Hand Review panel — When a hand ends in which the user made any decision other than folding preflop, the Table screen shall open the Hand Review panel beside the table, unless auto-open is turned off in Settings.

Covers: REQ-035, REQ-036, REQ-043

## Notes
With E08-S02 (stored record equals the hint card) this completes the hint-versus-review equality UI test asked for by E07-S13.

Plan key: E09-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted hand in which the user made 4 decisions, When the panel opens, Then each entry shows street, board at that point, the user's action, the recommended action, the grade and the explanation, and each flop, turn and river entry shows equity % and required equity %, each equal to the decision entry stored in the hand record [REQ-043.1]
- [ ] #2 Given a preflop decision holding A9o in the cutoff at 6-max, When the panel opens, Then its entry shows the chart basis "From the 6-max chart: raise A9o from the cutoff" and no equity % or required equity % [REQ-043.9]
- [ ] #3 Given a flop decision against an opponent observed for 40 hands, When the panel opens, Then the entry shows the basis "based on 40 hands of this opponent"; and a preflop entry shows "typical player" [REQ-035.4]
- [ ] #4 Given hint advice was requested through the advice worker at the user's flop decision and the opponent's observed hand count goes from 29 to 30 when the hand ends, When the panel opens, Then the flop entry's recommended action, equity %, required equity %, explanation and basis are identical to that hint result [REQ-036.2, REQ-043.1]
- [ ] #5 Given a 4-decision hand at a table of 10 players, When the panel opens at a 1280 x 720 window, Then all 4 entries with their explanations can be read in the panel without horizontal scrolling [REQ-043.1]
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
