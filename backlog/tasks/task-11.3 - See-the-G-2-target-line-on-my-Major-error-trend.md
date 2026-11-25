---
id: TASK-11.3
title: See the G-2 target line on my Major-error trend
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T10:47:00Z'
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
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a dashed target line at half my first-1,000-hand Major-error rate, so that I can see how far I am from the G-2 goal.

G-2 baseline (REQ-048.9): the unhinted Major errors per 100 hands over the user's first 1,000 hands in chronological order (session start, then hand number), of any game type, table size and line-up, independent of the current filter. Hinted decisions are excluded from the error count (REQ-040.3); the forced fold after Leave table is never counted (REQ-004.8). The target is half the baseline and is drawn as a dashed line on the Major-error chart with the caption 'Dashed line: half your first-1,000 rate (G-2)'. The line appears once 1,000 hands of any kind exist (any game type, table size, line-up; hinted or not, REQ-048.3); before that it is not shown. The threshold counts all stored hands, not hands in the current filter.

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-040, REQ-048

Plan key: E11-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 999 stored hands of any game type, When the Major-error chart is shown, Then no target line is drawn [REQ-048.3, REQ-048.9]
- [ ] #2 Given 1,000 stored hands whose decisions include 62 unhinted Major errors, When the Major-error chart is shown, Then a dashed target line is drawn at 3.1 [REQ-048.3, REQ-048.9]
- [ ] #3 Given the first 1,000 hands contain 62 unhinted and 20 hinted Major errors, When the target is computed, Then it is 3.1 [REQ-040.3, REQ-048.9]
- [ ] #4 Given 1,000 stored hands of which 400 are sit-and-go hands and 60 contain a hinted decision, When the chart is shown with game type filter Cash (600 hands in the filter), Then the target line is drawn [REQ-048.3, REQ-048.9]
- [ ] #5 Given the first 1,000 hands were 600 cash 6-max and 400 sit-and-go heads-up hands with a baseline of 6.2, When the filter is set to any table size, game type or line-up, Then the target line stays at 3.1 [REQ-048.9]
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
1. g2Target: half the unhinted Major rate of the first 1,000 stored hands (bbPer100(m,2,1000)), null below 1,000 hands; computed from all hands even when a view is filtered
2. Major chart draws a dashed target line with the approved caption and aria-label suffix; scale includes the target
3. Tests (filters proven via statisticsView(filtered, all)), e2e, docs

Full spec: doit/TASK-11.3/spec.md
<!-- SECTION:PLAN:END -->
