---
id: TASK-10.17
title: >-
  Ignore a forced-fold-voided raise when classifying the preflop situation, and
  tidy the forced-fold code
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27T05:16:00Z'
updated_date: '2026-11-27T09:11:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.13
references:
  - doc-178
documentation:
  - doc-184
parent_task_id: TASK-10
priority: low
ordinal: 269000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-10.13 (doc-178). After a forced fold voids the leaver's raise (dead money), the engine's amount to match drops, but situationOf (src/advice/preflop.ts:104-118) still counts the voided raise, so bots and advice look up the facing-a-raise chart cell for a pot that is effectively unraised (A-2). Also bundles review r1 tidy-ups: the redundant toAct ternary at src/engine/hand.ts:791 and recomputing sole per winner at src/engine/invariants.ts:292.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the user raises preflop and is force-folded so their raise is voided, When the next bot or the advice classifies the preflop situation, Then it is classified as if the voided raise had not been made (e.g. unopened or facing limpers), and a test pins one such case
- [x] #2 Given hands with no voided raise, When situationOf runs, Then its result is unchanged (seeded playtest output byte-identical)
- [x] #3 Given src/engine/hand.ts forceFold and src/engine/invariants.ts, When the tidy-ups are applied (clockwiseAfter(open, toAct - 1) with a comment; sole computed once), Then all engine tests and the 10,000-hand playtest stay green and byte-identical
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Export pure voidedBets(BetContext) from src/engine/hand.ts (same walk as liveLevels)
2. situationOf drops voided bet/raise records before classifying
3. Add voidedBets to the advice engine/hand lint allow-list + lint probe test
4. Tidy-ups: clockwiseAfter(open, toAct - 1) with comment; sole computed once
5. Tests; 10,000-hand playtest byte-identical vs base

Full spec: doit/TASK-10.17/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: voidedBets helper in engine/hand.ts; situationOf ignores voided records; advice lint allow-list adds voidedBets (A-5) with lint probe; forceFold/invariants tidy-ups; 10k playtest byte-identical; gate PASS

Step 6a: created follow-up (shared voiding walk).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
situationOf now ignores raises that a forced fold voided (new engine helper voidedBets, same rule as liveLevels), so bots and advice treat the pot as unraised or limped; forceFold ring start and invariants `sole` tidied. Verified: 6/6 SPEC items, judge PASS r1, review r1 clean, npm test 1533 passed, 10,000-hand seeded playtest byte-identical to base with 0 invariant violations. Review: A-5 adds voidedBets to the advice lint allow-list for engine/hand imports (pure function over public history); A-1 voiding rule mirrors the engine. Risks/follow-ups: voidedBets duplicates liveLevels' voiding walk with nothing keeping them in step (20k-hand fuzz found 0 mismatches); short all-in call after a voided raise reads as a limper (A-3).
<!-- SECTION:FINAL_SUMMARY:END -->
