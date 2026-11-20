---
id: TASK-1.10
title: Split the pot into side pots for unequal all-ins
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-20T04:07:00Z'
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
- [ ] #1 Given three players all-in for $10, $30 and $50 with a fourth covering, When pots are built, Then a main pot and two side pots exist, each recording exactly the players who matched it as eligible [REQ-018.2]
- [ ] #2 Given a folded player contributed to a pot, When pots are built, Then that player is not eligible for any pot [REQ-018.2]
- [ ] #3 Given the shortest all-in player holds the best hand in a three-way all-in, When pots are awarded, Then that player wins only the main pot and the side pot goes to the best hand among its eligible players [REQ-018.3]
- [ ] #4 Given a four-way all-in at four different stack sizes with scripted cards, When pots are awarded, Then each pot's winner equals the expected winner from the scripted hand ranks [REQ-018.3]
- [ ] #5 Given 100,000 random seeded hands with random stacks, When each hand ends, Then the total chips at the table equal the total before the hand [REQ-018.5]
- [ ] #6 Given a sit-and-go hand where seat 3 wins the main pot and a 1,255-chip side pot is tied by seats 2 and 5 with the button at seat 1, When pots are awarded, Then seat 2 receives 628 chips and seat 5 receives 627 chips from the side pot [REQ-019.3, REQ-018.3]
- [ ] #7 Given a $29 pot tied three ways by seats 3, 5 and 6 with the button at seat 4, When the pot is awarded, Then the two odd dollars go one each clockwise from left of the button: seat 5 receives $10, seat 6 receives $10 and seat 3 receives $9 [REQ-019.9]
- [ ] #8 Given side pots, When the invariant checker runs, Then each eligible seat has contributed at least that pot's level and each pot's amount equals its contribution layer
- [ ] #9 Given side pots exist, When tests/engine/review-gaps.acceptance.test.ts runs, Then the folded-contributor test (SPEC-02) still passes for every pot
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
AC added from TASK-1.8 follow-up (doc-16).

AC added from TASK-1.22 follow-up (doc-39).
<!-- SECTION:NOTES:END -->
