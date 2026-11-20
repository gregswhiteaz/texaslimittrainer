File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.35 - Harden-and-tidy-the-merged-branch-cleanup-script.md

Task TASK-1.35 - Harden and tidy the merged-branch cleanup script
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 195000
Created: 2026-11-19 04:51 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-30

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 3 total):
└─ TASK-1.24 - Protect main and keep CI action pins current [completed]
   └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-1.24 reviews: security MINOR (remote delete without lease), code MINORs (helper name shadowing, untested missing-ref path) and a NIT (fail() does not fail).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a remote doit/* branch moves after the script lists it, When --apply runs, Then the remote delete uses --force-with-lease=<ref>:<listed sha>, is refused for that branch, and the script exits 1 naming it
- [ ] #2 Given a repository with no main or no origin/main, When the script runs, Then a test proves it exits 1 with 'missing ref' and deletes nothing
- [ ] #3 Given tools/git/prune-merged-branches.js, When it is read, Then the lines() helper is named outputLines and fail() is named reportError, with all tests still passing

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

