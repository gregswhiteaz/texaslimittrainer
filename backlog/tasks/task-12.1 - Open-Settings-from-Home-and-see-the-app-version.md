---
id: TASK-12.1
title: Open Settings from Home and see the app version
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-27T10:49:00Z'
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
  - doc-141
parent_task_id: TASK-12
priority: high
type: feature
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to open the Settings screen from Home, so that I can find every trainer option and check which version I am running.

Adds the Settings entry to Home (Home = E02-S01; E11 adds Statistics) and the Settings screen (Settings storyboard: '← Home' back control, sections Play, Display, Your data, version line). This slice creates the local settings store (IndexedDB, created with defaults on first launch: default speed Rapid, auto-open Hand Review on, show opponent styles on, four-colour deck off, bot banter on) that every later toggle writes and that E02-S11 already reads for the default speed. The screen shows 'Version <x>' where <x> is the build's app version (package.json version injected at build time); E13 reuses the same string for 'Updated to version <x>'. Toggles are added by E12-S02, S04..S07; Reset all data by E12-S08; the storage warning by E12-S09. All controls are native form fields or buttons, at least 44 x 44 CSS px. Each default is verified by the story that builds its control (E12-S02, S04, S05, S06, S07 AC1).

## Requirements covered
- REQ-002 (Must): Home screen menu — The Home screen shall offer New game, Statistics and Settings, and shall offer Resume session only while a paused session exists.
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-002, REQ-050, REQ-057, REQ-061

## Notes
The storyboard's 'Show amounts as Dollars / Big bets' row is NOT a requirement (waiting room, Q-61 not selected): do not build it. Keep the settings store in the place E13 versions (REQ-054).

Plan key: E12-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Home screen, When it is shown, Then it offers a Settings entry; When the user chooses Settings, Then the Settings screen opens [REQ-002.3, REQ-050.5]
- [x] #2 Given a build whose app version is 1.2.0, When the Settings screen is shown, Then it shows "Version 1.2.0" [REQ-050.6]
- [x] #3 Given the Settings screen opened from Home, When the user chooses the back control, Then the Home screen opens [REQ-050.5]
- [x] #4 Given the Settings screen at 1280 x 720, When the user presses Tab repeatedly, Then focus reaches every Settings control, each is a native button, link or form field, each activates with Enter or Space, and each is at least 44 x 44 CSS px [REQ-057.2, REQ-057.4]
- [x] #5 Given the Settings screen and any Settings dialog are added, When the play-money check runs (e2e/play-money.spec.ts, tests/ui/screen-list.acceptance.test.ts), Then they are registered in e2e/support/screen-list.ts, visited by the walk, and the dialog detector also recognises role written as a JSX expression (e.g. role={'dialog'})
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 axe reports zero serious or critical violations on the Settings screen in Chromium and WebKit [REQ-057.1]
- [x] #2 The Settings screen offers no deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-061.1]
- [x] #3 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #4 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #5 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #6 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #7 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #8 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #9 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #10 No new network requests beyond the app's own files [REQ-058.1]
- [x] #11 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #12 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #13 Story documentation is written and published to Backlog.md
- [x] #14 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Settings entry on Home (last, subtitle 'Speed, display, reset data') and a settings route with '← Home'
2. Settings screen: Play, Display and Your data headings, storyboard paragraph, version line from a Vite define (Version 0.0.0)
3. Database v4 adds a settings store with the defaults record; read-only readSettings() with validation
4. Register in the play-money walk; update locked Home/resume/route/play-money tests (Q-5); e2e DB helpers open v4

Full spec: doit/TASK-12.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.15 follow-up (doc-124).

Build: Settings entry and screen (Play / Display / Your data, Version 0.0.0 via Vite define); DB v4 adds a settings store with defaults (additive; tested upgrade from v3 with data); readSettings(); play-money walk visits Settings; locked Home/resume/route/play-money tests (Q-5) and session-end/home-control store lists (Block 1) re-pinned. gate PASS.

Judge r1 PASS 17/17: real upgrade test — main build created a v3 DB with played hands, a report and a paused session; this build upgraded it to v4 with hands/sessions/reports byte-identical and the raw settings record equal to the defaults; Resume and Statistics still work; Settings sections, Version 0.0.0, focus, play-money walk, axe; full e2e 332 pass. CI 45647646463 green.

Follow-ups: TASK-12.10 (raw-record test, onblocked handling, back-control Tab order); ACs added to TASK-12.5 (write API) and TASK-2.11 (read default speed).

Locked e2e/settings.spec.ts unlocked for TASK-12.2 Q-2 (control list gains the opponent-styles checkbox; 44x44 check unchanged).

Locked e2e/settings.spec.ts Tab-order expectation re-pinned by TASK-12.10 (autopilot Q-2).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Home now has a Settings entry (last) opening a Settings screen with Play, Display and Your data sections and a Version line from package.json (0.0.0). It also creates the settings store: DB v4 with a defaults record, added by the upgrade step with existing data untouched. The play-money walk and screen list include Settings, and the dialog detector reads role={'dialog'}. Verified: npm test 1397 passed, full e2e 332 passed, judge PASS 17/17 including a real v3 to v4 upgrade with played data byte-identical. Review: Q-1 persisted format, Q-2..Q-4 text and version, Q-5 + Block 1 locked-test edits, A-1..A-8. Follow-ups: assert the raw record in the upgrade test, Chromium first Tab leaves the page (back control before h1), no onblocked handler, nothing reads settings yet (TASK-2.11 / 12.5).
<!-- SECTION:FINAL_SUMMARY:END -->
