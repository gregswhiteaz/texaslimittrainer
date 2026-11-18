---
id: TASK-6.4
title: Face a Maniac that bets and raises where TAG would check or call
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want Maniac opponents that play far too aggressively, so that I learn to call down and re-raise against loose-aggressive players.

Maniac (loose-aggressive) is built on the advice evaluation with documented deviations stored in its own style data file: where the advice is check it bets more often than TAG, and where the advice is call it raises more often than TAG. When the street is capped a raise is impossible and the Maniac calls. Deviation choices use the seeded generator from E06-S02. Target band (proved in E06-S09): VPIP 50-75%, PFR 35-60%, aggression 65-85%.

## Requirements covered
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.

Covers: REQ-026

Plan key: E06-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Maniac style data file, When it is loaded, Then it holds the style's deviation parameters and a plain-English description of the style [REQ-026.3]
- [ ] #2 Given 10,000 seeded decision points with no bet to face where the advice is check, When a Maniac and a TAG each act at the same points, Then the Maniac bets at more of them than TAG [REQ-026.2]
- [ ] #3 Given 10,000 seeded decision points where the advice is call, When a Maniac and a TAG each act at the same points, Then the Maniac raises at more of them than TAG [REQ-026.2]
- [ ] #4 Given the Maniac file's raise probability is changed and no code is changed, When the same 10,000 seeded decision points are replayed, Then its raise rate changes [REQ-026.3]
- [ ] #5 Given a Maniac facing a bet on a capped street (one bet and three raises made), When it chooses to be aggressive, Then it calls and the action is legal [REQ-026.2]
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
