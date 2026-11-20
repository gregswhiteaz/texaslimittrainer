File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.47 - Verify-and-prune-the-cached-apt-archives.md

Task TASK-1.47 - Verify and prune the cached apt archives
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 208000
Created: 2026-11-20 23:06 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-43

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
Follow-up from TASK-1.39 security review and judge (J-1-01, J-1-03): apt trusts a .deb already in /var/cache/apt/archives on name and size, not hash, so a .deb planted in the Actions cache by code in a main job would be installed as root on later runs for up to a month. restore-keys also carries old .debs forward month to month.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a restored .deb whose sha256 does not match the signed index (apt-cache show <pkg>=<ver> after apt-get update), When the restore step runs, Then that file is discarded before reaching /var/cache/apt/archives, and a test proves a tampered file is dropped
- [ ] #2 Given the job runs later steps (tests, E2E) after the installs, When the apt cache is saved, Then it is saved right after Collect (actions/cache/restore + actions/cache/save) so later steps cannot add files to it
- [ ] #3 Given last month's cache is restored via restore-keys, When Collect runs, Then .debs no longer needed by the current install are not carried forward (e.g. apt-get autoclean or collect only what this install used)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

