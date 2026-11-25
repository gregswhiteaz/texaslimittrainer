---
id: TASK-2.21
title: >-
  Harden the end-paused-session path: in-transaction recheck, focus after
  failure, early-open test
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T18:44:00Z'
updated_date: '2026-11-25T20:39:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.7
references:
  - doc-123
parent_task_id: TASK-2
priority: medium
ordinal: 235000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.7 (doc-123). (1) ended() checks 'already ended' only before its write transaction; an ended record with a missing report could get a new endedAt if another tab ends it in that gap (security MINOR ended-no-recheck-in-transaction). (2) After ending the confirmed session fails, the dialog is removed without returning focus to Start game (code MINOR, judge J-1-01). (3) The SPEC-08 e2e would still pass if the Table opened before the end finished, because hand 1's write recreates the deleted start record (code MINOR).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a session that is already ended when ended() reads it inside its transaction, When ending is requested, Then nothing is written (endedAt and any report unchanged)
- [ ] #2 Given ending the confirmed paused session fails, When the dialog closes, Then focus returns to Start game in Chromium and WebKit and Game Config keeps its values
- [ ] #3 Given a confirmed new game, When the Table opens, Then a test polls for the new 0-hand unended session before hand 1 and asserts its sessionId is unchanged after hand 1 (fails if the Table opens before the end finishes)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Ending a session rechecks 'already ended' inside its own transaction (rejects ConstraintError, writes nothing) — closes the race with another tab
2. After a failed Confirm, focus returns to Start game
3. Deterministic tests: fake-indexeddb recheck; e2e with the TASK-2.20 hold extended to the end transaction so the Table can't open early

Full spec: doit/TASK-2.21/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: in-transaction already-ended recheck (ConstraintError, no write); focus returns to Start game after a failed end; hold helper takes a scope; each new test fails without its fix (recorded). Full e2e 375 pass; gate PASS.
<!-- SECTION:NOTES:END -->
