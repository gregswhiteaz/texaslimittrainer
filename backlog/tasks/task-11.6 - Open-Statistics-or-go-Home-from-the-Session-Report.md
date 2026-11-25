---
id: TASK-11.6
title: Open Statistics or go Home from the Session Report
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T14:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.1
  - TASK-11.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-139
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to go from my Session Report to Statistics or back to Home, so that I can put this session in context or start the next one.

The Session Report (E10-S01, Report storyboard) gets two controls at the bottom: 'View statistics' and 'Back to Home'. The report has already been saved when it is shown; leaving it does not change it.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.

Covers: REQ-044

## Notes
E02-S16 (M3) reopens stored reports from the Home snapshot through the same report screen, so both controls appear there too.

Plan key: E11-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a Session Report is shown, When its controls are listed, Then they include View statistics and Back to Home [REQ-044.6]
- [x] #2 Given a Session Report is shown, When the user chooses View statistics, Then the Statistics screen opens with its totals including the session just ended [REQ-044.6]
- [x] #3 Given a Session Report is shown after Leave table, When the user chooses Back to Home, Then Home opens without Resume session for that session [REQ-044.6]
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
1. ReportScreen gets optional onStatistics; 'View statistics' (outline) before 'Back to Home' in a right-aligned actions row
2. App hoists one openStatistics() (reset All / All / Every 500 hands) used by Home and the report
3. Unit render test plus e2e through the real App: report -> Statistics (totals include the session just ended) -> Home, and report -> Home
4. docs/ui/navigation.md

Full spec: doit/TASK-11.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-10.1 Q-3 adds a Back to Home button on the Session Report; this task then only needs View statistics.

Build: optional onStatistics on ReportScreen; 'View statistics' before 'Back to Home' in a right-aligned row; one App openStatistics() for Home and the report. Report/Statistics/Home e2e 44 pass; gate PASS.

Judge r1 PASS 8/8: production preview Chromium/WebKit — played sessions; View statistics opens All/All/Every 500 hands with totals including the session just ended (matched IndexedDB count); Back to Home and ← Home show no Resume; filters reset after earlier non-default visits; axe clean. CI 45630090023 green (incl. Linux WebKit).

Follow-ups: TASK-11.15 (WebKit Tab-order robustness, redundant unit block).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a View statistics button to the Session Report, in a right-aligned row before Back to Home. It opens Statistics with default filters, and the totals include the session that just ended. Back to Home is unchanged. One shared openStatistics() in App, and an optional onStatistics prop so no locked test was edited. Verified: npm test 1383 passed, 94% coverage, e2e in Chromium and WebKit, CI green, judge PASS 8/8. Assumptions A-1..A-3 and Q-1/Q-2 need review. Follow-ups: fix the WebKit Alt+Tab comment and test (J-1-01), and remove a redundant placement block in the new unit test.
<!-- SECTION:FINAL_SUMMARY:END -->
