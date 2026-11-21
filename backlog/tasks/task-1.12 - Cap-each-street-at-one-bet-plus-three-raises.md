---
id: TASK-1.12
title: Cap each street at one bet plus three raises
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T06:16:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.11
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every street capped at one bet plus three raises, so that betting follows the casino fixed-limit cap.

Cap = 4 bets per street (bet + 3 raises) with any number of players, including heads-up. Preflop the big blind counts as the first bet, so at most three raises follow it. After the fourth bet the only legal actions are call and fold. Once this story is done the playtest seat policy drops its interim 'never make a fifth bet' restriction and relies on the engine's legal set.

## Requirements covered
- REQ-016 (Must): Fixed-limit betting and cap — The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.

Covers: REQ-016

Plan key: E01-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given preflop at $4/$8 with the $4 big blind posted, When three raises have been made (to $16), Then the next players may only call or fold [REQ-016.2, REQ-016.3]
- [ ] #2 Given the flop, turn or river, When a bet and three raises have been made, Then the only legal actions for the remaining players are call and fold [REQ-016.3]
- [ ] #3 Given a heads-up $4/$8 hand where the button posted the $2 small blind and the other player the $4 big blind, When the button raises to $8, the big blind re-raises to $12 and the button raises to $16, Then the big blind's only legal actions are call $4 and fold; Given a heads-up flop where a bet and three raises have been made, Then the only legal actions are call and fold [REQ-016.4]
- [ ] #4 Given 100,000 random seeded hands with 2 to 10 players, When each is played, Then no street has more than 4 bets [REQ-016.4]
- [ ] #5 Given a street with 4 bets, When legalActions and recommendPreflop are both consulted, Then neither offers a raise, and the advice's betCount>=4 rule agrees with the engine cap
- [ ] #6 Given the engine caps a street at 4 bets, When a fifth raise is attempted, Then a unit test shows it is not legal, the invariant checker's bet-cap check stays independent of the engine cap, and the playtest policy's betCount filter is removed
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
1. STREET_BET_CAP = 4 in the engine; legalActions offers no raise at 4 bets (applyAction already rejects illegal actions).
2. Advice uses STREET_BET_CAP; invariant checker keeps its own independent cap.
3. Remove the playtest policy's betCount filter; rework the fifthBet fault fixture.
4. Acceptance tests AC#1–6 incl. heads-up cap and a 100k-hand 2–10-seat run.
5. Q-1: one fixture line in TASK-1.31's chip-safety test (stake only, assertions kept).
6. 6-max playtest byte-identical; e2e action-bar/table pass.

Full spec: doit/TASK-1.12/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.2 follow-up (doc-14).

AC added from TASK-1.8 follow-up (doc-16).

Autopilot Q-1 auto-accepted (qa.md); unlock recorded under TASK-1.31.
<!-- SECTION:NOTES:END -->
