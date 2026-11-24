---
id: TASK-10.1
title: End the session with Leave table and see its saved report with my cash result
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T18:02:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.3
  - TASK-3.11
  - TASK-3.9
  - TASK-3.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-122
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to end my session with Leave table so that its Session Report opens with my result, so that I know how the session went the moment I stop playing.

Leave table exists in the Table header (E03-S03) and in the bust dialog (E03-S08). Between hands (no hand in progress, including while the Hand Review panel is open after a hand), Leave table ends the session immediately and opens the Session Report screen (layout per the Report storyboard: header line with game type, players, stake and hands; KPI tiles; style section; leaks section). This slice creates the report record and shows the cash result: Result in $ = final stack minus everything bought in (initial buy-in of 20 big bets plus every rebuy, from the session's rebuy count, E03-S08/E03-S11), shown with sign (e.g. +$46); BB/100 = (result in big bets of the session's stake) / hands played x 100, one decimal with sign; number of rebuys. The report is built from the stored hand records and session record (E03-S09, E03-S11) and saved to IndexedDB when the session ends; like hand records it is never modified after it is written (REQ-052.5). An ended session is no longer a paused session. A session with 0 completed hands ends without a report and is not stored (whatever path ends it: Leave table, or E02's New game confirm on a paused session). Error rates, hint usage, style stats, leaks and playing time are added by E10-S02..S10; the sit-and-go result is E10-S11; Statistics and Home controls on the report are E11 (REQ-044.6); reopening the stored report from the Home snapshot is E02 (REQ-003.2).

## Requirements covered
- REQ-004 (Must): Pause, resume and end a session — When the user goes Home or closes the app during a session, TLH Trainer shall keep that session as a paused session that can be resumed at the start of the next hand; when the user chooses Leave table, it shall end the session and open the Session Report.
- REQ-007 (Must): Cash game buy-in and rebuy — In a cash game, every player shall start with a fixed buy-in of 20 big bets; when the user's stack reaches zero, TLH Trainer shall ask the user to Rebuy (another 20 big bets) or Leave table before the next hand.
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-004, REQ-007, REQ-044, REQ-052

## Notes
Expose a report builder (session id -> report values) usable by E02's New game confirm (REQ-004.4 saves the paused session's report), E11 (Statistics) and E05 (sit-and-go result). Mid-hand Leave table (dialog, auto-fold) is E10-S05.

Plan key: E10-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a $4/$8 cash session between hands, When the user chooses Leave table in the header, Then the session ends, no further hand is dealt and the Session Report for that session opens [REQ-004.5]
- [x] #2 Given the bust dialog after the user's stack reached $0, When the user chooses Leave table, Then the Session Report for that session opens [REQ-004.5]
- [x] #3 Given a $4/$8 cash session of 214 hands with 1 rebuy that ends with a final stack of $366, When its report is shown, Then it shows Result "+$46", BB/100 "+2.7" and rebuys "1" [REQ-007.3, REQ-044.1]
- [x] #4 Given a $4/$8 cash session of 100 hands with no rebuys that ends with a final stack of $120, When its report is shown, Then it shows Result "-$40", BB/100 "-5.0" and rebuys "0" [REQ-044.1]
- [x] #5 Given a session has ended and its report was shown, When the app is closed and relaunched, Then the stored report for that session holds the same values and no paused session exists for it [REQ-044.7]
- [x] #6 Given a stored session report, When later sessions are played and ended, Then the stored report is byte-identical and a second write for the same session id is rejected [REQ-044.7, REQ-052.5]
- [x] #7 Given a session with 0 completed hands (the app was closed during hand 1), When that session is ended, Then no Session Report opens and neither the session nor a report is stored [REQ-044.8]
- [x] #8 Given the Hand Review panel is open after hand 12 of a cash session, When the user chooses Leave table, Then no dialog is shown, no hand 13 is dealt and the Session Report opens showing hands played "12" [REQ-004.5]
- [x] #9 Given the Table header's Leave table control, When it is chosen, Then App's onLeave handler ends the session and opens the Session Report instead of returning straight to Home (replacing the TASK-3.3 interim behaviour)
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
1. Storage: DB v3 adds a write-once reports store; endSession writes the report and the session's endedAt in one transaction; 0-hand sessions are removed with no report
2. Report model from the stored session record: header line, cash block (Result, BB/100, Rebuys); sit-and-go shows the header only
3. Leave table (also mid-hand, bust dialog, Continue) ends the session and opens the Session Report screen (h1 focused, Back to Home); busy state while ending; failure logs and opens Home
4. Re-pin five locked e2e tests (TASK-3.11, 9.2, 2.6, 3.4, 2.14) to the new behaviour; move e2e storage helpers to v3
5. Tests: unit, render, e2e report flows in Chromium and WebKit with axe

Full spec: doit/TASK-10.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.3 follow-up (doc-24).

Build: DB v3 reports store (write-once) + endSession transaction; Session Report screen (Result/BB100/Rebuys, Back to Home); Leave table ends the session (also mid-hand, bust dialog, Continue); five locked e2e re-pinned per D-4; npm test 1244 passed, Playwright 268 passed; gate PASS.

Judge r1 PASS 14/14; live Leave paths in Chromium+WebKit, report values match stored hand records, v2→v3 upgrade keeps data, ordering attacks held; CI 45453088617 green. Review took 3 rounds (orchestrator-added race fix, then its guard regression; both covered by e2e that fail on the old code).

Follow-ups: none new. Already owned: mid-hand Leave dialog (TASK-10.2), record-based report sections (TASK-10.4), hint counts (TASK-10.7), View statistics (TASK-11.6). Not tracked: duplicated private validation helpers (refactor, no behaviour change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Leave table (header and bust dialog) now ends the session: waits for the last hand write, then in one transaction saves endedAt and a write-once report (new reports store, DB v3), and opens the Session Report screen with header line, Result, BB/100 and Rebuys plus Back to Home. 0-hand sessions are deleted with no report. Verified: judge round 1 PASS 14/14, 3 review rounds (race fix for Leave vs last write, retry-after-failed-end hang fixed), 7 gate runs green. Review: Q-1..Q-3 (reports store v3, mid-hand Leave ends the session, Back to Home), five re-pinned locked e2e tests (D-4), build notes, assumptions A-1..A-9. Follow-ups: TASK-10.2 (mid-hand dialog), 10.4 (record-based sections), 11.6 (View statistics), 10.7 (hints), duplicated validation helpers in session-report.ts; scope over budget (1572 lines / 28 files vs 1300 / 23).
<!-- SECTION:FINAL_SUMMARY:END -->
