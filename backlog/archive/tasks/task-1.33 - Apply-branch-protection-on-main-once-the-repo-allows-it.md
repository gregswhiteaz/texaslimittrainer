---
id: TASK-1.33
title: Apply branch protection on main once the repo allows it
status: To Do
assignee: []
created_date: '2026-11-19T04:51:00Z'
updated_date: '2026-11-20T23:45:00Z'
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
- [ ] #4 Given branch protection is applied, When its required checks are listed, Then they include the Visual workflow's job as well as the CI job
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.20 follow-up (doc-38).

Won't do (user decision 2026-11-20): infra/tooling chore below the value bar — it hasn't caused and wouldn't plausibly cause a real failure; archived to keep focus on the trainer. Reopen from the archive if that changes.
<!-- SECTION:NOTES:END -->
