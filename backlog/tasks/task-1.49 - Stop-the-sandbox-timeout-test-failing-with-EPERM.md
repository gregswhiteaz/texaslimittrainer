---
id: TASK-1.49
title: Stop the sandbox-timeout test failing with EPERM
status: To Do
assignee: []
created_date: '2026-11-21T00:53:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.39
references:
  - doc-46
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 209000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seen twice on 2026-11-20 (TASK-1.46 fix gate, TASK-1.40 judge scratch runs): tests/support/sandbox-timeout.acceptance.test.ts failed with 'could not send SIGKILL to process group N (EPERM)' while other heavy processes ran; it passed alone and on rerun. Clears the infra value bar because it has failed real gate runs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the sandbox-timeout acceptance test runs while the machine is under heavy load, When the timed-out command's process group is killed, Then an EPERM from an already-exiting group does not fail the test (and the grandchild is still proven dead)
- [ ] #2 Given 10 consecutive runs of that test file under 3x-core load, When they finish, Then all pass
<!-- AC:END -->
