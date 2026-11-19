---
id: TASK-1.21
title: Harden engine input validation found in review
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-19T04:05:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.4
references:
  - doc-7
  - doc-9
  - doc-10
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from the TASK-1.2, TASK-1.3 and TASK-1.4 security reviews (non-blocking MINORs). Engine entry points accept a few malformed inputs that a later caller (playtest CLI, session layer, saved data) could pass in.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given parseCard is called with a non-string or a string longer than 3 characters, When it rejects the input, Then it throws a typed error whose message echoes at most 10 characters of the input
- [ ] #2 Given createHand with any stake or stack that is not a safe integer, When the hand is created, Then it is rejected with the existing invalid-config error
- [ ] #3 Given createHand has returned, When the caller mutates the stakes or seats objects it passed in, Then the hand state is unchanged
- [ ] #4 Given nextIntUnbiased(n), When n is outside the range for which it is exactly unbiased, Then it either throws RangeError or is exactly unbiased for that n, and its doc comment states the supported range
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. cards.ts parseCard: non-string → RangeError('Invalid card: expected a string, got <typeof>'); rejected strings over 10 chars echoed as first 10 + '...'; existing messages byte-identical.
2. hand.ts createHand: copy stakes, seats, deck and button first, and build only from the copy (no aliasing); reject non-safe-integer stakes and stacks with the existing RangeError messages; also reject stakes where 10 x minimumStack exceeds MAX_SAFE_INTEGER (A-4).
3. seeded-random.ts nextIntUnbiased: exact for every integer n in 1..2^32 via 16-bit split multiply; RangeError outside; doc comment states the range; results identical to the old formula for n <= 2^21 and powers of two.
4. Tests: acceptance for AC#1-4; BigInt reference check; old-formula equality; 10,000 replay codes plus golden codes deal identical decks; existing locked tests and the playtest unchanged.

Full spec: doit/TASK-1.21/spec.md
<!-- SECTION:PLAN:END -->
