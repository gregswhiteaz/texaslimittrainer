---
id: TASK-3.12
title: Record the advice and grade for each of my decisions with the hand
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T09:39:00Z'
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
  - doc-113
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
- [x] #1 Given a scripted hand in which the user made 4 decisions, When its record is read, Then it holds 4 decision entries in order, each with street, the user's action, recommended action, equity %, required equity %, basis, explanation and grade [REQ-052.2]
- [x] #2 Given a decision computed with an opponent's observed stats at 29 hands that reach 30 hands when the hand ends, When the record is read, Then its recommendation and numbers equal the advice computed from the decision-time snapshot [REQ-052.2]
- [x] #3 Given a decision made without asking for a hint, When the record is read, Then its hinted flag is false [REQ-052.2]
- [x] #4 Given a hand in which the user folded preflop at the first decision, When its record is read, Then it holds exactly 1 decision entry with its grade [REQ-052.2]
- [x] #5 Given a graded decision, When the hand record is saved, Then the stored grade data is decided and documented (full GradeResult or grade, ruleId and marginPts plus a recommendation reference) and round-trips through JSON unchanged
- [x] #6 Given an observed-stats snapshot built at a decision point that contains a null entry or a seat that is not a whole number from 1 to 10 (the table seat bound), When advice is computed from it, Then estimateOpponentRanges throws the documented RangeError (never a TypeError) and the bad seat is never silently ignored
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
1. Hand record gains a decisions list: one compact entry per user decision (street, action, recommendation, rule, basis, equity numbers, per-opponent basis, explanation, grade, hinted), computed at hand end from each decision's view and decision-time snapshot with the hint worker's options (userAdviceOptions shared)
2. parseHandRecord validates decisions (cross-checked against the user's non-blind actions, size limits); records without decisions are rejected
3. observedBySeat: null entry or seat outside 1-10 → RangeError
4. One-line re-pin of locked hand-records acceptance test (TASK-3.9)
5. Tests for each AC incl. the 29→30-hand snapshot case

Full spec: doit/TASK-3.12/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.4 follow-up (doc-19).

AC added from TASK-7.13 follow-up (security MINOR non-object-snapshot-entry-typeerror, doc-104).

AC#6 reworded per TASK-3.12 Q-2 (auto-accepted): snapshot seats 1-10, matching the 10-seat table bound.

Build: hand records store one decision entry per user decision (advice + grade = hint, ACTION_RANGE_ADVICE, decision-time snapshot), parseHandRecord validation incl. cross-check, observedBySeat rejects null entries and seats outside 1-10; npm test 1179 passed, 10k --check-advice 0 mismatches; gate PASS. Block 1 resolved (SPEC-01/05 expected values corrected to the hint's options).

Judge r1 PASS 12/12; real app: 44 stored decisions equal the built advice worker; 10k playtest byte-identical to main; CI 45364289815 green.

Follow-ups: TASK-9.3 AC added (review reads stored decisions, plain text, SHOWDOWN fixture); TASK-13.6 AC added (migrate pre-TASK-3.12 records). Already owned: snapshot supply (TASK-8.1). Not tracked: two code NITs (no behaviour change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Each user decision is now stored in the hand record (`decisions`) with recommendation, rule id, equity %, required equity %, per-opponent basis, explanation, grade and a hinted flag (false by default). Advice is computed at hand end from each decision's stored view and decision-time snapshot with the same options as the hint worker, so stored = hint. parseHandRecord validates and cross-checks decisions against actions; estimateOpponentRanges now throws RangeError on bad snapshot entries (seats 1-10).
Verification: judge round 1 PASS 12/12; npm test 1179 passed; playwright 214 passed; 44/44 live decisions equal the built advice worker; playtest 10,000 hands identical to main, 0 advice mismatches; CI green after fixing an e2e fixture.
Review: Q-1..Q-4, assumptions A-1..A-7, the AC#6 reword (seats 1-10), the Block 1 expected-value correction and cross-story locked edits (TASK-3.9, TASK-1.55) were auto-accepted.
Follow-ups: storyboard SHOWDOWN fixture lacks decisions (LOW); snapshots not supplied until TASK-8.1; E09 review should read stored decisions and render text as plain text; old records without decisions are rejected (REQ-054 migration). Full details in doc-113.
<!-- SECTION:FINAL_SUMMARY:END -->
