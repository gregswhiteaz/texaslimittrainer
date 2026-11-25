---
id: TASK-12.11
title: Tell me when a Settings change could not be saved
status: To Do
assignee: []
created_date: '2026-11-25T17:01:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.2
references:
  - doc-142
parent_task_id: TASK-12
priority: low
ordinal: 248000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-12.2 (doc-142). A failed settings save is only logged (console.error 'Settings could not be saved'); the screen keeps the new value until the app closes, so the user can believe a change was saved when it was not.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a settings save that fails, When the user changes a setting, Then Settings shows a short visible message that the change was not saved (approved wording) and the stored record is unchanged
<!-- AC:END -->
