---
id: TASK-11.11
title: See whether I met the G-2 goal after 5,000 hands
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-11.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: medium
type: feature
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to be told whether I met the G-2 mistake-reduction goal once I have played 5,000 hands, so that I get an honest verdict on whether my mistakes halved.

G-2: the unhinted Major errors per 100 hands in hands 4,001-5,000 are at most half the baseline over the first 1,000 hands (REQ-048.9), both counted over all stored hands in chronological order regardless of filter, hinted decisions excluded from the error counts. The 5,000 threshold counts stored hands of any kind (any game type, table size, line-up; hands with hinted decisions count) independent of the current filter (REQ-049.4). From 5,000 stored hands on, the Statistics screen states 'G-2 goal met' or 'G-2 goal not met' with both rates, whatever filter is set. Before that, no verdict is shown.

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-049 (Should): Style stats and goal status — The Statistics screen shall show the user's five tracked style stats over their most recent 1,000 hands in the current filter against the healthy ranges, and state how many of the five are in range.

Covers: REQ-040, REQ-049

Plan key: E11-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 4,999 stored hands of any kind, When the Statistics screen is shown, Then no G-2 verdict is shown [REQ-049.4]
- [ ] #2 Given 5,000 stored hands with a first-1,000 rate of 6.2 and a hands 4,001-5,000 rate of 3.1, When the Statistics screen is shown, Then it shows 'G-2 goal met' with the rates 6.2 and 3.1 [REQ-049.4]
- [ ] #3 Given 5,000 stored hands with a first-1,000 rate of 6.2 and a hands 4,001-5,000 rate of 3.2, When the Statistics screen is shown, Then it shows 'G-2 goal not met' with the rates 6.2 and 3.2 [REQ-049.4]
- [ ] #4 Given hands 4,001-5,000 contain 30 unhinted and 40 hinted Major errors and the first 1,000 contain 62 unhinted, When the verdict is computed, Then the later rate is 3.0 and the G-2 goal is met [REQ-040.3, REQ-049.4]
- [ ] #5 Given 5,000 stored hands of which 2,000 are sit-and-go hands and 900 contain a hinted decision, When the Statistics screen is shown with game type filter Cash and table size Heads-up, Then the G-2 verdict is shown with the same result as with all filters set to All [REQ-049.4]
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
