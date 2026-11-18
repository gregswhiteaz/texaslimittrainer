---
id: TASK-6.17
title: Keep Calling station and Maniac bots inside their style bands
status: To Do
assignee: []
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the loose bot styles' measured play to fall inside their target bands, so that the loose opponents I practise against behave like real loose players.

Tune the Calling station and Maniac style data files until the Mixed 6-max check-styles run measures them inside their bands: Calling station VPIP 45-65%, PFR 3-10%, aggression 10-25%; Maniac VPIP 50-75%, PFR 35-60%, aggression 65-85%. This story is the final gate: with TAG and Rock already tuned (E06-S16), the full fit command passes for all four styles.

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.

Covers: REQ-027

Plan key: E06-S17 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`, When it completes, Then the Calling station's measured VPIP is 45-65%, PFR 3-10% and aggression 10-25% [REQ-027.2]
- [ ] #2 Given the same run, When it completes, Then the Maniac's measured VPIP is 50-75%, PFR 35-60% and aggression 65-85% [REQ-027.3]
- [ ] #3 Given the same check-styles run with seeds 7 and 1234, When each completes, Then the Calling station and Maniac are inside their bands for both seeds [REQ-027.5, REQ-027.2, REQ-027.3]
- [ ] #4 Given the same run, When it completes, Then all four styles are inside their bands and the command exits 0 [REQ-027.5, REQ-027.1, REQ-027.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The 100,000-hand Mixed check-styles run is added to the nightly / on-demand CI job [REQ-027.5]
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
