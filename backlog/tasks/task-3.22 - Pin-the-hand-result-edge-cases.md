---
id: TASK-3.22
title: Pin the hand-result edge cases
status: To Do
assignee: []
created_date: '2026-11-19T01:10:00Z'
updated_date: '2026-11-21T02:09:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-3.4
references:
  - doc-25
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
- [ ] #1 Given a high-card hand whose highest card is on the board, When it is named, Then the result reads e.g. 'King high', and a test fails if the first card is named instead of the highest
- [ ] #2 Given the 'Seat <n> is not at the table' throw in src/table/hand-result.ts, When reviewed, Then it is either covered by a test or removed
- [ ] #3 Given a showdown where the user's hand is shown, When the hand result renders, Then 'Your shown cards' lists the user's own two hole cards (src/table/hand-result.ts), and a test fails if another seat's cards are used
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.18 follow-up (doc-50).
<!-- SECTION:NOTES:END -->
