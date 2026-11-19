---
id: TASK-1.21
title: Harden engine input validation found in review
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-19T04:25:00Z'
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
documentation:
  - doc-29
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
- [x] #1 Given parseCard is called with a non-string or a string longer than 3 characters, When it rejects the input, Then it throws a typed error whose message echoes at most 10 characters of the input
- [x] #2 Given createHand with any stake or stack that is not a safe integer, When the hand is created, Then it is rejected with the existing invalid-config error
- [x] #3 Given createHand has returned, When the caller mutates the stakes or seats objects it passed in, Then the hand state is unchanged
- [x] #4 Given nextIntUnbiased(n), When n is outside the range for which it is exactly unbiased, Then it either throws RangeError or is exactly unbiased for that n, and its doc comment states the supported range
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. cards.ts parseCard: non-string → RangeError('Invalid card: expected a string, got <typeof>'); rejected strings over 10 chars echoed as first 10 + '...'; existing messages byte-identical.
2. hand.ts createHand: copy stakes, seats, deck and button first, and build only from the copy (no aliasing); reject non-safe-integer stakes and stacks with the existing RangeError messages; also reject stakes where 10 x minimumStack exceeds MAX_SAFE_INTEGER (A-4).
3. seeded-random.ts nextIntUnbiased: exact for every integer n in 1..2^32 via 16-bit split multiply; RangeError outside; doc comment states the range; results identical to the old formula for n <= 2^21 and powers of two.
4. Tests: acceptance for AC#1-4; BigInt reference check; old-formula equality; 10,000 replay codes plus golden codes deal identical decks; existing locked tests and the playtest unchanged.

Full spec: doit/TASK-1.21/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: parseCard non-string RangeError and 10-char echo truncation; createHand copies input first, safe-integer stakes and stacks, 10x minimumStack bound (A-4); nextIntUnbiased exact for 1..2^32 via a 16-bit split multiply; 10,000 replay codes deal identical decks; playtest output byte-identical; gate PASS.

CI run 44456492713 (head 5139015): success first push. Judge round 1: PASS 11/11; playtest byte-identical to base over 4 configurations; 89,435 Lemire cases match a BigInt reference; 20,004 replay codes deal identical decks; each field read exactly once under getters/Proxies. Follow-ups (Step 6a): created TASK-1.31 (keep chip amounts safe; J-1-01 MEDIUM), TASK-1.32 (remaining input guards); AC added to TASK-3.10 (validate restored stakes). Skipped: fold eligibility and SB==BB tests (already ACs on TASK-1.22).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hardened three engine entry points. parseCard now throws RangeError for non-strings and echoes at most 10 characters. createHand snapshots its input (no aliasing) and rejects unsafe-integer stakes and stacks, plus stakes whose pot totals could pass 2^53 (A-4). nextIntUnbiased is exactly unbiased for n in 1..2^32 via an exact 64-bit product, throws RangeError outside that, and documents the range. Deals are unchanged: the 10,000-hand playtest output is byte-identical and 10,004 decks match the legacy shuffle. Verification: 282 tests pass, lint and typecheck clean, CI run 44456492713 green on 5139015; review round 1 clean (no blocking findings, mutants killed, 0 mismatches over 50,000 draws per n against a BigInt reference). Judge pending. Assumptions A-1 to A-6 to review (doc). Size 354 lines vs budget 340 (warn). Follow-ups: parseCards/evaluate type guards, shuffledDeck echo, seat/button message echo, createHand config guard, stack bound after payout, tests for A-4 factor and read-once, TASK-1.22 hand tests, TASK-3.10 session validation.
<!-- SECTION:FINAL_SUMMARY:END -->
