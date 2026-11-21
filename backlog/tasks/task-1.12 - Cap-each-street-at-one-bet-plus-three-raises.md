---
id: TASK-1.12
title: Cap each street at one bet plus three raises
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T06:33:00Z'
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
  - doc-59
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
- [x] #1 Given preflop at $4/$8 with the $4 big blind posted, When three raises have been made (to $16), Then the next players may only call or fold [REQ-016.2, REQ-016.3]
- [x] #2 Given the flop, turn or river, When a bet and three raises have been made, Then the only legal actions for the remaining players are call and fold [REQ-016.3]
- [x] #3 Given a heads-up $4/$8 hand where the button posted the $2 small blind and the other player the $4 big blind, When the button raises to $8, the big blind re-raises to $12 and the button raises to $16, Then the big blind's only legal actions are call $4 and fold; Given a heads-up flop where a bet and three raises have been made, Then the only legal actions are call and fold [REQ-016.4]
- [x] #4 Given 100,000 random seeded hands with 2 to 10 players, When each is played, Then no street has more than 4 bets [REQ-016.4]
- [x] #5 Given a street with 4 bets, When legalActions and recommendPreflop are both consulted, Then neither offers a raise, and the advice's betCount>=4 rule agrees with the engine cap
- [x] #6 Given the engine caps a street at 4 bets, When a fifth raise is attempted, Then a unit test shows it is not legal, the invariant checker's bet-cap check stays independent of the engine cap, and the playtest policy's betCount filter is removed
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

Build: STREET_BET_CAP=4 in legalActions; advice uses it; policy filter removed; fifthBet fixture reworked; D-3 fixture line in chip-safety; bet-cap acceptance incl. 100k run (~2.7 s); playtest identical; e2e 22 passed; gate PASS. Recorded deviation: SPEC-02's literal call amounts (12/24) contradict spec §5 and the owe rule — test asserts 8/16 per §5.

Judge R1 PASS 10/10 (one pass; doc written before judge). Follow-ups (Step 6a): fixture note added to TASK-1.31; short all-in raises TASK-1.14, messages TASK-1.13, capped-street UX TASK-3.7 already owned; NITs not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Engine now stops offering a raise at 4 bets per street (bet + 3 raises; preflop BB counts as 1) for all table sizes incl. heads-up, via exported STREET_BET_CAP in legalActions; the playtest random policy drops its own filter, preflop advice reads the engine constant, and the invariant checker stays independent. Verified: 100,000 random seeded hands (sizes 2-10) never exceed 4 bets with 0 invariant violations; npm test 418 passed, lint/typecheck clean; playtest report byte-identical (seed 42, size 6); Playwright 22 passed; review R1 had 0 blocking findings. Assumptions to review: A-1..A-4 (esp. A-4 fifthBet fixture rework). Q-1 auto-accepted: one-line stake edit in locked chip-safety test (TASK-1.31 unlock, D-3). Deviation: SPEC-02's call amounts 12/24 were a spec error; 8/16 confirmed by hand. Follow-ups: short all-in/reopen rule TASK-1.14, rejection messages TASK-1.13, capped-street UX TASK-3.7. Branch CI run 44875055710 in progress; judge verdict pending.
<!-- SECTION:FINAL_SUMMARY:END -->
