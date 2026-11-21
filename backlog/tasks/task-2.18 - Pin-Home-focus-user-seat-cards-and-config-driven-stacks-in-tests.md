---
id: TASK-2.18
title: Pin Home focus, user-seat cards and config-driven stacks in tests
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T23:20:00Z'
updated_date: '2026-11-21T02:09:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-2.1
references:
  - doc-23
documentation:
  - doc-50
parent_task_id: TASK-2
priority: low
type: chore
ordinal: 185000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.1 (doc-23) code review: three behaviours are correct today but no test fails if they regress — focus is left alone on first load of Home; the Table shows the user's cards at the configured userSeat (a hard-coded seat 5 mutant survives); stacks come from config.seats rather than DEFAULT_SEATS.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the app's first load, When Home renders, Then focus is not moved to its heading, and a test fails if it is
- [x] #2 Given a SessionConfig whose userSeat is not 5, When the Table renders, Then the user's face-up cards appear at that seat, and a test fails if seat 5 is hard-coded
- [x] #3 Given a SessionConfig whose seats differ from DEFAULT_SEATS in seat numbers, When the table is seated, Then stacks are keyed by config.seats, and a test fails if DEFAULT_SEATS is used
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. e2e/home-first-load.spec.ts: first load leaves focus on body (fails if focus is always moved).
2. tests/ui/user-seat-cards.acceptance.test.tsx: user at seat 1 sees seat 1's real hole cards (fails if seat 5 is hard-coded).
3. tests/table/session-stacks.acceptance.test.ts: seats 1,3,5,7,9 get stacks keyed by config.seats (fails if DEFAULT_SEATS used).
Each proven against its mutant; no src changes.

Full spec: doit/TASK-2.18/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: three new tests (first-load focus e2e, user-seat cards, config-keyed stacks), each proven against its mutant; no src changes; gate PASS

Judge R1 PASS 3/3; each new test fails on its mutant.

Follow-ups (Step 6a): ACs added to TASK-3.22 (showdown 'Your shown cards'), TASK-3.10 (resolveSessionConfig consistency), TASK-2.2 (unused TABLE_SIZE_NAMES).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added three test-only files pinning TASK-2.1 behaviours: Home first load leaves focus on body (Playwright), the user's face-up cards come from the configured user seat, and seatSession stacks follow config.seats. Each test fails on its named mutant and passes on current code; no src changes. Verified: npm test 367 passed, lint/typecheck clean, review and Judge round 1 had no findings. Assumptions A-1..A-4 (Playwright for focus, seat-5 mutant location, seats 1/3/5/7/9, 500 ms wait) to review. Follow-ups: showdown 'Your shown cards' test (TASK-3.22), resolveSessionConfig partial merge (TASK-3.10 AC#5 partly), unused TABLE_SIZE_NAMES (no owner).
<!-- SECTION:FINAL_SUMMARY:END -->
