---
id: TASK-9.10
title: Handle a failed decision grade cleanly and test the pending-grades state
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T13:09:00Z'
updated_date: '2026-11-26T08:16:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. requestNewGrades attaches a no-op catch to each grade request; pending keeps the original promise
2. Hand end still logs 'Hand record could not be saved'; no unhandledrejection; table stops dealing (Q-1 option A)
3. e2e reject-grade fault (Chromium + WebKit); unit test; renderToString test for the pending-grades state
4. docs/ui/navigation.md and docs/ui/review.md state what the user sees

Full spec: doit/TASK-9.10/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-13.1 follow-up (doc-143): since TASK-13.1, an unhandled pending-grade rejection mid-hand shows the app error screen instead of stalling at the hand write.
<!-- SECTION:NOTES:END -->
