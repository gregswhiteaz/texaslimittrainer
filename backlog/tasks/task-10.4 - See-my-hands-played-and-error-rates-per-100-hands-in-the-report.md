---
id: TASK-10.4
title: See my hands played and error rates per 100 hands in the report
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T22:21:00Z'
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
parent_task_id: TASK-10
priority: high
type: feature
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my error rates per 100 hands in the report, so that I can tell whether I am making fewer mistakes (G-2).

Report KPI tiles: Hands played; Major errors /100 and Minor errors /100, each = count of the user's unhinted decisions graded Major (or Minor) in the session / hands played x 100, one decimal. Hinted decisions (hinted flag on the E03-S10 decision record; E08 sets it) are excluded from both rates. Values are read from the stored decision records (grade and hinted flag), never recomputed by the advice engine.

## Requirements covered
- REQ-044 (Must): Session Report content — When a session ends, TLH Trainer shall show and save a Session Report with the result, volume, error rates, hint usage, the five tracked style stats against their healthy ranges, and the top leaks.

Covers: REQ-044

Plan key: E10-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 200-hand session with 12 unhinted Major errors and 28 unhinted Minor errors, When its report is shown, Then it shows hands played "200", Major errors /100 "6.0" and Minor errors /100 "14.0" [REQ-044.2]
- [ ] #2 Given a 200-hand session with 12 unhinted and 5 hinted Major errors, When its report is shown, Then Major errors /100 is "6.0" [REQ-044.2]
- [ ] #3 Given a 50-hand session in which every decision was graded Correct, When its report is shown, Then Major errors /100 and Minor errors /100 both show "0.0" [REQ-044.2]
- [ ] #4 Given a scripted 200-hand session, When its report is shown, Then hands played, Major errors /100 and Minor errors /100 each equal the values recomputed from the session's stored hand records [REQ-044.2]
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
1. sessionReport counts the user's unhinted Major/Minor decisions from the session's hand records and stores optional errors {major, minor} once at session end
2. rateTiles(): Hands played, Major errors /100, Minor errors /100 (one decimal, handsPlayed denominator)
3. Report screen: rate tiles in their own row after the cash tiles; old reports without errors show none
4. Tests: unit/acceptance per AC (incl. 200-hand session), render, e2e Chromium+WebKit with axe; docs

Full spec: doit/TASK-10.4/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: report stores unhinted Major/Minor error counts once at session end; rate tiles (Hands played, Major/Minor errors /100); npm test 1291 passed, Playwright 302 passed; gate PASS.
<!-- SECTION:NOTES:END -->
