---
id: TASK-1.22
title: Close engine test gaps found in review
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.4
references:
  - doc-7
  - doc-10
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the TASK-1.2 judge (J-1-01) and TASK-1.4 code review: behaviours that are correct today but not pinned by a test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given two seven-card hands that differ only in the third kicker, When compared, Then the hand with the higher third kicker wins (unit example)
- [ ] #2 Given a seat that folds after contributing chips, When pots are built, Then it is not eligible for any pot and its totalContribution is still counted in the pot amounts
- [ ] #3 Given stakes where the small blind equals the big blind, When createHand validates them, Then the boundary behaviour (accept or reject) is pinned by a test matching the documented rule
<!-- AC:END -->
