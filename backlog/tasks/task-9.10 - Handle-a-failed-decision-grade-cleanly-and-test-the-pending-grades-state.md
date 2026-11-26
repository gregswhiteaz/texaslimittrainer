---
id: TASK-9.10
title: Handle a failed decision grade cleanly and test the pending-grades state
status: Done
assignee:
  - '@claude'
created_date: '2026-11-24T13:09:00Z'
updated_date: '2026-11-26T08:56:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-9.3
references:
  - doc-117
documentation:
  - doc-157
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
- [x] #1 Given the worker rejects a decision's grade request mid-hand, When the page runs, Then no unhandledrejection event fires, the hand end still logs 'Hand record could not be saved', and no review panel opens (Chromium and WebKit)
- [x] #2 Given a finished hand whose grades are still pending, When the Table renders, Then no review panel (<aside>) is shown and the Deal next hand button is present
- [x] #3 Given a decision grade that fails mid-hand, When it rejects, Then the outcome is handled deliberately (not an unhandled rejection) and docs/ui/navigation.md states what the user sees
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

Build: grade requests get a no-op catch (pending keeps the original promise); grade failure follows the write-failure path (Q-1 A); e2e 383 passed; gate PASS

Judge r1 PASS (6/6 SPEC items)

Follow-ups: AC added to TASK-13.3 (Retry re-requests grades after a grade-caused write failure).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A failed decision grade mid-hand no longer raises an unhandled rejection (and so no error screen): requestNewGrades attaches a no-op handler and the failure surfaces only through the hand's record write ('Hand record could not be saved', no review panel, result stays, no next hand, Leave works). Added unit, markup and Chromium/WebKit e2e tests plus docs (navigation.md, review.md). Judge round 1 PASS 6/6, no review findings. Review: Q-1 (auto-accepted option A: the write-failure behaviour above, no error screen) and A-1..A-4 in the doc. Follow-up: TASK-13.3 Retry must re-request grades when a write failed because grading failed.
<!-- SECTION:FINAL_SUMMARY:END -->
