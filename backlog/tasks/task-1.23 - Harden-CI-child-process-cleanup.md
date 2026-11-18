---
id: TASK-1.23
title: Harden CI child-process cleanup
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.19
  - TASK-1.20
references:
  - doc-11
  - doc-12
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the TASK-1.19 and TASK-1.20 reviews. In rare cases a hung or unkillable child process can outlive its test or attempt, wasting up to the 13-minute step backstop or leaving orphans on a runner.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given tools/ci/retry.js times out an attempt and both SIGTERM and SIGKILL to the process group fail with EPERM, When the kill grace expires, Then the attempt ends at once with an ::error:: line naming the step instead of waiting for the step timeout
- [ ] #2 Given tests/ci/retry.sudo.test.ts fails or throws partway, When the test ends, Then any sudo sleep it started is killed (cleanup in finally)
- [ ] #3 Given the nested Vitest run in tests/ci/speed-limits.acceptance.test.ts exceeds its timeout, When it is stopped, Then the nested Vitest process and its children are killed, not only npx
<!-- AC:END -->
