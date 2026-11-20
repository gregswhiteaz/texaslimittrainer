---
id: TASK-1.32
title: Tighten the remaining engine input guards
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T04:25:00Z'
updated_date: '2026-11-20T05:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.21
references:
  - doc-29
documentation:
  - doc-41
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 192000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.21 (doc-29) spec and reviews: a few engine entry points still throw native TypeErrors or echo input of any length. Nothing untrusted reaches them today, but saved sessions and replay-code input will.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given parseCards or evaluate receives a non-array or non-string input, When called, Then it throws RangeError with a message that echoes no input
- [x] #2 Given createHand receives a null config or non-array seats, When called, Then it throws RangeError('Invalid hand config') instead of TypeError
- [x] #3 Given an invalid seat, button or replay code longer than 10 characters, When the error is built, Then 'Invalid seat', 'Button must be a dealt-in seat' and 'Invalid replay code' echo at most 10 characters plus '...', and TASK-1.3's locked messages for short inputs stay byte-identical
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract echoText (10 chars + ...) in cards.ts; reuse in hand.ts (seat, button) and deck.ts (replay code).
2. parseCards non-string -> approved 'Invalid card: expected a string, got <typeof>'; evaluate non-array -> 'Invalid hand: expected an array, got <typeof>'.
3. createHand shape guard -> RangeError('Invalid hand config'), reading each field once (TASK-1.31 lock).
4. New tests/engine/input-guards.acceptance.test.ts; deck.test.ts long-code assertion updated to the truncated echo (unlocked unit test).

Full spec: doit/TASK-1.32/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
From TASK-1.31 security review (doc-35): restored sessions (TASK-3.10) are the real source of a non-array seats / null config reaching createHand; AC#2 here owns the RangeError('Invalid hand config') guard.

Build: shared echoText; parseCards/evaluate RangeErrors; createHand 'Invalid hand config' shape guard (read-once); seat/button/replay echoes truncated; new input-guards acceptance tests; deck.test.ts D-1; gate PASS

Judge R1 PASS 6/6; playtest output identical to base.

Follow-ups (Step 6a): two ACs on TASK-3.10 (restored-session shape validation). A-1 (string deck now 'Invalid hand config') listed for user review in the autopilot report.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tightened engine input guards: parseCards/evaluate/createHand now throw RangeError on malformed input, and seat, button and replay-code echoes are capped at 10 chars + '...'. Verified: npm test 344 passed, lint and typecheck clean, playtest output byte-identical to base, Judge PASS round 1, no blocking review findings. Review assumptions A-1..A-4 (A-1 slightly exceeds AC#2: any bad config shape gives 'Invalid hand config', string deck included). Follow-ups: String() TypeError on JSON objects with non-function toString; sparse seats arrays still throw TypeError; shuffledDeck accepts an array holding a valid code (owner TASK-3.10).
<!-- SECTION:FINAL_SUMMARY:END -->
