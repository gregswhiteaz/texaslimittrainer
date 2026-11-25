---
id: TASK-11.4
title: Filter my trends by table size and game type
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T09:09:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-11.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to filter my trends by table size and game type, so that I can compare like with like.

Filters: table size All, Heads-up, 6-max, Full ring, by reference size (REQ-005.4: 2 -> Heads-up; 3-7 -> 6-max; 8-10 -> Full ring); game type All, Cash, Sit-and-go. Default All / All. Filters apply to every chart, the totals line and the empty-state messages ('Play <n> more hands...' for 1-499 hands, 'Play your first hand to see trends.' for 0). Line-up filter is E11-S08.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

## Notes
Reuse the E07/E10 table-size -> reference-size mapping; do not duplicate it.

Plan key: E11-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Statistics screen, When the filter options are listed, Then table size offers exactly All, Heads-up, 6-max and Full ring and game type offers exactly All, Cash and Sit-and-go, each defaulting to All [REQ-048.2]
- [ ] #2 Given stored hands at table sizes 2, 4, 6, 8 and 10, When the table size filter is 6-max, Then only hands from 4- and 6-player sessions are counted; and When it is Full ring, Then only hands from 8- and 10-player sessions are counted [REQ-048.2]
- [ ] #3 Given 2,000 cash hands and 600 sit-and-go hands, When the game type filter is Sit-and-go, Then the Major-error chart's points equal values recomputed from the 600 sit-and-go hands only [REQ-048.2]
- [ ] #4 Given 1,840 hands over 9 sessions of which 700 hands over 3 sessions are heads-up, When the table size filter is Heads-up, Then the totals read 700 hands over 3 sessions [REQ-048.6, REQ-048.2]
- [ ] #5 Given 300 heads-up hands among 3,000 stored hands, When the table size filter is Heads-up, Then the screen shows 'Play 200 more hands to see your first trend point.' instead of a chart [REQ-048.7, REQ-048.2]
- [ ] #6 Given the game-type filter set to Sit-and-go or All, When the BB/100 chart is shown, Then it uses TASK-11.2's cash-only BB/100 functions (no-cash message for Sit-and-go; cash hands only for All)
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-11.2 Q-1: TASK-11.2 implements the filter cases as pure functions; this story wires the select to them.
<!-- SECTION:NOTES:END -->
