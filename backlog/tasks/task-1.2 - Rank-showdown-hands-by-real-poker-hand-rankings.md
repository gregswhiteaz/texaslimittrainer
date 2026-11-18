---
id: TASK-1.2
title: Rank showdown hands by real poker hand rankings
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T03:03:00Z'
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
  - doc-7
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/engine/cards.ts: Card = 0–51 (rank*4+suit), makeCard/cardRank/cardSuit/parseCard/parseCards/formatCard with strict validation.
2. src/engine/hand-evaluator.ts: table-driven 7-card evaluator (13-bit flush table + collision-free rank-count index) built at module load; evaluate(5–7 cards) -> HandRank 1–7462 (higher = stronger); compareHands; handCategory; HAND_CATEGORIES; HAND_RANK_COUNT.
3. tests/engine: independent reference oracle; exhaustive 2,598,960-hand check; category counts; wheel/kicker/suit ACs; fast-check 6/7-card best-of-subsets properties.
4. Performance: CI floor ≥1M evals/s and build ≤500 ms in npm test; reference command for ≥10M/s and ≤50 ms.

Full spec: doit/TASK-1.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: src/engine/cards.ts + hand-evaluator.ts (flush table + quinary rank-count index, ~162 KiB tables built at load); independent oracle; exhaustive 2,598,960-hand check (~0.7 s); ~16M evals/s, ~24.5 ms build on reference machine; gate PASS.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the first engine code: src/engine/cards.ts (card encoding and text helpers) and src/engine/hand-evaluator.ts (table-driven 5-7 card evaluator returning a dense rank 1..7462, plus compareHands and handCategory). It gives showdown, equity and bots one fast, correct ranking. Verification: exhaustive check of all 2,598,960 five-card hands against an independent oracle; 6/7-card best-of-subset properties; suit-tie and wheel tests. npm run lint, typecheck, test and build pass (36 tests, engine line coverage 100%); CI run 44227089180 is green. Measured about 15.4-16M evals/s, table build about 24-27 ms, cold import about 30 ms, tables about 162 KiB. Review round 1 had 0 blocking findings and the judge passed 15 of 16 items, with SPEC-16 pending only for this document. Assumptions A-1..A-7 (module layout, card notation, RangeError validation, eager table build, random-seed property tests, CI perf floor, exhaustive test in npm test) should be reviewed; user decisions Q-1..Q-3 all took the recommended options. Follow-ups, not created: hand names and best five cards for showdown display (REQ-019.7); harden the evaluate length guard and parseCard error echo; widen the CI perf floor if flaky.
<!-- SECTION:FINAL_SUMMARY:END -->
