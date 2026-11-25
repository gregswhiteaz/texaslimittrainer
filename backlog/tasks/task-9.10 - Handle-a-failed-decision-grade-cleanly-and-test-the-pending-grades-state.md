---
id: TASK-9.10
title: Handle a failed decision grade cleanly and test the pending-grades state
status: To Do
assignee: []
created_date: '2026-11-24T13:09:00Z'
updated_date: '2026-11-25T17:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-9.3
references:
  - doc-117
parent_task_id: TASK-9
priority: medium
ordinal: 234000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-9.3 (doc-117). If the advice worker's grade request for a decision fails mid-hand, nothing handles the rejection until the hand ends (or ever, if it never ends), so the browser reports an unhandled rejection on top of the intended 'Hand record could not be saved' log (code review MINOR, judge J-1-02). Also no test covers A-2: while a hand's grades are pending, the review panel is hidden but Deal next hand shows (code review MINOR).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the worker rejects a decision's grade request mid-hand, When the page runs, Then no unhandledrejection event fires, the hand end still logs 'Hand record could not be saved', and no review panel opens (Chromium and WebKit)
- [ ] #2 Given a finished hand whose grades are still pending, When the Table renders, Then no review panel (<aside>) is shown and the Deal next hand button is present
- [ ] #3 Given a decision grade that fails mid-hand, When it rejects, Then the outcome is handled deliberately (not an unhandled rejection) and docs/ui/navigation.md states what the user sees
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-13.1 follow-up (doc-143): since TASK-13.1, an unhandled pending-grade rejection mid-hand shows the app error screen instead of stalling at the hand write.
<!-- SECTION:NOTES:END -->
