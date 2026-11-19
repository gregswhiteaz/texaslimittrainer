---
id: TASK-1.34
title: Confirm Dependabot runs and clear merged doit branches after the first push
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
priority: medium
type: chore
ordinal: 194000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.24 (judge J-1-01). Dependabot and the cleanup script can only be checked against GitHub after main carrying .github/dependabot.yml is pushed. User-run verification; Claude cannot push.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given main with .github/dependabot.yml is pushed, When GitHub's Dependabot page (Insights > Dependency graph > Dependabot) is opened, Then both github-actions and npm show a successful last check with no config errors
- [ ] #2 Given the first weekly run has happened, When open pull requests are listed, Then any Dependabot PRs are grouped as configured and their CI runs
- [ ] #3 Given main is pushed, When node tools/git/prune-merged-branches.js --apply is run, Then every merged doit/* branch is gone locally and on origin and a following dry run reports nothing to clean
<!-- AC:END -->
