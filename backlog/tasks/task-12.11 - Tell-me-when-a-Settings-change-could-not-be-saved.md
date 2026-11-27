---
id: TASK-12.11
title: Tell me when a Settings change could not be saved
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T17:01:00Z'
updated_date: '2026-11-27T11:46:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pure createSettingsSaver (latest save drives the screen; revert to last saved on failure)
2. Settings shows role=alert message after the header on failure; clears on next change / reopen
3. Unit, acceptance and e2e tests (e2e makes settings put fail via init script)
4. Docs

Full spec: doit/TASK-12.11/spec.md
<!-- SECTION:PLAN:END -->
