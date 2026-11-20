File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.39 - Recover-dpkg-and-harden-the-remaining-test-timeouts.md

Task TASK-1.39 - Recover dpkg and harden the remaining test timeouts
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 199000
Created: 2026-11-19 19:55 (UTC)
Updated: 2026-11-19 20:35 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-31

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 5 total):
└─ TASK-1.23 - Harden CI child-process cleanup [completed]
   ├─ TASK-1.19 - Retry the stalled Playwright system-dependency install in CI [completed]
   │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   └─ TASK-1.20 - Keep strict wall-clock speed checks out of the CI test run [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.23 scope concerns: killing apt mid-install can leave dpkg interrupted for the next attempt, and runInSandbox still has the spawnSync-timeout weakness fixed for the speed-limits test.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given retry killed an apt attempt in the Playwright system-dependencies step, When the next attempt starts, Then sudo dpkg --configure -a runs first and an interrupted dpkg no longer fails the install
- [ ] #2 Given tests/support/sandbox.ts runInSandbox times out, When it stops the command, Then the whole process group is killed (via runProcessGroup), with a test using a grandchild that ignores SIGTERM
- [ ] #3 Given main CI run #73 needed 3 attempts (240 s, 240 s, then 164.5 s) for Playwright system dependencies, When the install step's attempt timeout and step timeout are re-tuned (or the apt packages are cached between runs), Then a typical install finishes within its first attempt and the step's total stays under its timeout-minutes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC#3 added 2026-11-19 from CI run #73 (main 769293f): TASK-1.23's sudo kill worked live twice, but attempts 1-2 hit the 240 s limit.

