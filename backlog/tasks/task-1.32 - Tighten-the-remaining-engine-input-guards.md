---
id: TASK-1.32
title: Tighten the remaining engine input guards
status: To Do
assignee: []
created_date: '2026-11-19T04:25:00Z'
updated_date: '2026-11-19T23:33:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.21
references:
  - doc-29
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.21 (doc-29) spec and reviews: a few engine entry points still throw native TypeErrors or echo input of any length. Nothing untrusted reaches them today, but saved sessions and replay-code input will.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given parseCards or evaluate receives a non-array or non-string input, When called, Then it throws RangeError with a message that echoes no input
- [ ] #2 Given createHand receives a null config or non-array seats, When called, Then it throws RangeError('Invalid hand config') instead of TypeError
- [ ] #3 Given an invalid seat, button or replay code longer than 10 characters, When the error is built, Then 'Invalid seat', 'Button must be a dealt-in seat' and 'Invalid replay code' echo at most 10 characters plus '...', and TASK-1.3's locked messages for short inputs stay byte-identical
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
From TASK-1.31 security review (doc-35): restored sessions (TASK-3.10) are the real source of a non-array seats / null config reaching createHand; AC#2 here owns the RangeError('Invalid hand config') guard.
<!-- SECTION:NOTES:END -->
