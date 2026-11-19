---
id: TASK-1.31
title: Keep every chip amount a safe integer
status: To Do
assignee: []
created_date: '2026-11-19T04:25:00Z'
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
