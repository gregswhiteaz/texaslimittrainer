---
id: TASK-1.46
title: Stop local timing tests flaking under heavy load
status: To Do
assignee: []
created_date: '2026-11-20T06:02:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.35
references:
  - doc-42
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seen in TASK-1.35 (judge J-1-01 and the build): wall-clock assertions failed under parallel load on the Mac — tests/advice/equity.test.ts 'bounds the work when range sets cannot all be dealt' (2092 ms vs 2000 ms), hand-evaluator.perf and invariants.perf once each — then passed on rerun. CI already skips wall-clock checks (TASK-1.20). Flaky local gates slow every doit run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a full local npm test while other heavy processes run (load average well above the core count), When the timing assertions run, Then they do not fail spuriously (e.g. run perf files serially, measure CPU time, or widen local limits with a documented margin)
- [ ] #2 Given a real 2x slowdown in one of those hot paths, When the timing tests run locally, Then they still fail
<!-- AC:END -->
