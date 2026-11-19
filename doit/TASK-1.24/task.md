File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.24 - Protect-main-and-keep-CI-action-pins-current.md

Task TASK-1.24 - Protect main and keep CI action pins current
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 169000
Created: 2026-11-18 07:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-6

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 2 total):
└─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-1.7. Pushes to main are not gated on CI, the SHA-pinned actions will silently age, and merged doit/* branches pile up on the remote. Branch protection is a GitHub repo setting the user applies; the task documents and verifies it.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given .github/dependabot.yml, When Dependabot runs, Then it opens weekly update PRs for github-actions and npm
- [ ] #2 Given branch protection on main, When a pull request's CI check has not passed, Then GitHub blocks merging it (setting applied by the user; steps in README)
- [ ] #3 Given doit branches that are already merged into main, When the cleanup step in README is followed, Then they are deleted locally and on origin

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

