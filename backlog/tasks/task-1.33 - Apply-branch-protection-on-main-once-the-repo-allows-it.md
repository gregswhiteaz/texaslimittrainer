---
id: TASK-1.33
title: Apply branch protection on main once the repo allows it
status: To Do
assignee: []
created_date: '2026-11-19T04:51:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.24
references:
  - doc-30
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 193000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.24 (Q-1). GitHub returns 403 for branch protection on this private free-plan repo, so the README documents the command but it is not applied. Do this only if the repo becomes public or moves to GitHub Pro; otherwise leave it in To Do.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the repo is public or on GitHub Pro, When the README's branch-protection PUT command is run, Then the README's verify command prints ["Lint, typecheck, build, test and e2e"]
- [ ] #2 Given a pull request to main whose CI check is failing or pending, When it is viewed on GitHub, Then merging is blocked
- [ ] #3 Given enforce_admins is false, When the user pushes a fast-forward merge directly to main, Then the push is accepted
<!-- AC:END -->
