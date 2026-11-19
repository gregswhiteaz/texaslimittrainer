---
id: TASK-1.31
title: Keep every chip amount a safe integer
status: Done
assignee:
  - '@claude'
created_date: '2026-11-19T04:25:00Z'
updated_date: '2026-11-19T23:33:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.21
references:
  - doc-29
documentation:
  - doc-35
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 191000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.21 (doc-29) judge J-1-01 and code review. The A-4 bound assumes a 4-bet cap that the engine does not enforce yet (TASK-1.12), and stacks up to MAX_SAFE_INTEGER are accepted. The judge played a legal 10-seat hand at the A-4 bound that produced 11 unsafe numbers (largest 90071992547408820). minimumStack's doc comment also claims the cap. No test pins the factor 10 in A-4 or that createHand reads each field once.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given any config createHand accepts, When the hand is played legally to the end, Then every stack, contribution, pot and award stays a safe integer (stacks bounded in createHand, or proven via the TASK-1.12 cap), and a test plays the worst case
- [x] #2 Given stakes with bigBet 2^49 and stacks 2^52, When createHand validates them, Then it rejects them with 'Invalid stakes' (pins the factor 10 in the A-4 bound)
- [x] #3 Given a config built from one-shot getters or a counting Proxy, When createHand runs, Then each field is read exactly once (test)
- [x] #4 Given minimumStack's doc comment, When read, Then it does not claim a cap the engine doesn't enforce
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. hand.ts validate: after per-seat checks, reject stacks totalling more than MAX_SAFE_INTEGER (Q-1 message); chip conservation keeps every amount safe without the 4-bet cap.
2. Rewrite minimumStack / A-4 comments with no cap claim.
3. chip-safety acceptance test: worst-case 10-seat always-raise hand at the limit stays all safe integers; A-4 factor-10 boundary both sides; each config field read exactly once (counting Proxy).
4. Adjust TASK-1.21's locked assertion per Q-2.

Full spec: doit/TASK-1.31/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Q-1 (user): total-stacks error 'Stacks must total at most 9007199254740991'. Q-2 (user): approved adjusting TASK-1.21's locked assertion in tests/engine/input-hardening.acceptance.test.ts:92-93 (MAX_SAFE-800 accepted, MAX_SAFE throws the new error).

Build: total-stacks limit in validate (Q-1 message), cap-free comments, chip-safety acceptance tests (worst-case always-raise, property, boundary, read-once); TASK-1.21 assertion adjusted per Q-2; gate PASS

Judge R1 PASS 7/7. Code MINOR / J-1-01 resolved: recorded the Q-2 cross-story edit with doit.py unlock TASK-1.21 (reason logged), so test-integrity TASK-1.21 is clean.

Follow-ups (Step 6a): non-array seats -> already TASK-1.32 AC#2 (note added); 4-bet cap -> TASK-1.12. No new tasks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
createHand now rejects configs whose starting stacks total more than Number.MAX_SAFE_INTEGER (RangeError 'Stacks must total at most 9007199254740991'). By chip conservation, every stack, contribution, pot and award stays a safe integer for any legal play. The false raise-cap comments are removed. New acceptance tests cover the worst-case 10-seat always-raise hand, random legal play, the A-4 factor 10 and read-once config access. TASK-1.21's locked seat-3 MAX_SAFE assertion was updated with the user's approval (Q-2) and the lock was re-recorded. Verified: 318 tests pass, lint, typecheck and playtest are clean, and the judge returned PASS. Assumptions to review: A-1 check order, A-2 worst-case stakes, A-3 meaning of 'each field'. Follow-ups: the 4-bet cap is still TASK-1.12; a non-array seats TypeError is owned by TASK-1.32 AC#2.
<!-- SECTION:FINAL_SUMMARY:END -->
