---
id: TASK-2.21
title: >-
  Harden the end-paused-session path: in-transaction recheck, focus after
  failure, early-open test
status: Done
assignee:
  - '@claude'
created_date: '2026-11-24T18:44:00Z'
updated_date: '2026-11-26T11:53:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.7
references:
  - doc-123
documentation:
  - doc-147
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
- [x] #1 Given a session that is already ended when ended() reads it inside its transaction, When ending is requested, Then nothing is written (endedAt and any report unchanged)
- [x] #2 Given ending the confirmed paused session fails, When the dialog closes, Then focus returns to Start game in Chromium and WebKit and Game Config keeps its values
- [x] #3 Given a confirmed new game, When the Table opens, Then a test polls for the new 0-hand unended session before hand 1 and asserts its sessionId is unchanged after hand 1 (fails if the Table opens before the end finishes)
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

Judge r1 PASS 5/5, no findings: two real tabs — ending the paused session in tab 2 makes tab 1 End session and start fail cleanly (logged, focus on Start game, nothing overwritten), next Start game works; own hold keeps the Table closed until the end commits; endPausedSessions with C ended mid-gap leaves C untouched (base code overwrote it). Full e2e 375 pass. CI 45697325125 green.

Follow-ups: TASK-2.23 (tidy new tests). TASK-2.7 SPEC-08 weakness covered by the new e2e; no change.

Locked tests end-recheck and end-session-hardening unlocked for TASK-2.23 tidy (no check removed)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Ending a paused session now rechecks 'already ended' inside the same transaction (ConstraintError, nothing written), closing the cross-tab overwrite race; a failed 'End session and start' returns focus to Start game with Game Config values kept; a new e2e holds the end transaction open and proves the Table opens only after it commits. Verified: judge PASS 5/5, vitest 1412 passed, lint/typecheck clean, Playwright 375 passed (chromium+webkit), no locked test edited. Review assumptions A-1..A-5 (A-1 reject with ConstraintError when already ended; A-2 a lost race fails the normal way, dialog closes, no game starts). Follow-ups: tidy double endSession call and a cast in new tests; TASK-2.7 SPEC-08 stays weak; scope 347 vs 330 lines.
<!-- SECTION:FINAL_SUMMARY:END -->
