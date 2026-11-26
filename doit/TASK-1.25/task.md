File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.25 - Run-the-all-dependency-audit-at-high-once-picomatch-is-patched.md

Task TASK-1.25 - Run the all-dependency audit at high once picomatch is patched
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 170000
Created: 2026-11-18 07:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly
References: doc-5

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 2 total):
└─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-1.1 (Q-3): the dev/build-only picomatch advisory GHSA-fc5q-39xc-vjpf is tolerated, so the all-deps audit runs at --audit-level=critical. Revisit when a patched picomatch ships.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a patched picomatch is available through our dev dependencies, When CI runs the all-dependency audit, Then it uses --audit-level=high and passes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

