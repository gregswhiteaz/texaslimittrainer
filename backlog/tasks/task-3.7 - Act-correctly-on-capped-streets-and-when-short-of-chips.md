---
id: TASK-3.7
title: Act correctly on capped streets and when short of chips
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T18:34:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.2
  - TASK-1.12
  - TASK-1.9
  - TASK-1.16
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the action bar to reflect a capped street or a short stack, so that I always see exactly the options the rules allow.

Extends the action bar (E03-S02). When the street is capped (4 bets), Raise is not offered. When the user's stack is smaller than the call amount, Call is labelled "Call all-in $<stack>" and Raise is not offered. When the stack exceeds the call amount but is smaller than a full bet or raise, the bar offers "Bet all-in $X" (no bet facing) or "Raise all-in to $X" (bet facing) (REQ-017.7); whether a short all-in reopens betting for players who already acted follows REQ-016.5 (engine, E01-S12): under half a full bet does not reopen. In a sit-and-go, amounts are chip numbers without $ (e.g. "Call 40"). Engine support: cap E01-S10, all-in E01-S12, sit-and-go game type E01-S16.

## Requirements covered
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.
- REQ-022 (Must): Action bar — When it is the user's turn, the Table screen shall show an action bar of buttons labelled with the action and its exact amount, plus a Hint button, operated by mouse or touch.

Covers: REQ-017, REQ-022

Plan key: E03-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the user faces the fourth bet on the flop at $4/$8, When the action bar is shown, Then it offers exactly Fold and "Call $4" and no Raise [REQ-017.2, REQ-022.1]
- [ ] #2 Given the user has $3 and faces a $4 bet, When the action bar is shown, Then it offers Fold and "Call all-in $3" and no Raise [REQ-017.3, REQ-022.1]
- [ ] #3 Given the user has exactly $4 and faces a $4 bet, When the action bar is shown, Then it offers Fold, "Call $4" and no Raise [REQ-017.3]
- [ ] #4 Given a sit-and-go hand where the user faces a bet of 40 chips, When the action bar is shown, Then the labels read "Call 40" and "Raise to 80" with no $ sign [REQ-022.1]
- [ ] #5 Given 100,000 seeded states covering capped streets and short stacks at table sizes 2-10, When the action bar is built, Then the offered actions and amounts equal the engine's legal set in every state [REQ-017.2, REQ-017.3, REQ-017.7]
- [ ] #6 Given the user has $6 with nothing in the pot this street and faces a $4 bet on the flop at $4/$8, When the action bar is shown, Then it offers exactly Fold, "Call $4" and "Raise all-in to $6" [REQ-017.7, REQ-022.1]
- [ ] #7 Given the user has $3 with no bet facing on the flop at $4/$8, When the action bar is shown, Then it offers exactly Check and "Bet all-in $3" and no Fold [REQ-017.7, REQ-022.1]
- [ ] #8 Given the user bet $4 on the flop and a bot then raises all-in to $5 (less than half a full raise) and the others call, When the action returns to the user, Then the bar offers Fold and "Call $1" and no Raise [REQ-017.7]
- [ ] #9 Given capped streets and short stacks, When the action bar is built, Then actionLabel shows 'Call all-in $X', 'Bet all-in $X' and 'Raise all-in to $X' (and chip labels without '$' in sit-and-go), and the TASK-3.2 legalActions property is widened to capped and short-stack states
- [ ] #10 Given an idle action-bar button whose disabled attribute is removed in the DOM, When it is clicked, Then a test shows the table state is unchanged
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
1. Export fullBetTarget(state) from the engine (no rule change); legalActions uses it.
2. Action bar: actionLabel(action, {allIn, unit}), isShortAllIn(view, action), actionBar(view, unit) — all-in wording; chip labels without $; plain digits (Q-2).
3. New action-bar-limits acceptance property: 100k seeded states, 2–10 seats, short stacks, chip stakes, bar == engine legal set (Q-1; TASK-3.2 file untouched).
4. Browser scenes for capped / call all-in / raise all-in / bet all-in; stripped-disabled click leaves state unchanged (Chromium + WebKit).
5. 10k-hand playtest unchanged.

Full spec: doit/TASK-3.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.2 follow-up (doc-22).

AC added from TASK-3.2 follow-up (doc-22).

Autopilot Q-1/Q-2 auto-accepted (qa.md).

Build: fullBetTarget exported (no rule change); action bar all-in labels + chip unit; 4 new test files incl. 100k-state property (~0.9 s) and e2e scenes; npm run e2e 120 passed; playtest byte-identical; gate PASS; no deviations.
<!-- SECTION:NOTES:END -->
