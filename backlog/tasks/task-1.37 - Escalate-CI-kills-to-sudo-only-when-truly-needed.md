---
id: TASK-1.37
title: Escalate CI kills to sudo only when truly needed
status: Done
assignee:
  - '@claude'
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
documentation:
  - doc-37
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.23 (judge J-1-01 MEDIUM, security MINOR, code MINOR, spec scope concern). retry.js's sudo fallback can fire spuriously while a SIGKILLed child is still dying (seen on macOS), can race a PGID reuse, runs two reap loops at once, and the cancellation path never escalates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a child that is SIGKILLed at the end of the grace period, When the reap loop's next group kill returns EPERM once and the group is gone at the next poll, Then sudo is never called
- [x] #2 Given the group no longer exists, When retry is about to call sudoKillGroup, Then groupExists is checked immediately before and sudo is skipped
- [x] #3 Given the kill timer and the child's exit both start reaping, When the attempt ends, Then a single shared reap runs and each sudo call and log line appears at most once per poll
- [x] #4 Given retry.js receives SIGINT or SIGTERM while an attempt runs under sudo, When it stops the attempt, Then a refused group kill escalates to sudo -n kill exactly as on timeout
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. reap: escalate to sudo only after two consecutive refusals; groupExists checked right before every sudo call.
2. One shared reap promise between the kill timer and finish.
3. SIGINT/SIGTERM: stopGroup (sudo on refusal) then wait for the shared reap, exit 130/143.
4. New tests/ci/retry.reap.test.ts (locked TASK-1.23 tests untouched); Linux-CI real-sudo cancellation test needs a branch push.

Full spec: doit/TASK-1.37/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: sudo only after two consecutive refusals + groupExists before every sudo; one shared reap per attempt; cancellation uses stopGroup + shared reap; new tests/ci/retry.reap.test.ts; gate PASS (Linux-only SPEC-05 pending branch CI)

Judge R1 PASS 6/6, no findings; Linux-only tests verified on branch CI run 44657322059 (9b9f4ff).

Follow-ups (Step 6a): TASK-1.38 AC#5-6 (reap-loop groupExists test, first-refusal cancel test, duplicate await).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the four sudo-kill flaws in tools/ci/retry.js: the group is re-checked right before every sudo call; the reap loop calls sudo only after two refused kills in a row; the kill timer and child exit share one reap; SIGINT/SIGTERM now stop the attempt with the sudo fallback and the shared reap. Verified by new tests/ci/retry.reap.test.ts (SPEC-01..05), npm test (324 passed, 5 Linux-only skipped), lint and typecheck, and branch CI run 44657322059, where the real-sudo tests passed. Judge PASS. Assumptions to review: sudo only after 2 consecutive refusals in the reap loop (A-1); a repeat signal during cancel is ignored (A-2). Follow-ups: tests for the reap-loop groupExists check and for first-refusal escalation on cancel.
<!-- SECTION:FINAL_SUMMARY:END -->
