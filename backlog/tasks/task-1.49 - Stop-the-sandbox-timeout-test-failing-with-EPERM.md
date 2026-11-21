---
id: TASK-1.49
title: Stop the sandbox-timeout test failing with EPERM
status: Done
assignee:
  - '@claude'
created_date: '2026-11-21T00:53:00Z'
updated_date: '2026-11-21T01:18:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.39
references:
  - doc-46
documentation:
  - doc-47
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
- [x] #1 Given the sandbox-timeout acceptance test runs while the machine is under heavy load, When the timed-out command's process group is killed, Then an EPERM from an already-exiting group does not fail the test (and the grandchild is still proven dead)
- [x] #2 Given 10 consecutive runs of that test file under 3x-core load, When they finish, Then all pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Root cause: runProcessGroup reuses retry.js killGroup, whose EPERM log line goes to stdout and corrupts the CLI JSON.
2. process-group.ts: private quiet group kill (ignore ESRCH/EPERM, rethrow others, no output).
3. Unit test with EPERM-throwing kill spy; locked sandbox-timeout test unchanged; 10/10 under 3x-core load.

Full spec: doit/TASK-1.49/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: process-group.ts uses a quiet local group kill (EPERM/ESRCH ignored, no stdout), unit test proves it; locked sandbox-timeout test unchanged and 10/10 under 3x-core load; gate PASS

Judge R1 PASS 3/3; 10/10 under 3x-core load; base commit reproduces the corrupted-JSON bug.

Follow-ups (Step 6a): none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the intermittent EPERM failure of the locked sandbox-timeout test. runProcessGroup now uses a local quiet group kill (ignores EPERM/ESRCH, writes nothing) instead of tools/ci/retry.js killGroup, whose EPERM log line corrupted the CLI's JSON stdout and made timedOut false. Changed tests/support/process-group.ts and its unit test only (56 lines). Verified: npm test 363 passed; locked test unchanged and passing; 10/10 runs under 3x-core load; review and judge round 1 had no findings. Assumptions to review: EPERM ignored silently in test support (A-1); fix placed in the helper, not in sandbox.ts parsing (A-2). No follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
