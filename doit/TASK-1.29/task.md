File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.29 - Make-the-CI-system-package-install-survive-a-busy-apt-lock.md

Task TASK-1.29 - Make the CI system-package install survive a busy apt lock
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 188000
Created: 2026-11-19 02:21 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-11, doc-26

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 3 total):
└─ TASK-1.19 - Retry the stalled Playwright system-dependency install in CI [completed]
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Found by the TASK-9.1 judge (2026-11-19): CI run 44441353985 attempt 1 and main's run 44434902016 both failed at 'Install Playwright system dependencies' because the Ubuntu runner's dpkg lock was held by another apt-get (unattended upgrades at boot). apt exits 100 in seconds, so TASK-1.19's three retries (10 s apart) all hit the same lock. A re-run fixed both, but every push risks a false red.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given another apt process holds the dpkg lock when the step starts, When the system-package install runs, Then it waits for the lock to clear (or uses apt's lock timeout) for up to a set limit before installing, instead of failing with exit 100
- [ ] #2 Given the lock never clears within the limit, When the step gives up, Then it fails with a clear ::error:: line naming the lock, within the step's existing timeout
- [ ] #3 Given the workflow test, When it checks the install step, Then it asserts the lock handling is present

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

