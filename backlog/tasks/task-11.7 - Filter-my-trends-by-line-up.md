---
id: TASK-11.7
title: Filter my trends by line-up
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T14:54:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-11.4
  - TASK-6.7
  - TASK-3.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to filter my trends by the line-up I played against, so that I can judge results against the same opponents (G-3).

Line-up filter: All (default), Mixed, Tough, Soft, Custom, matching the line-up name stored on each session and hand record (preset or Custom, resolved by E06-S07). Applies to every chart, totals and the empty-state message, together with the table-size and game-type filters.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

Plan key: E11-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Statistics screen, When the line-up filter options are listed, Then they are exactly All, Mixed, Tough, Soft and Custom, and All is selected on opening [REQ-048.8]
- [ ] #2 Given stored sessions with Mixed, Tough and Custom line-ups, When the line-up filter is Custom, Then only hands from the Custom sessions are counted in the charts and totals [REQ-048.8, REQ-048.6]
- [ ] #3 Given line-up Mixed and table size 6-max filters together, When the charts are shown, Then every point equals the value recomputed from hands that are both Mixed and 6-max [REQ-048.8, REQ-048.2]
- [ ] #4 Given no stored Soft sessions, When the line-up filter is Soft, Then the screen shows 'Play your first hand to see trends.' and totals of 0 hands over 0 sessions [REQ-048.8, REQ-048.10]
- [ ] #5 Given any line-up filter, When the Major-error chart is shown, Then its G-2 target line is computed from all stored hands (statisticsView(filtered, all)), not from the filtered set
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. TrendFilter gains optional lineUp (all / Mixed / Tough / Soft / Custom) applied per hand in filterTrendData; All/All/All still returns data unchanged
2. 'Line-up' select between Game type and Group by, reset to All on each opening (existing App reset)
3. G-2 target stays from all hands; storyboard gains the select
4. Tests with non-chronological input and an e2e through the real App

Full spec: doit/TASK-11.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added (moved from TASK-11.8, where TASK-11.3 Q-1 put it by mistake).

Build: Line-up select (All/Mixed/Tough/Soft/Custom) between Game type and Group by; filters hands by stored lineUp, combines with other filters and groupings; G-2 target from all hands; App unchanged. npm test 1389 pass; statistics/report e2e 26 pass; gate PASS.
<!-- SECTION:NOTES:END -->
