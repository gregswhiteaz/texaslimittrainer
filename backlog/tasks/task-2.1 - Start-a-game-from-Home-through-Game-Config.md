---
id: TASK-2.1
title: Start a game from Home through Game Config
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T23:14:00Z'
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
  - doc-23
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
- [x] #1 Given the app is launched, When loading completes, Then the Home screen opens and shows the TLH logo image and the name "TLH Trainer" [REQ-002.1]
- [x] #2 Given the Home screen, When the logo image is loaded, Then it is the bundled logo derived only by resizing from brand/tlh-logo.jpg (the same file the card back uses), and drawn at 64x64 it matches brand/tlh-logo.jpg within an average of 4 per colour channel [REQ-061.3]
- [x] #3 Given the Home screen is shown, When its colours are measured, Then the page background is charcoal #0E0F12 and the New game control uses the red primary accent #D7262E [REQ-060.3]
- [x] #4 Given the Home screen, When the user chooses New game, Then the Game Config screen opens and no session is started [REQ-002.2]
- [x] #5 Given Game Config on first use, When the user chooses Start game, Then the Table opens a cash game with the user and five TAG bots at $4/$8 and the first hand is dealt [REQ-006.1]
- [x] #6 Given Game Config starts a session, When the Table receives it, Then SessionConfig carries game type, number of players, line-up, speed, seat and button as well as the stake
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
1. src/table/session.ts: full SessionConfig (gameType, players, stake, lineUp 'Custom', seats, speed, userSeat, button) with DEFAULT_SESSION_CONFIG; seatSession, Table and useTableSession take Partial<SessionConfig> over the defaults; user seat and button routed through the config.
2. src/ui/App.tsx: three in-app screens (Home, Game Config, Table) in state, page load opens Home, no router or history entries; focus moves to each new screen's h1.
3. src/ui/home/Home.tsx: logo (src/assets/tlh-logo.jpg, the card-back file) and 'TLH Trainer', red New game; src/ui/config/GameConfig.tsx: read-only Session and Opponents panels, Cancel and red Start game (Q-4); src/ui/table/TableScreen.tsx wraps the table.
4. Theme: charcoal #0E0F12, text #F2F3F5, accent #D7262E with white text; system-ui font (no web font).
5. Cross-story test edits (Q-3): New game then Start game clicks in e2e/table.spec.ts and e2e/action-bar.spec.ts; tests/ui/table.acceptance.test.tsx renders TableScreen; tests/unit/app.test.tsx expects Home.
6. Tests: e2e/home.spec.ts (logo hash and 64x64 match, colours, navigation, no session before Start game, first hand dealt, axe) in Chromium + WebKit; SessionConfig unit tests.

Full spec: doit/TASK-2.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.1 follow-up (doc-21).

AC#2 reworded 2026-11-18 by user decision (TASK-2.1 Q-1): the logo may be a resized-only derivative of brand/tlh-logo.jpg (src/assets/tlh-logo.jpg, 512 px, shared with the card back) instead of byte-identical.

Cross-story change (user Q-3): exactly four test edits listed in spec §4 — e2e/table.spec.ts and e2e/action-bar.spec.ts add New game then Start game in openApp; tests/ui/table.acceptance.test.tsx renders TableScreen with DEFAULT_SESSION_CONFIG instead of App; tests/unit/app.test.tsx rewritten for Home. No other assertion in those files may be removed or weakened.

Build: full SessionConfig with defaults (Q-2); App screens Home -> Game Config -> Table; HomeScreen (logo = src/assets/tlh-logo.jpg, red New game), GameConfigScreen (read-only, Q-4), TableScreen; useHeadingFocus (tabIndex -1 only while focusing, keeps TASK-3.1's plain h1); charcoal theme; four cross-story test edits only (Q-3); e2e 60/60 Chromium + WebKit; playtest 0 violations; ~918 lines vs 700 (warn); gate PASS. Screenshots: doit/TASK-2.1/home.png, config.png.

CI run 44418379341 (head 954a0b6): success first push. Judge round 1: PASS 17/17, no blocking; full flow in Chromium + WebKit; logo mean diff 0.78/2.63 (limit 4); colours measured exact; Config text matches Q-4; user at seat 1 with button 1 played 40 hands correctly; only the four Q-3 test edits vs main; 5 mutants caught. Follow-ups (Step 6a): created TASK-2.18 (Home first-load focus, user-seat cards, config-driven stacks tests); ACs added to TASK-2.2 (player selector writes config; size labels), TASK-2.13 (random seat/button into config), TASK-2.14 (browser Back/Forward), TASK-3.10 (assertSessionConfig, REQ-025). Skipped: Table Home control (TASK-2.14's own purpose), Home right column (TASK-2.16/2.17's own purpose), other Game Config selectors (TASK-2.3/2.4/2.5/2.11's own purpose).

Locked e2e test unlocked for TASK-1.52 Q-1 (user-approved; clock-advance only).

Locked test(s) edited for TASK-2.2 Q-5 (user-approved): dropdown counts after adding the players select.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Home, Game Config and the Table are now three in-app screens: the app opens on Home (logo, TLH Trainer, red New game), New game shows the fixed first-use session read-only, Start game deals the first hand. SessionConfig grew to the full plain-data shape (Q-2) and the table honours its seats, button and user seat. Verified: lint, typecheck and npm test pass (228 passed, 1 skipped); npm run e2e 60 passed (Chromium and WebKit); playtest 10000 hands 0 violations; review round 1 had no blocking findings; Judge and CI are pending. Assumptions A-1..A-11 are in the story doc for review. AC#2 was reworded at the user's Q-1 decision (logo is a resized-only derivative shared with the card back). User-visible: another hand now needs reload, New game, Start game until TASK-2.14. Risks and follow-ups: shallow Partial merge can give an inconsistent config (validate on first stored-config load, TASK-2.6/3.10); size 956 lines / 18 files against 700 / 16 (warn); selectors, random seat, Back behaviour and Home column follow-ups are listed in the doc.
<!-- SECTION:FINAL_SUMMARY:END -->
