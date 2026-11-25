---
id: TASK-13.1
title: Return Home from an unexpected error without losing completed hands
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T17:54:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.6
  - TASK-3.10
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-13
priority: high
type: feature
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want an error screen with Return Home when something unexpected breaks, so that I can recover and continue my session from the last completed hand.

A top-level error boundary plus window error / unhandledrejection handlers catch unexpected errors on any screen and show an error screen with a short message and a Return Home button (no stack traces). Completed hands are already stored before the next deal (REQ-052.1, E03-S09) and session state after each hand (E03-S11). Return Home leaves the session paused, so Home shows Resume session; resuming starts the hand after the last completed one with stacks as at its end, exactly like closing the app mid-hand (REQ-004.2). The unfinished hand is not stored. Tests use a test build with an error-injection hook (e.g. throw during a bot action or while rendering the Session Report).

## Requirements covered
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-057 (Should): Accessibility and usability — Every screen shall meet WCAG 2.1 AA contrast and control-labelling rules, and every grade or status shown in colour shall also be shown as text.

Covers: REQ-056, REQ-057

## Notes
E10-S01 discards 0-hand sessions: an error during hand 1 leaves no Resume entry.

Plan key: E13-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a test build that throws an unexpected error during a bot action in hand 15, When the error occurs, Then an error screen with a message and a Return Home button replaces the table [REQ-056.3]
- [x] #2 Given the error screen after an error in hand 15, When the user chooses Return Home, Then Home opens and shows Resume session with hands played 14 [REQ-056.3]
- [x] #3 Given the user returned Home after an error in hand 15, When the user chooses Resume session, Then hand 15 is dealt fresh with every stack as at the end of hand 14 and hand records 1 to 14 are all stored and unchanged [REQ-056.3]
- [x] #4 Given a test build that throws while the Session Report screen renders, When the error occurs, Then the error screen with Return Home is shown and Return Home opens Home [REQ-056.3]
- [x] #5 Given the error screen is shown, When its text is read, Then it contains no stack trace or source file names and Return Home is a native button reachable with Tab [REQ-056.3, REQ-057.2]
- [x] #6 Given the advice worker fails (error/messageerror or a rejected bot decision), When the table is waiting on it, Then the unexpected-error path shows and Return Home works without losing completed hands
- [x] #7 Given the shared advice worker has failed, When the user returns Home and starts a new game, Then a fresh worker is created and bots act normally without a page reload
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
1. AppRoot error boundary above App, also catching window error and unhandledrejection; ErrorScreen with approved wording and Return Home
2. Return Home remounts App on Home (heading focused); session left as stored after its last completed hand, so Resume works; nothing written or sent
3. sharedAdviceClient replaces a failed worker
4. Faults injected only from Playwright init scripts; new e2e through the built App (mid-session, worker, report mount)

Full spec: doit/TASK-13.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.6 follow-up (worker failure has no UI yet)

AC added from TASK-3.6 judge J-1-01 (shared worker stays failed)

Build: AppRoot error boundary + window error/unhandledrejection listeners; ErrorScreen (approved text) with Return Home remounting App on Home; session left after last completed hand (Resume works); sharedAdviceClient replaces a failed worker; faults only via Playwright init scripts (dist has no hook). Full e2e 350 pass; gate PASS.

Judge r1 FAIL only on SPEC-13 (doc said a hand-1 error leaves a 0-hand session not offered for Resume; the app offers it) — doc corrected; r2 PASS. Real-app runs in Chromium/WebKit: mid-hand error after 3 hands kept exactly hands 1-3, Resume dealt Hand #4; worker failure recovered with hints working; report-mount failure handled; second error shown again; Back does not return to the dead table. Full e2e 350 pass. CI 45665415993 green.
<!-- SECTION:NOTES:END -->
