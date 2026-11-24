File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.54 - Stop-file-sync-conflict-copies-from-reaching-commits.md

Task TASK-1.54 - Stop file-sync conflict copies from reaching commits
==================================================

Status: ○ To Do
Priority: High
Ordinal: 225000
Created: 2026-11-23 13:44 (UTC)
Updated: 2026-11-23 13:45 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-1 - Prove the game headlessly

Description:
--------------------------------------------------
From TASK-3.10: iCloud 'name 2.ext' sync-conflict copies appeared in the working tree (the project lives under ~/Documents), broke typecheck and the gate, and one under backlog/ was committed by the doit commit step. Real failure. Options: move the repo out of an iCloud-synced folder (user action), ignore '* 2.*' patterns in .gitignore, and/or a repo check that fails on such files.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a file named like 'x 2.ts' or 'doc-100 … 2.md' appears in the working tree, When tests/lint or the CI check run, Then the run fails naming the file (or git ignores it via .gitignore), so it cannot be committed
- [ ] #2 Given the guidance in docs, When a developer reads it, Then it says the repo must not live in an iCloud-synced folder (Desktop & Documents) and how to move it

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
No dependency: the guard protects every later commit; run it next so parked/following stories don't pick up sync copies.

