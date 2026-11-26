---
id: TASK-10.7
title: See how many of my decisions used a hint in the report
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T17:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
  - TASK-3.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-132
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see how many of my decisions were hinted, so that I know how much I leaned on hints during the session.

Report shows hint usage: number of the user's decisions with the hinted flag set and that number as a percentage of all the user's decisions in the session, one decimal (e.g. "40 of 320 decisions (12.5%)"). Read from the hinted flag on E03-S10 decision records (E08 sets it true when the hint card was opened before acting).

## Requirements covered
- REQ-040 (Should): Hinted decisions — When the user requested a hint before acting, the grader shall still grade the decision but shall mark it hinted and exclude it from the major-error rate used for goal G-2.
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.

Covers: REQ-040, REQ-044

Plan key: E10-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a session in which the user made 320 decisions of which 40 were hinted, When its report is shown, Then hint usage shows 40 hinted decisions and "12.5%" [REQ-044.3, REQ-040.4]
- [x] #2 Given a session in which no hint was opened, When its report is shown, Then hint usage shows 0 hinted decisions and "0.0%" [REQ-044.3, REQ-040.4]
- [x] #3 Given a session in which every one of the user's 25 decisions was hinted, When its report is shown, Then hint usage shows 25 hinted decisions and "100.0%" [REQ-044.3, REQ-040.4]
- [x] #4 Given a scripted session, When its report is shown, Then the hinted count equals the number of stored decision records with the hinted flag set [REQ-044.3]
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
1. Count hinted and total user decisions once at session end into a new optional write-once report field hints {hinted, decisions}
2. Validate hints on read; reports without it stay valid and show no tile
3. Show a 4th 'Hints used' tile in Volume and errors: 'N of M decisions (P%)'
4. Tests (unit, UI, storage, e2e) and docs/storage/reports.md

Full spec: doit/TASK-10.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: new optional write-once report field hints {hinted, decisions} counted at session end and validated on read; 4th 'Hints used' tile; key-order unit checks in session-report-errors/leaks tests moved to slice(-4) (not locked). npm test 1329 pass; report e2e 18 pass; gate PASS.

Judge r1 PASS 11/11: live Chromium (15 of 44, 34.1%) and WebKit (13 of 38, 34.2%) tiles matched an independent count from stored records; rounding swept to d=400. CI 45566726961 green.

Follow-ups: TASK-10.16 (literal e2e wording; reject hints without errors).

e2e/report-hints.spec.ts unlocked for TASK-10.16 AC#1 (expected text source only)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a "Hints used" tile to the Session Report ("Volume and errors"), e.g. "40 of 320 decisions (12.5%)". It reads from a new optional write-once `hints {hinted, decisions}` field on the stored report, validated on read and absent on older reports. Verified: npm test 1329 pass, lint/typecheck clean, new unit/acceptance/storage/e2e tests (Chromium and WebKit); judge round 1 PASS 11/11, including an independent production-build run whose tile matched the stored records. Review: Q-1 (separate hints field), Q-2 (tile text and placement) and A-1..A-5 were auto-accepted and need your review. Risks: the e2e takes its expected text from hintTile (wording covered by unit tests); a stored report with hints but no errors shows no tile (never written by the app).
<!-- SECTION:FINAL_SUMMARY:END -->
