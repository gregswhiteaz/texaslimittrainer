---
id: TASK-1.45
title: Tidy the cleanup script's remote delete
status: To Do
assignee: []
created_date: '2026-11-20T06:02:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.35
references:
  - doc-42
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 206000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.35 review (security NIT, code MINOR).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the leased remote delete, When the push args are built, Then each branch is deleted by its full ref refs/heads/<b>, matching its lease
- [ ] #2 Given a push that fails with no refusal lines, When it is reported, Then the 'git … failed' message comes from one shared helper (no duplicated body), with tests still passing
<!-- AC:END -->
