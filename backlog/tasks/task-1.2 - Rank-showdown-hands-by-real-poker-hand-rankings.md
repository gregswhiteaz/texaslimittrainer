---
id: TASK-1.2
title: Rank showdown hands by real poker hand rankings
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want showdown hands ranked by standard poker hand rankings, so that the right player always wins the pot.

Hand evaluator: best five-card hand from two hole cards plus five board cards. Categories high to low: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card; A-2-3-4-5 is the lowest straight. Kickers break ties within a category; suits never break ties. Must agree with the reference table of all 7,462 distinct five-card ranks. The evaluator is also used by the advice engine's equity calculation (E07), so speed matters.

## Requirements covered
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.

Covers: REQ-019

## Notes
A lookup-table evaluator (Cactus Kev style or perfect-hash) keeps equity simulation fast enough for REQ-055.

Plan key: E01-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given every distinct five-card hand, When each is evaluated, Then the evaluator produces exactly 7,462 rank classes in the same order as the reference table, with categories ordered straight flush > four of a kind > full house > flush > straight > three of a kind > two pair > one pair > high card [REQ-019.1]
- [ ] #2 Given the straights A-2-3-4-5 and 2-3-4-5-6, When compared, Then A-2-3-4-5 ranks as the lowest straight, below 2-3-4-5-6 and above any three of a kind [REQ-019.1]
- [ ] #3 Given two hole cards and five board cards, When the hand is evaluated, Then its rank equals the best rank among all 21 five-card combinations of the seven cards [REQ-019.1]
- [ ] #4 Given two hands with the same pair and different kickers (K-K-A-9-4 vs K-K-Q-9-4), When compared, Then the hand with the higher kicker wins [REQ-019.2]
- [ ] #5 Given two hands that differ only in suits, When compared, Then they tie [REQ-019.2]
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
