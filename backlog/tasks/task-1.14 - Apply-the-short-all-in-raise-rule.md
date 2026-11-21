---
id: TASK-1.14
title: Allow short all-in bets and raises under the half-bet reopening rule
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T07:52:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.9
  - TASK-1.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-61
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to bet or raise all-in for less than a full bet under the casino half-bet rule, so that betting after an all-in follows the common casino rule.

A player whose stack exceeds the call amount but is smaller than a full bet or raise is offered a bet or raise all-in for their whole stack (REQ-017.7); a stack equal to or below the call amount gives only call (all-in) or fold. An all-in raise of less than half a full bet does not reopen betting for players who have already acted (they may only call or fold); an all-in raise of half a full bet or more counts as a full raise, including toward the cap (REQ-016.5). The engine marks these actions as all-in bet/raise with the to-amount; the button labels 'Bet all-in $X' / 'Raise all-in to $X' are rendered by the Table action bar story that owns REQ-017.7's UI.

## Requirements covered
- REQ-016 (Must): Fixed-limit betting and cap — The engine shall restrict every bet and raise to exactly one small bet on preflop and flop and exactly one big bet on turn and river, and shall cap each street at one bet plus three raises, including when heads-up.
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.

Covers: REQ-016, REQ-017

## Notes
Raise-to after a counted half-bet all-in: the next full raise is one full bet above the all-in amount.

Plan key: E01-S14 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 goes all-in for $5 total (a $1 raise), When action returns to seat 2, Then seat 2 may only call $1 or fold [REQ-016.5]
- [x] #2 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 goes all-in for $6 total (a $2 raise), When action returns to seat 2, Then seat 2 may call, fold or raise to $10 [REQ-016.5]
- [x] #3 Given the flop at $4/$8 where seat 2 bets $4, seat 3 raises to $8, seat 4 goes all-in for $10 total (a $2 raise) and seat 5 raises to $14, When action reaches seat 6, Then seat 6 may only call $14 or fold because the fourth bet has been made [REQ-016.5]
- [x] #4 Given the flop at $4/$8 where seat 2 bets $4 and seat 3 goes all-in for $5 total (a $1 raise), When seat 4, who has not yet acted on the street, is to act, Then seat 4 may fold, call $5 or raise to $8 [REQ-016.5]
- [x] #5 Given the flop at $4/$8 with no bet facing and seat 4 holding $3, When the engine lists seat 4's legal actions, Then they are exactly check and bet all-in $3 [REQ-017.7]
- [x] #6 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 holds $6, When the engine lists seat 4's legal actions, Then they are exactly fold, call $4 and raise all-in to $6, and a raise to $8 is rejected as illegal [REQ-017.7]
- [x] #7 Given the flop at $4/$8 where seat 2 bet $4 and seat 4 holds exactly $4, When the engine lists seat 4's legal actions, Then they are exactly fold and call $4 (all-in) with no raise [REQ-017.7]
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
1. Full bet level derived from the street's action records; a bet/raise counts if it adds at least half a unit over the level.
2. legalActions: bet/raise amount = min(level+unit, contribution+stack); only seats that have not acted may bet/raise; cap counts only counting bets.
3. applyAction: betCount and hasActed reset only for counting bets; currentBet always set.
4. Invariant checker gets its own copy of the rule (size and cap checks).
5. Acceptance tests AC#1–7, unit tests, 20k-hand short-stack property test with checkStep; playtest byte-identical.

Full spec: doit/TASK-1.14/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot: no asks. Rules assumptions to review: A-1 short all-ins measured cumulatively against the last full level; A-3 sub-half all-in bet: unacted seats may complete, checked seats only call/fold.

Build: full-bet level from action records; short all-in bets/raises in legalActions; betCount/hasActed reset only for counting bets; checker's own copy of the rule; 3 new test files (20k-hand property ~0.6 s); playtest identical; gate PASS; no deviations.

Review R1 MINOR: bet-clause exemption now tested (mutant caught); raise-clause exemption is unreachable via legalActions (same derivation) — kept as a guard, not tracked. Gate PASS.

Judge R1 PASS 15/15. Follow-ups (Step 6a): all-in action labels owned by TASK-3.7; LOW J-1-02 and review NIT not tracked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Short all-in bets and raises (REQ-016.5, REQ-017.7): a stack above the call but below a full bet/raise now gets an all-in bet/raise; all-ins adding under half a bet over the last full level don't count toward the cap or reopen betting (already-acted seats may only call/fold); >= half counts as full. Checker updated independently. Verified: npm test 437 passed, lint/typecheck clean, review R1 0 blocking (MINOR checker exemption test added), playtest byte-identical. Review assumptions A-1 (cumulative measurement of short all-ins) and A-3 (completion allowed for unacted seats after a short all-in bet; checkers may only call/fold). Follow-up: all-in action labels belong to TASK-3.7. Scope 759 lines vs 650 budget (warn).
<!-- SECTION:FINAL_SUMMARY:END -->
