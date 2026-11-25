---
id: TASK-7.22
title: Pin postflop advice rounding and reach the river in its property test
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T19:10:00Z'
updated_date: '2026-11-25T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.3
references:
  - doc-17
documentation:
  - doc-54
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.3 (doc-17) code review and judge (J-1-01, J-1-02): the +1e-9 nudge in toPct changes no observed output and no test pins it; the AC#3 hidden-card property only ever stops on the flop or turn with 6 live players, so its fc.pre discard path never runs. River spots are covered elsewhere, but the property should cover them too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given toPct, When the nudge is either pinned by a case such as 0.5005 -> 50.1 or removed, Then a test fails if the chosen behaviour changes
- [x] #2 Given the AC#3 property, When it runs, Then it reaches flop, turn and river decisions (stop point up to 23) with some non-hero seats folding, and its discard path is exercised
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New tests/advice/postflop-coverage.acceptance.test.ts pins the toPct nudge on all twelve inputs it affects (0.5005 -> 50.1 ... 0.5115 -> 51.2).
2. New property: folds allowed, stop up to 23, seed 7322, 60 runs; asserts flop, turn and river reached, a non-hero fold seen, and the fc.pre discard path hit.

Full spec: doit/TASK-7.22/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: postflop-coverage acceptance test (toPct nudge pinned on 12 inputs, river-reaching fold-enabled property); nudge-removal mutant fails; no src changes; gate PASS

Judge R1 PASS 3/3; nudge removal caught only by the new test; coverage checks proven able to fail.

Follow-ups (Step 6a): stale A-4 rationale corrected by a note on TASK-7.3 (docs-only, no task).

Locked test tests/advice/postflop-coverage.acceptance.test.ts re-pinned for TASK-7.8 Q-3 (auto-accepted; value betting).

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added tests/advice/postflop-coverage.acceptance.test.ts (no production change). AC#1 pins toPct's +1e-9 nudge at 0.5005..0.5115 (50.1..51.2). AC#2 adds an every-street property (folds, stop 0..23, 60 runs) asserting flop/turn/river coverage, folded non-acting seats and discards. Verified: npm test 378 passed, lint/typecheck clean, review and judge round 1 PASS with no findings. Assumptions A-1..A-5 in doc-54 are test-only. Follow-up: doc-17 / TASK-7.3 A-4 justify the nudge with 0.1665, which rounds the same without it; correct examples are 0.5005..0.5115.
<!-- SECTION:FINAL_SUMMARY:END -->
