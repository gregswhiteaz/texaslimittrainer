---
id: TASK-10.8
title: See my three most costly leaks first
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T08:10:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-10.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-133
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see at most my three biggest leaks ranked by Major errors, so that I focus on the mistakes that cost the most.

When more than one category is a leak, leaks are ordered by number of Major errors (unhinted) descending, then by error rate descending; at most 3 are shown in the report.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.
- REQ-047 (Should): Leak detection — The app shall report a decision category as a leak when, within the session, the user faced it 8 or more times and 40% or more of those unhinted decisions were graded Minor or Major errors.

Covers: REQ-044, REQ-047

Plan key: E10-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given leaks A with 5 Major errors and B with 3 Major errors, When the report is shown, Then A is listed before B [REQ-047.3]
- [x] #2 Given leaks A and B with 4 Major errors each and error rates 50% and 62.5%, When the report is shown, Then B is listed before A [REQ-047.3]
- [x] #3 Given a session with 5 leaks, When the report is shown, Then exactly the 3 highest-ranked leaks are listed [REQ-047.3, REQ-044.5]
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
1. sessionLeaks ranks qualifying leaks by Major count, then error rate (exact integer compare), then more errors, then category data order
2. Cap at 3 shown leaks; no new text, same markup; computed at display time from stored leakCounts (no persisted change)
3. Acceptance + unit tests; docs/stats/leaks.md

Full spec: doit/TASK-10.8/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: sessionLeaks ranks by Major count, exact error rate, more errors, then data order; capped at MAX_SHOWN_LEAKS=3; display-time only, no persisted change. npm test 1333 pass; report e2e 12 pass; gate PASS.

Judge r1 PASS 9/9: sessionLeaks matched an independent reference ranking on 20,000 random leakCounts sets; live Chromium/WebKit report from a 57-hand seeded session showed exactly the top 3 (middle-fold, blinds-fold, flop-facing-a-bet-call) with the Q-1 tie-break. CI 45571688810 green.

Follow-ups: none (one test NIT only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The Session Report now lists at most three leaks, ranked by unhinted Major errors, then error rate, then more errors, then category order. Ranking runs at display time in sessionLeaks, so the stored format is unchanged and older reports are ranked too. Verified by new acceptance and unit tests, npm test and the locked e2e, all passing. Judge round 1 passed 9/9. Please review Q-1 (tie-break: more errors, then category order), Q-2 (no new text) and A-1..A-4. Risks: one NIT in a tie test that cannot isolate the category-order step. Output is correct either way. No follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
