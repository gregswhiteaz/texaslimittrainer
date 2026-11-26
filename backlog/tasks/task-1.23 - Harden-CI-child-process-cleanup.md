---
id: TASK-1.23
title: Harden CI child-process cleanup
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-26T00:07:00Z'
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
documentation:
  - doc-31
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the TASK-1.19 and TASK-1.20 reviews. In rare cases a hung or unkillable child process can outlive its test or attempt, wasting up to the 13-minute step backstop or leaving orphans on a runner.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given tools/ci/retry.js times out an attempt and both SIGTERM and SIGKILL to the process group fail with EPERM, When the kill grace expires, Then the attempt ends at once with an ::error:: line naming the step instead of waiting for the step timeout
- [x] #2 Given tests/ci/retry.sudo.test.ts fails or throws partway, When the test ends, Then any sudo sleep it started is killed (cleanup in finally)
- [x] #3 Given the nested Vitest run in tests/ci/speed-limits.acceptance.test.ts exceeds its timeout, When it is stopped, Then the nested Vitest process and its children are killed, not only npx
- [x] #4 Given retry.js times out an attempt whose command runs apt-get under sudo, When it stops the attempt, Then the root apt-get is really stopped (e.g. sudo -n kill on the process group) so it cannot keep holding the dpkg lock for the next attempt
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. retry.js: killGroup reports sent/gone/EPERM; EPERM escalates to sudo -n kill on the attempt's process group.
2. After each attempt, reap: re-send SIGKILL every 250 ms for up to 2 s until the group is gone (lock freed).
3. Still alive -> ::error:: 'could not be stopped', exit 1 at once (no waiting for the 13 min backstop).
4. retry.sudo.test.ts: try/finally cleanup; new Linux-CI real-sudo flock test proving attempt 2 gets the lock.
5. tests/support/process-group.ts: kill the whole nested Vitest group in speed-limits test (100 s).

Full spec: doit/TASK-1.23/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.29 follow-up (doc-27): the orphaned sudo'd apt-get (EPERM on kill) was the real cause of the CI lock failures.

2026-11-19: raised to High by the user after CI run #68 (main, 9ba77c8) failed: attempt 1's sudo apt-get (pid 5507) outlived its 240 s timeout and held the dpkg lock through attempts 2 and 3 (AC#4). Second CI failure from this cause.

Build: retry.js sudo escalation on EPERM + 2 s reap wait + fail-fast stuck attempts; process-group helper for speed-limits test; sudo tests cleanup in finally; Linux-only real-sudo flock test (SPEC-02) pending branch CI; gate PASS

Judge R1 PASS 8/8; real-sudo tests verified on branch CI run 44600933321 (f4a6897). J-1-01 MEDIUM (spurious sudo escalation on macOS during SIGKILL teardown) -> follow-up.

Follow-ups (Step 6a): TASK-1.37 escalate to sudo only when needed (J-1-01, pid-reuse, shared reap, onSignal); TASK-1.38 tidy sudo retry tests (NITs); TASK-1.39 dpkg --configure -a before retry + runInSandbox group kill.

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Retry.js now really stops a timed-out attempt: after each attempt a 2 s reap loop re-sends SIGKILL, escalating to `sudo -n kill -- -<pgid>` on EPERM, so an orphaned root apt-get no longer holds the dpkg lock; an unstoppable attempt ends at once with `::error::` and exit 1. Sudo tests clean up in finally, and the speed-limits nested Vitest runs as a killable process group (100 s timeout). Verified: npm test 298 passed/3 skipped, lint and typecheck clean, judge PASS 8/8, and Linux CI run 44600933321 passed the real-sudo test (EPERM and sudo-kill lines asserted). Review the assumptions A-1..A-6 (2 s reap, helper exits on a stuck attempt, 100 s nested timeout). Follow-ups: escalate to sudo only when EPERM persists (macOS spurious root kill), pid-reuse check before sudo kill, shared reap promise, dpkg --configure -a before retry, runInSandbox spawnSync timeout, onSignal sudo escalation, test NITs.
<!-- SECTION:FINAL_SUMMARY:END -->
