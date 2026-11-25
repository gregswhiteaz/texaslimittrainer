---
id: TASK-11.5
title: Group my trends per session or per day
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T13:36:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-11.1
  - TASK-11.4
  - TASK-3.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to switch the trend grouping between per 500 hands, per session and per day, so that I can see progress in the unit that matches how I practise.

Group-by options: per 500 hands (default), per session, per day. Per session: one point for every session in the filter that has at least one stored hand, in session start order. Per day: one point for every local calendar day in the filter on which at least one hand was completed, using each hand record's completion date and time (REQ-052.7, stored by E03-S09). Both plot from the first hand on, with no minimum group size (REQ-048.10); with zero hands in the filter every grouping shows 'Play your first hand to see trends.' (the per-500 zero case is tested in E11-S01) Values use the same formulas as the per-500 grouping. The chosen grouping applies to every trend chart and keeps the current filters.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

Plan key: E11-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Statistics screen, When the grouping options are listed, Then they are exactly per 500 hands, per session and per day, and per 500 hands is selected on opening [REQ-048.1]
- [x] #2 Given a seeded data set of 3,000 hands over 9 sessions, When grouping is set to per session, Then the Major-error chart plots 9 points, each equal to that session's unhinted Major errors per 100 hands recomputed from its stored hand records [REQ-048.1]
- [x] #3 Given seeded hands completed on 4 different local dates, including one session that runs past midnight, When grouping is set to per day, Then the chart plots 4 points and each hand counts in the date it was completed [REQ-048.1]
- [x] #4 Given a table-size filter of 6-max is set, When the grouping is changed to per day, Then the filter stays 6-max and the points use only 6-max hands [REQ-048.1, REQ-048.2]
- [x] #5 Given 1 stored session of 12 hands, When grouping is per session or per day, Then the Major-error chart plots 1 point computed from those 12 hands and no 'Play ... more hands' message is shown [REQ-048.10]
- [x] #6 Given zero hands in the current filter, When grouping is per session or per day, Then the screen shows 'Play your first hand to see trends.' instead of a chart [REQ-048.10]
- [x] #7 Given the Stats storyboard's Group by default ('Every 100 hands') and REQ-048.1's per-500 default, When this story adds Group by, Then the default matches REQ-048.1 and the storyboard is updated to match
- [x] #8 Given per-session grouping, When the BB/100 chart is shown, Then each session's point uses TASK-11.2's bb100Value over that session's cash hands and equals that session's report BB/100
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
1. Grouping option (Every 500 hands default / Session / Day) passed to statisticsView; Major and BB/100 charts both follow it
2. Session points by session start; Day points by local calendar date of completedAt; per-session BB/100 via bb100Value equals the session report
3. Group by select in the filter row, reset on each opening; approved titles, notes and aria-labels; G-2 target unchanged
4. Storyboard Group by aligned to REQ-048.1; tests with out-of-order input and a time-zone e2e through the real App

Full spec: doit/TASK-11.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-11.1 follow-up (doc-134): storyboard shows Every 100 hands; TASK-11.1 followed REQ-048.1 (500).

AC added from TASK-11.2 Q-1: per-session BB/100 value is implemented in TASK-11.2; this story wires the grouping UI.

Build: Group by (Every 500 hands default / Session / Day) drives both charts; per-session BB/100 via bb100Value; Day by local date of completedAt; storyboard aligned to REQ-048.1; reset on each opening. npm test 1381 pass; statistics e2e 18 pass (incl. America/New_York time-zone run); gate PASS.

Judge r1 PASS 15/15: production preview Chromium/WebKit in Pacific/Kiritimati — two played cash sessions each matched their Session Report BB/100; seeded out-of-order data incl. a midnight-crossing session matched an independent computation across 7 filters under Session and Day; G-2 target unchanged; reset to Every 500 hands. CI 45620662930 green.
<!-- SECTION:NOTES:END -->
