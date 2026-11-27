---
id: TASK-13.13
title: Pin error-recovery history handling and decide on empty paused sessions
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T17:55:00Z'
updated_date: '2026-11-27T20:39:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-13.1
references:
  - doc-143
documentation:
  - doc-196
parent_task_id: TASK-13
priority: low
ordinal: 249000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-13.1 review and judge (doc-143). No repo test pins that Return Home after an error steps off the Table's history entry (history.back(), A-4); the judge's holdout confirmed it works. A paused 0-hand session (error or reload during hand 1) is offered for Resume as '0 hands · paused'; decide whether it should be. AppRoot's generation key is redundant.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given Return Home after a mid-session error, When the user presses browser Back, Then a repo e2e shows the app does not return to the dead table and history.state.tlhTable is unset
- [x] #2 Given a paused session with 0 completed hands, When Home loads, Then whether it is offered for Resume follows the user's recorded decision
- [x] #3 Given AppRoot, When read, Then the redundant generation key is removed or justified in a comment
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New e2e: Return Home after an error steps off the table history entry (Back leaves the app; tlhTable unset)
2. New e2e: a hand-1 error leaves a 0-hand paused session Home offers for Resume (Q-1 A)
3. Remove AppRoot's redundant generation key
4. Docs line in navigation.md

Full spec: doit/TASK-13.13/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (TASK-13.13 Q-1, user 2026-11-27): A — a paused session with 0 completed hands stays offered for Resume ('… · 0 hands · paused'), including after an error in hand 1; Resume deals Hand #1 with the same line-up, seats and stacks. No text or locked-test change.

Build: new e2e/error-recovery-history.spec.ts (history step-off + 0-hand Resume, 20/20 repeat, history.back() mutation caught); AppRoot generation key removed; docs; gate PASS

Step 6a: none (shared e2e helpers NIT is below the value bar).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed the redundant generation key from AppRoot and added e2e/error-recovery-history.spec.ts. It pins that Return Home after a hand-1 error clears history.state.tlhTable so one Back leaves the app. It also pins the Q-1 A decision that a 0-hand paused session stays offered for Resume. Docs updated in docs/ui/navigation.md. Verified: npm test 1555 passed; e2e 417 passed, 0 failed; mutation check failed as expected; judge PASS 3/3 including preview-build run. Review for the 4 assumptions (A-1 to A-4, all reversible). Follow-up: optionally move duplicated e2e helpers into e2e/support (NIT).
<!-- SECTION:FINAL_SUMMARY:END -->
