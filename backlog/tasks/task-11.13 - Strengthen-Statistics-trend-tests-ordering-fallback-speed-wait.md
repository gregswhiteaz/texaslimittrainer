---
id: TASK-11.13
title: Strengthen Statistics trend tests (ordering, fallback, speed wait)
status: To Do
assignee: []
created_date: '2026-11-25T08:57:00Z'
updated_date: '2026-11-25T12:33:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-11.1
references:
  - doc-134
parent_task_id: TASK-11
priority: low
ordinal: 244000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-11.1 code review (doc-134). The AC#2 view test feeds hands already in session order; trends.test.ts cannot tell the earliest-completedAt fallback from latest; tests/support/stat-records.ts exports unused TEMPLATE_DECISIONS; the opt-in speed check stops its timer on DOM presence, not visibility. Only the judge's holdout covered the first two.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given hands supplied in shuffled order across sessions whose start order differs from id order, When the trend view is computed, Then points and totals equal the sorted-order result
- [ ] #2 Given a session with no record whose earliest and latest hand times straddle another session's start, When hands are ordered, Then it orders by its earliest completedAt
- [ ] #3 Given the test support and the opt-in speed check, When read, Then TEMPLATE_DECISIONS is gone and the timer stops when the 6th point is visible
- [ ] #4 Given 1,000+ stored hands and any Table size / Game type filter, When the App renders Statistics, Then a repo test proves the G-2 target is computed from all stored hands (App passes all hands to statisticsView)
- [ ] #5 Given a filter select value that is not a known option id, When it changes, Then it is treated as All; and the unreachable data===undefined guard in App.tsx is removed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ACs added from TASK-11.4 follow-ups (doc-137).
<!-- SECTION:NOTES:END -->
