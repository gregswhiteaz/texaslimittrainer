File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.23 - Harden-CI-child-process-cleanup.md

Task TASK-1.23 - Harden CI child-process cleanup
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 168000
Created: 2026-11-18 07:03 (UTC)
Updated: 2026-11-19 05:08 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-11, doc-12

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 4 total):
├─ TASK-1.19 - Retry the stalled Playwright system-dependency install in CI [completed]
│  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
└─ TASK-1.20 - Keep strict wall-clock speed checks out of the CI test run [completed]
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from the TASK-1.19 and TASK-1.20 reviews. In rare cases a hung or unkillable child process can outlive its test or attempt, wasting up to the 13-minute step backstop or leaving orphans on a runner.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given tools/ci/retry.js times out an attempt and both SIGTERM and SIGKILL to the process group fail with EPERM, When the kill grace expires, Then the attempt ends at once with an ::error:: line naming the step instead of waiting for the step timeout
- [ ] #2 Given tests/ci/retry.sudo.test.ts fails or throws partway, When the test ends, Then any sudo sleep it started is killed (cleanup in finally)
- [ ] #3 Given the nested Vitest run in tests/ci/speed-limits.acceptance.test.ts exceeds its timeout, When it is stopped, Then the nested Vitest process and its children are killed, not only npx
- [ ] #4 Given retry.js times out an attempt whose command runs apt-get under sudo, When it stops the attempt, Then the root apt-get is really stopped (e.g. sudo -n kill on the process group) so it cannot keep holding the dpkg lock for the next attempt

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-1.29 follow-up (doc-27): the orphaned sudo'd apt-get (EPERM on kill) was the real cause of the CI lock failures.

2026-11-19: raised to High by the user after CI run #68 (main, 9ba77c8) failed: attempt 1's sudo apt-get (pid 5507) outlived its 240 s timeout and held the dpkg lock through attempts 2 and 3 (AC#4). Second CI failure from this cause.

