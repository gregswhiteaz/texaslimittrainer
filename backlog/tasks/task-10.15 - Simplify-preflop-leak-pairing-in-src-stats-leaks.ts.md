---
id: TASK-10.15
title: Simplify preflop leak pairing in src/stats/leaks.ts
status: To Do
assignee: []
created_date: '2026-11-25T06:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.6
references:
  - doc-131
parent_task_id: TASK-10
priority: low
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.6 code review (doc-131). handCategoryDecisions recomputes the dealt-in seat list and the user's position group for every paired preflop decision though they are fixed per hand, and its user-non-blind-action check duplicates userMade in src/table/hand-record.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand with several user preflop decisions, When handCategoryDecisions runs, Then the seat list and user position group are computed once per hand and every existing leak test still passes unchanged
- [ ] #2 Given the user's non-blind action filter, When leaks.ts pairs decisions, Then it reuses the hand-record helper instead of a copy, with the same results
<!-- AC:END -->
