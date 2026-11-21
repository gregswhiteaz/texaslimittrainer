---
id: TASK-1.10
title: Split the pot into side pots for unequal all-ins
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T06:02:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-58
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want side pots created when players are all-in for different amounts, so that each player can win only the chips they matched.

Each pot records the set of eligible players and is awarded only among them (best hand, ties split per REQ-019.3). Total chips at the table are identical before and after every hand.

## Requirements covered
- REQ-018 (Must): All-in and side pots — When a player cannot match a bet, the engine shall let that player call all-in for the chips they have and shall create side pots so that each player can win only the amounts they matched.
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.

Covers: REQ-018, REQ-019

Plan key: E01-S13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given three players all-in for $10, $30 and $50 with a fourth covering, When pots are built, Then a main pot and two side pots exist, each recording exactly the players who matched it as eligible [REQ-018.2]
- [x] #2 Given a folded player contributed to a pot, When pots are built, Then that player is not eligible for any pot [REQ-018.2]
- [x] #3 Given the shortest all-in player holds the best hand in a three-way all-in, When pots are awarded, Then that player wins only the main pot and the side pot goes to the best hand among its eligible players [REQ-018.3]
- [x] #4 Given a four-way all-in at four different stack sizes with scripted cards, When pots are awarded, Then each pot's winner equals the expected winner from the scripted hand ranks [REQ-018.3]
- [x] #5 Given 100,000 random seeded hands with random stacks, When each hand ends, Then the total chips at the table equal the total before the hand [REQ-018.5]
- [x] #6 Given a sit-and-go hand where seat 3 wins the main pot and a 1,255-chip side pot is tied by seats 2 and 5 with the button at seat 1, When pots are awarded, Then seat 2 receives 628 chips and seat 5 receives 627 chips from the side pot [REQ-019.3, REQ-018.3]
- [x] #7 Given a $29 pot tied three ways by seats 3, 5 and 6 with the button at seat 4, When the pot is awarded, Then the two odd dollars go one each clockwise from left of the button: seat 5 receives $10, seat 6 receives $10 and seat 3 receives $9 [REQ-019.9]
- [x] #8 Given side pots, When the invariant checker runs, Then each eligible seat has contributed at least that pot's level and each pot's amount equals its contribution layer
- [x] #9 Given side pots exist, When tests/engine/review-gaps.acceptance.test.ts runs, Then the folded-contributor test (SPEC-02) still passes for every pot
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
1. Rebuild pots at every round end: one pot per distinct contribution level among live players; eligible = unfolded seats that matched the level.
2. Award each pot separately (main first) with the existing splitPot odd-chip rule.
3. Invariant checker: new P6–P8 (pot count, level eligibility, layer amount), only when side pots exist.
4. Acceptance tests for scripted hands S1–S5 (AC#1–4, 6, 7), folded-contributor checks on side pots, 100k random-stack property test.
5. Locked tests unchanged; 6-max playtest byte-identical.

Full spec: doit/TASK-1.10/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.8 follow-up (doc-16).

AC added from TASK-1.22 follow-up (doc-39).

Autopilot: no asks; assumptions A-1..A-5 in spec.

Build: buildPots per contribution level, per-pot awards via splitPot, payOut sums shares; checker P6–P8; 3 new test files incl. 100k random-stack property test (~2.5 s); locked tests unchanged; playtest identical; gate PASS

Review R1: 0 blocking; MINORs applied in-story (checker case (f) one-pot-many-levels; rename level->matched); gate PASS

Follow-ups (Step 6a): side-pot display already owned by TASK-3.8; NIT shared scan not tracked. Resolves TASK-1.9 A-1.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Side pots are built: one pot per all-in contribution level, each awarded only among the non-folded seats that matched it, odd chips split left of the button. The invariant checker gained P6-P8 pot count, level and layer checks. Verified: npm test 410 passed (engine coverage 99.87%), lint and typecheck clean, 100k-hand property test (~2.7 s), judge 300k-hand oracle fuzz 0 mismatches, playtest byte-identical, CI run 44872609015 green at 9f4594e, judge 13/14 PASS with SPEC-13 being the doc. Review MINORs applied (case (f), rename). Assumptions A-1..A-5 to review (see doc). Follow-up: side-pot display is TASK-3.8 (planned). Resolves TASK-1.9's A-1 single-pot limitation.
<!-- SECTION:FINAL_SUMMARY:END -->
