---
id: TASK-1.35
title: Harden and tidy the merged-branch cleanup script
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
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.24 reviews: security MINOR (remote delete without lease), code MINORs (helper name shadowing, untested missing-ref path) and a NIT (fail() does not fail).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a remote doit/* branch moves after the script lists it, When --apply runs, Then the remote delete uses --force-with-lease=<ref>:<listed sha>, is refused for that branch, and the script exits 1 naming it
- [ ] #2 Given a repository with no main or no origin/main, When the script runs, Then a test proves it exits 1 with 'missing ref' and deletes nothing
- [ ] #3 Given tools/git/prune-merged-branches.js, When it is read, Then the lines() helper is named outputLines and fail() is named reportError, with all tests still passing
<!-- AC:END -->
