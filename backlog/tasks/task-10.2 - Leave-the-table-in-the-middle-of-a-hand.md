---
id: TASK-10.2
title: Leave the table in the middle of a hand
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T19:44:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to leave the table during a hand after confirming that my hand will be folded, so that I can stop at any moment without corrupting my session record.

Leave table while a hand is in progress (from the hand's deal until its result is shown) opens a dialog with the text "Leave now? Your hand will be folded." and Confirm / Cancel. On cancel play continues exactly as before. On confirm the user's hand is folded immediately, even when another player is to act (if the user still holds cards and is not all-in); this forced fold is not graded and is not counted in error rates or leaks, the remaining players play the hand to completion with no further user input, the hand is recorded like any completed hand (E03-S09/S10, counted in the session's hands and statistics), the session state is saved, and then the session ends and its Session Report opens (E10-S01). No further hand is dealt. Between hands Leave table needs no dialog (E10-S01).

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.

Covers: REQ-004

Plan key: E10-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand in progress, When the user chooses Leave table, Then a dialog shows "Leave now? Your hand will be folded." and no action is taken for the user while it is open [REQ-004.7]
- [ ] #2 Given the leave dialog during hand 25, When the user cancels, Then the dialog closes, the user still holds the same cards and stack and the hand continues with the same player to act [REQ-004.7]
- [ ] #3 Given the leave dialog during hand 25 while the user holds cards, When the user confirms, Then the user's hand is folded, the remaining players play hand 25 to completion without user input and no hand 26 is dealt [REQ-004.7]
- [ ] #4 Given the user confirmed leaving during hand 25, When hand 25 completes, Then hand 25's record is stored, the session ends and its Session Report opens showing hands played "25" [REQ-004.7, REQ-004.5]
- [ ] #5 Given the user confirmed leaving while all-in during hand 25, When the hand completes, Then the user's cards stay in to showdown, any pot the user wins is awarded and included in the report's result [REQ-004.7]
- [ ] #6 Given a cash session whose user confirms leaving during hand 1, When hand 1 completes, Then a report with hands played "1" is shown and stored [REQ-004.7]
- [ ] #7 Given the leave dialog during hand 25 while a bot is to act and the user holds cards, When the user confirms, Then the user's hand is folded at once before that bot acts [REQ-004.8]
- [ ] #8 Given the user confirmed leaving during hand 25, When hand 25's record and the session report are read, Then the forced fold has no grade and is not counted in Major errors /100, Minor errors /100, hint usage or any leak category [REQ-004.8]
- [ ] #9 Given Leave table is chosen in the middle of a hand, When onLeave would run, Then the dialog 'Leave now? Your hand will be folded.' is shown first (REQ-004.7)
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
1. Leave table during a dealt hand with no result opens a modal LeaveDialog (Cancel focused, Escape = Cancel) and freezes play
2. Confirm: forceFold folds the user at once; bots play the hand out; it is graded and stored with forcedFold: true (no decision entry); then onLeave ends the session via TASK-10.1's path
3. Between hands Leave behaves as before; header controls disabled while leaving
4. Register LeaveDialog in the play-money screen list and walk; re-pin locked table-display mid-hand leave
5. Tests: engine forceFold units, record parse with forcedFold, e2e Cancel/Confirm/all-in/already-folded flows in Chromium and WebKit with axe

Full spec: doit/TASK-10.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.3 follow-up (doc-24).
<!-- SECTION:NOTES:END -->
