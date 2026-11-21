---
id: TASK-2.3
title: Choose the stake for a cash game
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T16:58:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to choose the stake for a cash game, so that I can practise at the limits I expect to play.

Cash games only. The stake list is exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20, $20/$40, default $4/$8 on first use. Blinds: small blind = half the small bet rounded down to a whole dollar, big blind = the small bet ($2/$4 -> $1/$2; $3/$6 -> $1/$3; $4/$8 -> $2/$4; $6/$12 -> $3/$6; $10/$20 -> $5/$10; $20/$40 -> $10/$20). The buy-in is shown read-only as 20 x the big bet (E03 applies it, REQ-007.1). All money is play money: the stake selector and buy-in offer no deposit, payment or real-money conversion. The app-wide no-real-money check is E02-S14.

## Requirements covered
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.

Covers: REQ-006, REQ-007

Plan key: E02-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config with Cash game chosen, When the stake options are listed, Then they are exactly $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and $4/$8 is selected on first use [REQ-006.1]
- [ ] #2 Given each of the six stakes, When the engine posts blinds, Then the small and big blinds are $1/$2, $1/$3, $2/$4, $3/$6, $5/$10 and $10/$20 respectively [REQ-006.2]
- [ ] #3 Given $10/$20 chosen, When the user starts the game, Then the header shows $10/$20, the first hand's blinds are $5 and $10 and every starting stack is $400 [REQ-006.1, REQ-006.2]
- [ ] #4 Given Game Config with $3/$6 chosen, When the buy-in is shown, Then it reads $120 and offers no control to change it [REQ-007.1]
- [ ] #5 Given Game Config with each of the six stakes selected, When its stake and buy-in text and controls are inspected, Then none offers a deposit, payment, purchase, cash-out or real-money conversion [REQ-006.3]
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
1. CASH_STAKES list (six stakes) in src/table/session.ts.
2. Game Config: Stakes row becomes a native select (Q-1), $4/$8 default; Buy-in text follows the stake (20 big bets).
3. Blinds/buy-in/header already scale via stakesFor/buyIn — prove per stake.
4. Q-2: amend locked TASK-2.1 home test extraction (one select allowed; values unchanged).
5. New e2e stake-choice spec (Chromium + WebKit, axe, no money wording).

Full spec: doit/TASK-2.3/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot Q-1/Q-2 auto-accepted (qa.md); unlock recorded under TASK-2.1.

Build: CASH_STAKES; Game Config stake select + buy-in text follows stake; D-2 locked-test edit; 3 new test files incl. e2e stake-choice (6/6), npm run e2e 110 passed; gate PASS. Recorded deviation: select styled with appearance:none + inline SVG chevron because WebKit ignored min-height (44 px target, SPEC-09).
<!-- SECTION:NOTES:END -->
