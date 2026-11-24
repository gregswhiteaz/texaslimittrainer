---
id: TASK-2.15
title: Practise with play money only
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-24T19:27:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
  - doc-124
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want every screen to deal only in play money, so that I can never be asked to deposit, pay or wager real money while training.

App-wide check, moved out of the stake story. An automated Playwright check visits every screen and dialog registered in the app's screen list (at M2: Home, Game Config, Table, Rebuy / Leave table dialog, Session Report; later epics register Statistics, Settings and their dialogs) and fails if any text or control offers a deposit, payment, purchase, cash-out, real-money wager or real-money conversion. A bundle scan confirms no payment library, Payment Request API use or payment-provider URL ships with the app. The check runs in CI with the rest of the test suite, and fails when any route or dialog in the built app is missing from the screen list, so later screens cannot escape the check.

## Requirements covered
- REQ-006 (Must): Stakes and blinds — For cash games, the Game Config screen shall offer exactly the stakes $2/$4, $3/$6, $4/$8, $6/$12, $10/$20 and $20/$40, and the engine shall post blinds of half the small bet rounded down to a whole dollar (small blind) and the small bet (big blind).
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-006, REQ-061

## Notes
E11/E12/E13: register Statistics, Settings and any new dialogs in the screen list the check visits.

Plan key: E02-S14 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given every screen and dialog registered in the app, When the play-money check visits each one in CI, Then none shows text or a control offering a deposit, payment, purchase, cash-out, real-money wager or real-money conversion [REQ-006.3, REQ-061.1]
- [x] #2 Given the built app, When the play-money check compares its screen list with every route and dialog component in the app, Then the check fails naming any route or dialog that is not in the list [REQ-006.3, REQ-061.1]
- [x] #3 Given the built bundle and package.json, When they are scanned, Then they contain no payment library, no use of the Payment Request API and no payment-provider URL [REQ-061.1]
- [x] #4 Given a test fixture screen that shows a "Deposit" control, When the play-money check runs against it, Then the check fails and names that screen [REQ-006.3]
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
1. e2e/support/screen-list.ts (home, game-config, end-session-dialog, table, bust-dialog, ending, session-report) and play-money.ts matchers (real-money phrase list, whole words, poker words never flagged alone)
2. e2e/play-money.spec.ts: one walk per browser through every listed screen/dialog (bust seed), Deposit fixture fails naming its screen, dist + package.json payment scan
3. tests/ui/screen-list.acceptance.test.ts: app routes (Screen type) and dialog components vs the list, failing by name both ways; unit tests for matchers; docs

Full spec: doit/TASK-2.15/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: screen list + play-money walk (all screens/dialogs, ~1 s per browser), Deposit fixture, dist/package.json payment scan, source-vs-list check; no src changes; npm test 1259 passed, Playwright 290 passed; gate PASS.

Judge r1 PASS 8/8; injected offers on every screen/dialog, new route/dialog and payment code/package all caught by name; no false positives on 200+ app strings; CI 45468942933 green.

Follow-ups: TASK-12.1 and TASK-11.1 ACs added (register Settings/Statistics in the play-money screen list; JSX role detector). Not tracked (test plumbing, no failure): duplicated attribute list, 'real money' disclaimer NIT, package-lock.json scan (dist scan covers shipped code).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a play-money check, test-only with no src change. An e2e walk visits every screen and dialog (home, config, end-session dialog, table, bust dialog, ending, report) in Chromium and WebKit and fails on any deposit, payment, purchase, cash-out or real-money offer. A Vitest comparison fails when an App screen or dialog is missing from e2e/support/screen-list.ts. A scan of dist/ and package.json finds no payment library, Payment Request API or provider URL. A Deposit fixture proves the failure names the screen. Verified: npm test 1259 passed, e2e 6/6, judge round 1 PASS 8/8, with mutation proof per screen. Review these assumptions: A-1 phrase list and A-2..A-8, plus the hand-14 call deviation (all auto-accepted). Follow-ups: the dialog detector misses role={'dialog'}, the attribute list is duplicated, 'real money' would flag a future disclaimer, package-lock.json is not scanned, and Statistics and Settings must be registered by E11 and E12.
<!-- SECTION:FINAL_SUMMARY:END -->
