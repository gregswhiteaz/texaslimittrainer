---
id: TASK-2.1
title: Start a game from Home through Game Config
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T21:33:00Z'
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
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to start a game from the Home screen, so that every practice session begins from one clear entry point.

Walking-skeleton slice that puts Home and a minimal Game Config in front of the default table opened by E03-S01. When the app has loaded it opens Home, which shows the TLH logo (the user-supplied asset brand/tlh-logo.jpg, bundled unchanged) and the name "TLH Trainer". Home offers New game (Statistics and Settings entries are added by E11/E12; Resume session by E02-S08). New game opens the Game Config screen. In this slice Game Config shows the fixed default session (Cash game, 6 players, $4/$8, five TAG bots) with Start game and Cancel/Home; the selectors arrive in E02-S02..S07 and S11. Start game builds the session configuration and hands it to the Table (E03-S01), which deals the first hand. Theme per REQ-060.3: charcoal background, red primary accent.

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-060 (Should): Compatibility and look — TLH Trainer shall run and install as a PWA in the latest two major versions of Chrome and Safari on macOS at window sizes of 1280 × 720 and larger, using the branded dark theme.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-006, REQ-060, REQ-061

## Notes
Build the session-configuration object here (game type, players, stake, line-up, speed, later user seat and button) so later stories only add fields. E03-S01's direct-to-table start is replaced by this flow. Game Config also offers Cancel (back to Home, nothing stored) per the Config storyboard; it is navigation, not a requirement clause.

Plan key: E02-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the app is launched, When loading completes, Then the Home screen opens and shows the TLH logo image and the name "TLH Trainer" [REQ-002.1]
- [ ] #2 Given the Home screen, When the logo image is loaded, Then its bytes are identical to brand/tlh-logo.jpg [REQ-061.3]
- [ ] #3 Given the Home screen is shown, When its colours are measured, Then the page background is charcoal #0E0F12 and the New game control uses the red primary accent #D7262E [REQ-060.3]
- [ ] #4 Given the Home screen, When the user chooses New game, Then the Game Config screen opens and no session is started [REQ-002.2]
- [ ] #5 Given Game Config on first use, When the user chooses Start game, Then the Table opens a cash game with the user and five TAG bots at $4/$8 and the first hand is dealt [REQ-006.1]
- [ ] #6 Given Game Config starts a session, When the Table receives it, Then SessionConfig carries game type, number of players, line-up, speed, seat and button as well as the stake
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
AC added from TASK-3.1 follow-up (doc-21).
<!-- SECTION:NOTES:END -->
