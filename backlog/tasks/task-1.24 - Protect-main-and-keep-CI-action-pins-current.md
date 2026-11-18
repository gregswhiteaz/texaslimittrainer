---
id: TASK-1.24
title: Protect main and keep CI action pins current
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.7
references:
  - doc-6
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.7. Pushes to main are not gated on CI, the SHA-pinned actions will silently age, and merged doit/* branches pile up on the remote. Branch protection is a GitHub repo setting the user applies; the task documents and verifies it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given .github/dependabot.yml, When Dependabot runs, Then it opens weekly update PRs for github-actions and npm
- [ ] #2 Given branch protection on main, When a pull request's CI check has not passed, Then GitHub blocks merging it (setting applied by the user; steps in README)
- [ ] #3 Given doit branches that are already merged into main, When the cleanup step in README is followed, Then they are deleted locally and on origin
<!-- AC:END -->
