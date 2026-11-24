---
id: TASK-3.12
title: Record the advice and grade for each of my decisions with the hand
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T19:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.9
  - TASK-7.10
  - TASK-7.15
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: chore
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each of my decisions stored with the advice I was given for it, so that my review and statistics show exactly the advice I would have seen at the moment I acted.

Enabler (user-visible through E08 hints, E09 review and E10/E11). Extends the hand record (E03-S09). For each user decision point the record holds the recommendation (action, rule id), numbers (equity %, required equity %, per-opponent basis), explanation (E07-S12), grade (E07-S04) and a hinted flag. Advice is computed at the decision point with the observed-stats snapshot taken then (E07-S13, REQ-036.2), so the stored values equal what a hint at that moment showed. The hinted flag is false unless a hint was shown for that decision (E08 sets it true).

## Requirements covered
- REQ-052 (Must): Local persistence — TLH Trainer shall store settings, last configuration, sessions, hand records and session reports in the browser's IndexedDB, writing each hand record when its hand ends.

Covers: REQ-052

## Notes
E08: set the hinted flag to true for decisions where the hint card was shown and add the AC for it. E09 and E10 read decisions from these records rather than recomputing.

Plan key: E03-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted hand in which the user made 4 decisions, When its record is read, Then it holds 4 decision entries in order, each with street, the user's action, recommended action, equity %, required equity %, basis, explanation and grade [REQ-052.2]
- [ ] #2 Given a decision computed with an opponent's observed stats at 29 hands that reach 30 hands when the hand ends, When the record is read, Then its recommendation and numbers equal the advice computed from the decision-time snapshot [REQ-052.2]
- [ ] #3 Given a decision made without asking for a hint, When the record is read, Then its hinted flag is false [REQ-052.2]
- [ ] #4 Given a hand in which the user folded preflop at the first decision, When its record is read, Then it holds exactly 1 decision entry with its grade [REQ-052.2]
- [ ] #5 Given a graded decision, When the hand record is saved, Then the stored grade data is decided and documented (full GradeResult or grade, ruleId and marginPts plus a recommendation reference) and round-trips through JSON unchanged
- [ ] #6 Given an observed-stats snapshot built at a decision point that contains a null entry or a seat that is not a whole number from 1 to 6, When advice is computed from it, Then estimateOpponentRanges throws the documented RangeError (never a TypeError) and the bad seat is never silently ignored
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.4 follow-up (doc-19).

AC added from TASK-7.13 follow-up (security MINOR non-object-snapshot-entry-typeerror, doc-104).
<!-- SECTION:NOTES:END -->
