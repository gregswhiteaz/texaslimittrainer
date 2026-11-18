---
id: TASK-3.2
title: Choose only legal actions with their exact amounts
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T22:27:00Z'
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
- [ ] #1 Given it is the user's turn on the flop at $4/$8 with no bet facing, When the action bar is shown, Then it offers exactly Check and "Bet $4" and no Fold [REQ-017.1, REQ-022.1]
- [ ] #2 Given it is the user's turn preflop at $4/$8 facing the $4 big blind, When the action bar is shown, Then it offers exactly Fold, "Call $4" and "Raise to $8" [REQ-017.2, REQ-022.1]
- [ ] #3 Given it is the user's turn on the turn at $4/$8 facing a bet of $8, When the action bar is shown, Then it offers Fold, "Call $8" and "Raise to $16" [REQ-017.2, REQ-022.1]
- [ ] #4 Given the user is the big blind at $4/$8 preflop and every other player has called or folded, When the action bar is shown, Then it offers exactly Check and "Raise to $8" and no Fold [REQ-017.6, REQ-022.1]
- [ ] #5 Given 10,000 seeded table states where it is the user's turn, When the action bar is built, Then the offered actions and amounts equal the engine's legal actions for the user in every state [REQ-017.1, REQ-017.2, REQ-017.6]
- [ ] #6 Given it is a bot's turn or the hand has ended, When the user clicks any action button, Then the buttons are disabled and no action is submitted [REQ-017.5]
- [ ] #7 Given it is the user's turn with focus on the page body, When the keys F, C, R, H, K, B and Space are pressed, Then no action is taken [REQ-022.3]
- [ ] #8 Given the action bar at a 1280 x 720 window, When each action button is measured, Then it is at least 44 x 44 CSS px [REQ-022.4]
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
1. src/table/action-bar.ts (headless): pure function from the user's PlayerView to the bar model — legal actions in engine order with exact labels ('Check', 'Bet $4', 'Fold', 'Call $4', 'Raise to $8'); disabled model of greyed Fold / Call / Raise with no amounts when it isn't the user's turn (Q-1).
2. src/ui/table/ActionBar.tsx: storyboard button style, at least 44x44 CSS px (52 px tall), disabled state, group named 'Your actions', no key handlers; Table.tsx uses it in place of the plain buttons; bar shown from the deal onward, including after the hand ends.
3. e2e/table.spec.ts (TASK-3.1 acceptance test): the three planned edits from spec D-4 only, no assertion removed or weakened.
4. Tests: AC#5 property over 10,000 seeded engine states (bar equals legalActions, other seats disabled); e2e AC#1-4 and 6-8 in Chromium + WebKit (hand-built states for AC#3/AC#4, single-key presses do nothing, button size), axe clean.

Full spec: doit/TASK-3.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cross-story change: e2e/table.spec.ts (TASK-3.1 acceptance test) gets three edits per spec D-4 at the user's Q-1 decision: button names match exact-amount labels, calls clicked by /^Call \$\d+$/, bar present and disabled at hand end. No other TASK-3.1 assertion may be removed or weakened.
<!-- SECTION:NOTES:END -->
