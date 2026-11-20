---
id: TASK-1.38
title: Tidy the sudo retry tests
status: To Do
assignee: []
created_date: '2026-11-19T19:55:00Z'
updated_date: '2026-11-20T02:13:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.23
references:
  - doc-31
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.23 review NITs (security and code) in tests/ci/retry.sudo.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the cleanup pkill in the Linux-CI sudo tests, When it runs, Then its pattern is anchored to the test's own sleep command line
- [ ] #2 Given a failing real-sudo test, When the ps diagnostic is printed, Then it shows only the marker's processes or the helper's own process group, not every sudo command line
- [ ] #3 Given a regression where fake sudo is never called, When the SPEC-01/SPEC-04 tests end, Then their finally cleanup still kills the hanging child (pid taken from a spawn spy)
- [ ] #4 Given the SPEC-04 test, When it checks the first fake-sudo call, Then it asserts both the signal and the attempt's process-group id
- [ ] #5 Given every group SIGKILL in the reap loop is refused (EPERM) and the probe right after the second refusal reports ESRCH, When the attempt is reaped, Then sudo is never called (pins retry.js's pre-sudo groupExists check in the reap loop)
- [ ] #6 Given an attempt is cancelled with SIGINT or SIGTERM and the first group kill is refused, When the handler runs, Then sudo is called before the reap loop's first poll (pins first-refusal escalation on cancel), and the duplicate 'await run' in tests/ci/retry.reap.test.ts SPEC-04 is removed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#5-6 added from TASK-1.37 follow-up (doc-37, code review MINORs + NIT).
<!-- SECTION:NOTES:END -->
