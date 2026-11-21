---
id: TASK-3.22
title: Pin the hand-result edge cases
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T01:10:00Z'
updated_date: '2026-11-21T02:25:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-3.4
references:
  - doc-25
documentation:
  - doc-51
parent_task_id: TASK-3
priority: low
type: chore
ordinal: 187000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-3.4 (doc-25) code review: the only high-card example lists its highest card first, so naming the first card would also pass; hand-result.ts:83 throws 'Seat <n> is not at the table', which the spec doesn't list, no test covers, and can't currently happen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a high-card hand whose highest card is on the board, When it is named, Then the result reads e.g. 'King high', and a test fails if the first card is named instead of the highest
- [x] #2 Given the 'Seat <n> is not at the table' throw in src/table/hand-result.ts, When reviewed, Then it is either covered by a test or removed
- [x] #3 Given a showdown where the user's hand is shown, When the hand result renders, Then 'Your shown cards' lists the user's own two hole cards (src/table/hand-result.ts), and a test fails if another seat's cards are used
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. hand-result-edges test: 'King high' when the highest card is on the board; the 'Seat n is not at the table' RangeError is covered.
2. user-shown-cards test: user at seat 3 among shown seats 1,2,3,5 sees exactly Ac Ad.
Each proven against its mutants; no src changes.

Full spec: doit/TASK-3.22/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.18 follow-up (doc-50).

Build: hand-result edge tests ('King high', seat-not-at-table throw) and user-shown-cards test, each proven against its mutants; no src changes; gate PASS

Judge R1 PASS 3/3; all 7 mutants caught by their own tests.

Follow-ups (Step 6a): none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added two test files pinning three hand-result edge cases: King high from a board card, the 'Seat <n> is not at the table' RangeError, and 'Your shown cards' showing the user's own hole cards. No src changes. Each test was shown to fail on named mutants. Gate and judge passed (370 tests passed, 6 skipped). Assumptions to review: A-1 (cover the throw, don't remove it), A-2 (seat-3 user crafted showdown), A-3 (9c 2d on Ks Jd 6c 4h 3s). One NIT, not tracked: the throw test calls the function twice, intentionally. No follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
