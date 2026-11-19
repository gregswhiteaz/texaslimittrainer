---
id: TASK-1.31
title: Keep every chip amount a safe integer
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-19T04:25:00Z'
updated_date: '2026-11-19T23:24:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.21
references:
  - doc-29
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
- [ ] #1 Given any config createHand accepts, When the hand is played legally to the end, Then every stack, contribution, pot and award stays a safe integer (stacks bounded in createHand, or proven via the TASK-1.12 cap), and a test plays the worst case
- [ ] #2 Given stakes with bigBet 2^49 and stacks 2^52, When createHand validates them, Then it rejects them with 'Invalid stakes' (pins the factor 10 in the A-4 bound)
- [ ] #3 Given a config built from one-shot getters or a counting Proxy, When createHand runs, Then each field is read exactly once (test)
- [ ] #4 Given minimumStack's doc comment, When read, Then it does not claim a cap the engine doesn't enforce
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
<!-- SECTION:NOTES:END -->
