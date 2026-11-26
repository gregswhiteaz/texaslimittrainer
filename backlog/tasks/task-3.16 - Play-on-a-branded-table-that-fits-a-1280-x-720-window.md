---
id: TASK-3.16
title: Play on a branded table that fits a 1280 x 720 window
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T13:03:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.3
  - TASK-3.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: medium
type: feature
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the Table screen to fit a 1280 x 720 window in the TLH dark theme, so that the table looks calm and on-brand and I never scroll sideways to see the action.

Table screen layout per the Table storyboard: oval green felt seen from above, seats around the rail, user at bottom centre, board and pot in the middle, action bar along the bottom. Theme: charcoal backgrounds, red primary accent, navy and silver secondary colours, green felt (logo on Splash, Home and app icon is E02/E13). Money and language formatting is E03-S19; felt and chip art is E04.

## Requirements covered
- REQ-060 (Should): Compatibility and look — TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.

Covers: REQ-060

Plan key: E03-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 10-seat table at a 1280 x 720 window in Chromium and WebKit, When any street of a hand is shown, Then the page has no horizontal scrolling and every seat, the board, the pot and the action bar are fully visible [REQ-060.1]
- [ ] #2 Given the Table screen, When its computed styles are checked, Then the page background is the theme's charcoal, the felt base colour is #2F6B4F, the primary action accent is red #D7262E and secondary elements use navy #1F3A6E or silver #C9CED6 [REQ-060.3]
- [ ] #3 Given the Table styling, When the action bar is styled, Then the decision on which action button (if any) carries the red primary accent is recorded and applied, keeping the learner from being nudged toward one action
- [ ] #4 Given the action bar moves below the felt, When it renders, Then its group keeps the accessible name 'Your actions' (or e2e/table.spec.ts and e2e/action-bar.spec.ts are updated together), the helpers duplicated between those two specs move to e2e/support/, and the unreachable '?? ""' fallback in checkOrCall is removed
- [ ] #5 Given a 10-seat table at 1280x720, When it renders, Then every seat fits without overlap or horizontal scroll using slotPosition, and the e2e locator helpers (e2e/support/table-locators.ts) and the helpers duplicated across table specs live in one module
- [ ] #6 Given the branded table, When a hand ends, Then the result is shown on the felt as in the Review storyboard, and the duplicated e2e helpers (installPausedClock, runFor1000, axeWithPausedClock, nextTurnPaused, countReplayDraws) live in e2e/support/
- [ ] #7 Given the Hand Review panel is open at 1280x720, When the Table screen is shown, Then the table, the open panel, the result and Deal next hand all fit without vertical scrolling, the table keeps the same width when the panel opens and closes, and the helpers copied into e2e/review.spec.ts live in e2e/support/
- [ ] #8 Given a 10-player table (TASK-2.2), When it is shown in a 1280 x 720 window, Then all 10 seats with names, stacks and position labels are visible without overlap or sideways scrolling
- [ ] #9 Given a side-pot hand result (title plus Pot winners, Winners and Shown hands rows) at 1280x720 in Chromium and WebKit, When it is shown with Deal next hand, Then the whole block and the button are visible without vertical scrolling
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
AC added from TASK-3.2 follow-up (doc-22).

AC added from TASK-3.2 follow-up (doc-22).

AC added from TASK-3.3 follow-up (doc-24).

AC added from TASK-3.4 follow-up (doc-25).

AC added from TASK-9.1 follow-up (doc-26).

AC added from TASK-2.2 follow-up (10 seats may look crowded)

AC added from TASK-3.26 follow-up (judge J-1-01, doc-162)
<!-- SECTION:NOTES:END -->
