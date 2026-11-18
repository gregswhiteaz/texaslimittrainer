---
id: TASK-7.18
title: Restore equity calculation performance headroom
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-18T19:10:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.1
references:
  - doc-8
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.1: the full-ring equity scenarios run at about 88% of their p95 latency target on the reference Mac, so small regressions will break the target. The global 30 s testTimeout was raised for the slowest equity tests and also loosens every other test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the full-speed equity command (EQUITY_PERF_SCALE=1) on the reference Mac, When it runs, Then every scenario's p95 is at most 75% of its target
- [ ] #2 Given vite.config.ts, When tests run, Then the default per-test timeout applies everywhere except the tests that need longer, which set their own timeout
- [ ] #3 Given postflop advice at a 10-seat flop with 9 opponents, When the advice latency test runs at real targets, Then p95 is at most 75 ms (currently 71.5 ms against 100 ms)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).
<!-- SECTION:NOTES:END -->
