---
id: TASK-1.23
title: Harden CI child-process cleanup
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-19T02:48:00Z'
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
- [ ] #4 Given retry.js times out an attempt whose command runs apt-get under sudo, When it stops the attempt, Then the root apt-get is really stopped (e.g. sudo -n kill on the process group) so it cannot keep holding the dpkg lock for the next attempt
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.29 follow-up (doc-27): the orphaned sudo'd apt-get (EPERM on kill) was the real cause of the CI lock failures.
<!-- SECTION:NOTES:END -->
