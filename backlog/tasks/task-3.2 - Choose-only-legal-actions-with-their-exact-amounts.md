---
id: TASK-3.2
title: Choose only legal actions with their exact amounts
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T22:48:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-3.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-22
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want an action bar that offers only my legal actions labelled with their exact amounts, so that I learn the fixed-limit betting structure and can never make an illegal move.

When no bet faces the user: Check and Bet $<small or big bet>, no Fold (Q-45). Preflop in an unraised pot the big blind is offered Check and "Raise to $8" (at $4/$8), no Fold (REQ-017.6). When a bet faces the user: Fold, Call $<amount> and Raise to $<amount>. Bet and raise sizes follow fixed-limit rules ($4 preflop and flop, $8 turn and river at $4/$8). The bar is disabled while it is not the user's turn. Actions are taken by mouse or touch only: no single-key keyboard shortcuts. Each action button is at least 44 x 44 CSS px. The offered set must always equal the engine's legal set. Capped streets and all-in labels (including short all-in bets and raises, REQ-017.7) are E03-S06. Replaces the plain buttons of the tracer E03-S01. The 44 x 44 px check for action buttons lives here; E03-S17 measures the other Table controls.

## Requirements covered
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.
- REQ-022 (Must): Action bar — When it is the user's turn, the Table screen shall show an action bar of buttons labelled with the action and its exact amount, plus a Hint button, operated by mouse or touch.

Covers: REQ-017, REQ-022

Plan key: E03-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given it is the user's turn on the flop at $4/$8 with no bet facing, When the action bar is shown, Then it offers exactly Check and "Bet $4" and no Fold [REQ-017.1, REQ-022.1]
- [x] #2 Given it is the user's turn preflop at $4/$8 facing the $4 big blind, When the action bar is shown, Then it offers exactly Fold, "Call $4" and "Raise to $8" [REQ-017.2, REQ-022.1]
- [x] #3 Given it is the user's turn on the turn at $4/$8 facing a bet of $8, When the action bar is shown, Then it offers Fold, "Call $8" and "Raise to $16" [REQ-017.2, REQ-022.1]
- [x] #4 Given the user is the big blind at $4/$8 preflop and every other player has called or folded, When the action bar is shown, Then it offers exactly Check and "Raise to $8" and no Fold [REQ-017.6, REQ-022.1]
- [x] #5 Given 10,000 seeded table states where it is the user's turn, When the action bar is built, Then the offered actions and amounts equal the engine's legal actions for the user in every state [REQ-017.1, REQ-017.2, REQ-017.6]
- [x] #6 Given it is a bot's turn or the hand has ended, When the user clicks any action button, Then the buttons are disabled and no action is submitted [REQ-017.5]
- [x] #7 Given it is the user's turn with focus on the page body, When the keys F, C, R, H, K, B and Space are pressed, Then no action is taken [REQ-022.3]
- [x] #8 Given the action bar at a 1280 x 720 window, When each action button is measured, Then it is at least 44 x 44 CSS px [REQ-022.4]
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
1. src/table/action-bar.ts (headless): pure function from the user's PlayerView to the bar model — legal actions in engine order with exact labels ('Check', 'Bet $4', 'Fold', 'Call $4', 'Raise to $8'); disabled model of greyed Fold / Call / Raise with no amounts when it isn't the user's turn (Q-1).
2. src/ui/table/ActionBar.tsx: storyboard button style, at least 44x44 CSS px (52 px tall), disabled state, group named 'Your actions', no key handlers; Table.tsx uses it in place of the plain buttons; bar shown from the deal onward, including after the hand ends.
3. e2e/table.spec.ts (TASK-3.1 acceptance test): the three planned edits from spec D-4 only, no assertion removed or weakened.
4. Tests: AC#5 property over 10,000 seeded engine states (bar equals legalActions, other seats disabled); e2e AC#1-4 and 6-8 in Chromium + WebKit (hand-built states for AC#3/AC#4, single-key presses do nothing, button size), axe clean.

Full spec: doit/TASK-3.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cross-story change: e2e/table.spec.ts (TASK-3.1 acceptance test) gets three edits per spec D-4 at the user's Q-1 decision: button names match exact-amount labels, calls clicked by /^Call \$\d+$/, bar present and disabled at hand end. No other TASK-3.1 assertion may be removed or weakened.

Build: src/table/action-bar.ts (headless bar model, exact labels, idle greyed Fold/Call/Raise per Q-1), src/ui/table/ActionBar.tsx, Table uses it; styles .action-bar 52 px; e2e/table.spec.ts three D-4 edits only; e2e 46 passed (Chromium + WebKit); playtest 0 violations; gate PASS. Orchestrator decision (A-7, test technique, reversible): axe scans at a bot's turn run with worker-backed real timers while the page clock is paused, then assert the paused state was unchanged.

CI run 44413273045 (head 9bfb87d): success first push. Judge round 1: PASS 18/18, no findings; 25,004-decision own property; 14 seeded hands per browser matched an independent replay at every user turn; force-clicks, DOM re-enables and 15+ single keys did nothing; Tab+Enter/Space work; axe clean at user turn, bot turn and hand over; e2e/table.spec.ts differs from main only by the three D-4 edits. Follow-ups (Step 6a): ACs added to TASK-3.16 (primary accent decision; keep 'Your actions', move duplicated e2e helpers, drop checkOrCall fallback), TASK-3.7 (all-in labels, wider property; DOM re-enable test), TASK-8.1 (Hint only on enabled bar). No new tasks needed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced TASK-3.1's plain verb buttons with an action bar built from a pure headless model of the user's PlayerView: on the user's turn only the engine's legal actions with exact amounts (Check, Bet $4, Fold, Call $4, Raise to $8), native buttons 52 px tall. Off-turn and after the hand it stays on screen as greyed Fold/Call/Raise with no amounts (user decision Q-1, supersedes TASK-3.1 D-3). Verified: npm test 222 passed (10,000-state label=legalActions property), e2e 46 passed in Chromium and WebKit with axe, playtest 10,000 hands 0 violations, gates PASS, review r1 clean (mutants caught). Judge and CI pending. Review assumptions A-1..A-7 (no Hint button: TASK-8.1; no red accent: TASK-3.16; e2e/table.spec.ts edited in exactly three D-4 places; axe at bot turn uses worker-backed timers). Screenshots: doit/TASK-3.2/bar-turn.png, bar-waiting.png. Follow-ups: TASK-3.16, 3.7, 8.1 items in the doc, plus two NITs.
<!-- SECTION:FINAL_SUMMARY:END -->
