---
id: TASK-1.54
title: Stop file-sync conflict copies from reaching commits
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T13:44:00Z'
updated_date: '2026-11-23T13:47:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies: []
parent_task_id: TASK-1
priority: high
ordinal: 225000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-3.10: iCloud 'name 2.ext' sync-conflict copies appeared in the working tree (the project lives under ~/Documents), broke typecheck and the gate, and one under backlog/ was committed by the doit commit step. Real failure. Options: move the repo out of an iCloud-synced folder (user action), ignore '* 2.*' patterns in .gitignore, and/or a repo check that fails on such files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a file named like 'x 2.ts' or 'doc-100 … 2.md' appears in the working tree, When tests/lint or the CI check run, Then the run fails naming the file (or git ignores it via .gitignore), so it cannot be committed
- [ ] #2 Given the guidance in docs, When a developer reads it, Then it says the repo must not live in an iCloud-synced folder (Desktop & Documents) and how to move it
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. .gitignore patterns for ' N' / ' N.ext' copies.
2. tools/lint/sync-copies.js walker + CLI, first step of npm run lint (CI every push).
3. README 'Where to keep the repo'; sandbox CONFIG_FILES; tooling tests.

Full spec: doit/TASK-1.54/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
No dependency: the guard protects every later commit; run it next so parked/following stories don't pick up sync copies.
<!-- SECTION:NOTES:END -->
