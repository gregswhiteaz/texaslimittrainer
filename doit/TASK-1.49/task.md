File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.49 - Stop-the-sandbox-timeout-test-failing-with-EPERM.md

Task TASK-1.49 - Stop the sandbox-timeout test failing with EPERM
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 209000
Created: 2026-11-21 00:53 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-46

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-1.39 - Recover dpkg and harden the remaining test timeouts [completed]
   └─ TASK-1.23 - Harden CI child-process cleanup [completed]
      ├─ TASK-1.19 - Retry the stalled Playwright system-dependency install in CI [completed]
      │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-1.20 - Keep strict wall-clock speed checks out of the CI test run [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Seen twice on 2026-11-20 (TASK-1.46 fix gate, TASK-1.40 judge scratch runs): tests/support/sandbox-timeout.acceptance.test.ts failed with 'could not send SIGKILL to process group N (EPERM)' while other heavy processes ran; it passed alone and on rerun. Clears the infra value bar because it has failed real gate runs.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the sandbox-timeout acceptance test runs while the machine is under heavy load, When the timed-out command's process group is killed, Then an EPERM from an already-exiting group does not fail the test (and the grandchild is still proven dead)
- [ ] #2 Given 10 consecutive runs of that test file under 3x-core load, When they finish, Then all pass

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

