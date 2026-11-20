File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.37 - Escalate-CI-kills-to-sudo-only-when-truly-needed.md

Task TASK-1.37 - Escalate CI kills to sudo only when truly needed
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 197000
Created: 2026-11-19 19:55 (UTC)
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
Follow-up from TASK-1.23 (judge J-1-01 MEDIUM, security MINOR, code MINOR, spec scope concern). retry.js's sudo fallback can fire spuriously while a SIGKILLed child is still dying (seen on macOS), can race a PGID reuse, runs two reap loops at once, and the cancellation path never escalates.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a child that is SIGKILLed at the end of the grace period, When the reap loop's next group kill returns EPERM once and the group is gone at the next poll, Then sudo is never called
- [ ] #2 Given the group no longer exists, When retry is about to call sudoKillGroup, Then groupExists is checked immediately before and sudo is skipped
- [ ] #3 Given the kill timer and the child's exit both start reaping, When the attempt ends, Then a single shared reap runs and each sudo call and log line appears at most once per poll
- [ ] #4 Given retry.js receives SIGINT or SIGTERM while an attempt runs under sudo, When it stops the attempt, Then a refused group kill escalates to sudo -n kill exactly as on timeout

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

