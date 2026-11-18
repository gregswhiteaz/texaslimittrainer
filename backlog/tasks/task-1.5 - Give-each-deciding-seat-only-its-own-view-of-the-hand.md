---
id: TASK-1.5
title: Give each deciding seat only its own view of the hand
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T06:52:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-13
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want opponents to decide using only what they could see at the table, so that bots never cheat by seeing my cards or the next card.

The engine passes any deciding code (bots, playtest seat policies, later the advice engine) a PlayerView: own hole cards, the board, all actions and stacks, the legal actions with exact amounts, and cards shown at earlier showdowns; never other players' hole cards or undealt cards. Separation is type-level: decision APIs accept only PlayerView.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.

Covers: REQ-025

## Notes
Hints and grades using the user's view (REQ-025.2/025.3) are E07.

Plan key: E01-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a hand in progress, When the engine asks a seat to act, Then it passes a PlayerView with that seat's hole cards, the board, all actions, all stacks and cards shown at earlier showdowns, and no other player's hole cards or undealt cards [REQ-025.1]
- [x] #2 Given a fixed decision point, When the other players' hole cards and the undealt deck are changed, Then the PlayerView is deep-equal to the original and a seeded seat policy returns the same action [REQ-025.1]
- [x] #3 Given decision code that is passed the full game state instead of a PlayerView, When `npm run typecheck` runs, Then it reports a type error [REQ-025.1]
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
1. src/engine/player-view.ts: PlayerView/PublicPlayer/ShownHand/EarlierShowdown types, SeatPolicy (sync).
2. playerView(state, seat, earlierShowdowns=[]): field-by-field copy of public info + own hole cards + legalActions when to act; never other hole cards, burns, deck or replay code.
3. actWith(state, policy, earlierShowdowns): engine asks the acting seat via its view; typed errors passed through.
4. showdownOf(completedState): earlier-showdown entry or null.
5. Tests: acceptance (AC#1-3 incl. sandboxed typecheck that HandState isn't accepted by a policy), 300-hand hidden-card rotation property test, unit tests.

Full spec: doit/TASK-1.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: src/engine/player-view.ts (PlayerView/PublicPlayer/ShownHand/EarlierShowdown/SeatPolicy; playerView, actWith, showdownOf); acceptance (incl. sandboxed typecheck), 300-hand hidden-card property test, unit tests; hand.ts unchanged; gate PASS.

CI run 44253680537 (head 080f4ac): success first try. Judge round 1: PASS 10/10, no findings; 17 holdout mutants all caught; player-view.ts 100% line coverage; e2e bot-via-SeatPolicy scenario 50 hands, chips conserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added src/engine/player-view.ts: a plain-data PlayerView (own hole cards, board, actions, stacks, pots, legal actions and earlier showdowns; no other hole cards, deck, burned cards or result), playerView(state, seat, earlierShowdowns), actWith(state, policy) and showdownOf. hand.ts is unchanged. Per user decisions Q-1 (plain-data view) and Q-2 (caller passes earlierShowdowns). Verified: AC#1 exact-view acceptance test, AC#2 property test over 300 seeded hands, AC#3 sandboxed typecheck probe; lint, typecheck and npm test pass (2 gate runs); review round 1 clean (code reviewer's 14 mutants all caught). Judge and CI pending. Review assumptions A-1..A-7 in the story doc, especially A-3 (earlierShowdowns shared by reference) and A-4 (non-acting seats get legalActions []). Risks and follow-ups: showdownOf relies on TASK-1.15 to exclude mucked cards (add a test there); consider freezing earlierShowdowns entries; the four spec section 11 concerns (seat identity across hands, replay vs bot memory, game type/SNG level in HandConfig, keeping E06/E07 bots on SeatPolicy) are not created as tasks.
<!-- SECTION:FINAL_SUMMARY:END -->
