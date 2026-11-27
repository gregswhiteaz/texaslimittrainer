---
id: TASK-10.18
title: Keep the engine's bet-voiding rule in one place (liveLevels and voidedBets)
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27T09:11:00Z'
updated_date: '2026-11-27T10:28:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.17
references:
  - doc-184
documentation:
  - doc-186
parent_task_id: TASK-10
priority: low
ordinal: 271000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-10.17 (doc-184, review r1 MINOR). voidedBets (src/engine/hand.ts) copies liveLevels' forced-fold voiding walk; nothing keeps the two in step, so a later rule change could make bots/advice disagree with the engine's amount to match.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given src/engine/hand.ts, When liveLevels and voidedBets are refactored to share one voiding walk (or a property test over random forced-fold hands asserts they agree), Then a change to the rule in one place cannot silently diverge, all engine/advice tests pass, and the 10,000-hand seeded playtest stays byte-identical
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. One private single-pass voiding walk in src/engine/hand.ts returning levels and voided indices
2. liveLevels and voidedBets become thin wrappers
3. Property test: voidedBets agrees with currentBet after every forced fold
4. 10k playtest byte-identical vs 46e6e83

Full spec: doit/TASK-10.18/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: single private voidingWalk; liveLevels/voidedBets thin wrappers; property agreement test; 10k playtest byte-identical; gate PASS

Step 6a: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Merged the duplicated forced-fold voiding walk in src/engine/hand.ts into one private voidingWalk; liveLevels and voidedBets are now thin wrappers (no behaviour change). Added a property test that voidedBets agrees with the engine's currentBet after every forced fold. Verified: npm test 1534 passed, lint/typecheck clean, 10,000-hand seed-42 playtest byte-identical to base, judge PASS 3/3, review r1 clean (one NIT). Assumptions to review: A-1 single-pass walk, A-2 keep wrappers, A-3 add the optional property test. Risks: none; changed lines 110 vs budget 90 (warn only).
<!-- SECTION:FINAL_SUMMARY:END -->
