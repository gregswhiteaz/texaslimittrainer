---
id: TASK-6.16
title: Keep TAG and Rock bots inside their style bands
status: To Do
assignee: []
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-21T23:16:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the tight bot styles' measured play to fall inside their target bands, so that the tight opponents I practise against behave like real tight players.

Tune the TAG and Rock style data files (and only them) until the Mixed 6-max check-styles run (E06-S09) measures them inside their bands: TAG VPIP 18-26%, PFR 14-22%, aggression 45-65%; Rock VPIP 8-15%, PFR 6-12%, aggression 35-55% (aggression postflop only, REQ-027.6).

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.

Covers: REQ-027

Plan key: E06-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`, When it completes, Then TAG's measured VPIP is 18-26%, PFR 14-22% and aggression 45-65% [REQ-027.1]
- [ ] #2 Given the same run, When it completes, Then the Rock's measured VPIP is 8-15%, PFR 6-12% and aggression 35-55% [REQ-027.4]
- [ ] #3 Given the same check-styles run with seeds 7 and 1234, When each completes, Then TAG and Rock are inside their bands for both seeds [REQ-027.5, REQ-027.1, REQ-027.4]
- [ ] #4 Given TAG's measured VPIP or PFR fall outside REQ-027.1 (VPIP 18-26%, PFR 14-22%), When the style-band check runs, Then the 6-max chart is retuned until both are inside the band
- [ ] #5 Given the TASK-7.19 re-raise widening (openers keep 80-90% vs a single 3-bet), When TAG's style band is measured, Then its aggression stays within 45-65% or the chart is retuned
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
AC added from TASK-7.2 follow-up (doc-14).

AC added from TASK-7.19 follow-up (doc-28).

Dependency on TASK-7.8 added from TASK-6.3: postflop advice never bets/raises until value betting (REQ-033.2) lands, so postflop aggression (REQ-027.6) is 0% for every bot until then.
<!-- SECTION:NOTES:END -->
