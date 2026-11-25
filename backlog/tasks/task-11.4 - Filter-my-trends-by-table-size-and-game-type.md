---
id: TASK-11.4
title: Filter my trends by table size and game type
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T12:32:00Z'
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
- [x] #1 Given the Statistics screen, When the filter options are listed, Then table size offers exactly All, Heads-up, 6-max and Full ring and game type offers exactly All, Cash and Sit-and-go, each defaulting to All [REQ-048.2]
- [x] #2 Given stored hands at table sizes 2, 4, 6, 8 and 10, When the table size filter is 6-max, Then only hands from 4- and 6-player sessions are counted; and When it is Full ring, Then only hands from 8- and 10-player sessions are counted [REQ-048.2]
- [x] #3 Given 2,000 cash hands and 600 sit-and-go hands, When the game type filter is Sit-and-go, Then the Major-error chart's points equal values recomputed from the 600 sit-and-go hands only [REQ-048.2]
- [x] #4 Given 1,840 hands over 9 sessions of which 700 hands over 3 sessions are heads-up, When the table size filter is Heads-up, Then the totals read 700 hands over 3 sessions [REQ-048.6, REQ-048.2]
- [x] #5 Given 300 heads-up hands among 3,000 stored hands, When the table size filter is Heads-up, Then the screen shows 'Play 200 more hands to see your first trend point.' instead of a chart [REQ-048.7, REQ-048.2]
- [x] #6 Given the game-type filter set to Sit-and-go or All, When the BB/100 chart is shown, Then it uses TASK-11.2's cash-only BB/100 functions (no-cash message for Sit-and-go; cash hands only for All)
- [x] #7 Given any table-size or game-type filter, When the Major-error chart is shown, Then its G-2 target line is computed from all stored hands (statisticsView(filtered, all)), not from the filtered set
- [x] #8 Given a filter that leaves the Major chart in its 'more hands' or 'no hands' state while 1,000+ hands are stored, When Statistics is shown, Then no G-2 caption, target line or aria-label suffix appears (a test pins this)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. filterTrendData(data, filter) for table size (session size = largest dealt-in count, via referenceSizeOf) and game type; All/All returns data unchanged
2. Table size and Game type selects on Statistics once data has loaded; not remembered
3. App recomputes statisticsView(filtered, all) so the G-2 target always uses all hands; BB/100 stays cash-only
4. Tests per AC (incl. no G-2 elements without points), unit cases, e2e with axe

Full spec: doit/TASK-11.4/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-11.2 Q-1: TASK-11.2 implements the filter cases as pure functions; this story wires the select to them.

AC added from TASK-11.3 Q-1.

AC added from TASK-11.3 follow-up (doc-136).

Build: filterTrendData (table size from the session's largest dealt-in count via referenceSizeOf; game type by cash summary); Table size / Game type selects once loaded, not remembered; App recomputes statisticsView(filtered, all). npm test 1370 pass; statistics e2e 16 pass; gate PASS.

Judge r1 PASS 13/13: production preview Chromium/WebKit, 2,780 hands over 7 sessions out of time order — all 12 filter combinations matched an independent computation; G-2 target stayed the all-hands 6.8 under every filter (closes the review MINOR); shrinking sit-and-go stayed 6-max; reset to All/All; full e2e 316 pass. CI 45612253462 green.
<!-- SECTION:NOTES:END -->
