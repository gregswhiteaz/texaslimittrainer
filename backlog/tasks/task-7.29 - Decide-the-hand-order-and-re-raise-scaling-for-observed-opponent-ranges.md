---
id: TASK-7.29
title: Decide the hand order and re-raise scaling for observed-opponent ranges
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T16:31:00Z'
updated_date: '2026-11-27T03:52:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.13
documentation:
  - doc-177
parent_task_id: TASK-7
priority: medium
ordinal: 228000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.13 review: the approved hand order (equity vs one random hand) ranks Q2o/J2o/K2o above suited connectors (76s/65s/87s), the opposite of how loose limit players choose hands; and scaling every raising line by PFR widens re-raise ranges a lot (a 22/18 player's UTG four-bet range goes 2.56% → 18% at 100 hands). Options: keep; switch to a playability-weighted order (e.g. equity vs a typical calling range, or an authored order); scale re-raise lines by a 3-bet stat instead of PFR.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the options, When the user decides, Then the decision is recorded here and any change becomes a follow-up story with re-pinned expectations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-5 (Q-1 B, Q-2 B, Q-3 C, Q-4 a)
2. Reword REQ-035.6 for re-raise scaling vs typical PFR; changelog row 1.14
3. No product code change; evidence in task notes
4. Create follow-ups FU-A (resize authored range + 3-way hand order), FU-B (re-raise scaling), FU-C (spike: open-raise/calling lines)
5. Tick AC#1 with pointers

Full spec: doit/TASK-7.29/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (user, 2026-11-26, doit/TASK-7.29/qa.md), recorded as decision-5:
- Q-1 B: an observed range is the authored default range resized by the hand order (rule A-5), not a prefix of the order (reverses TASK-7.13 A-8).
- Q-2 B: the hand order ranks hands by equity against three random hands (seeded computeEquity; hand-order.json keeps format v1 and its path).
- Q-3 C: three-bet and four-bet lines use o = min(100, d x observed PFR / typical PFR), typical PFR = healthy PFR midpoint per table size (heads-up 57.5, 6-max 18, full ring 12.5). Open-raise keeps raw PFR, calling lines raw VPIP.
- Q-4 a: open-raise and calling-line scaling goes to a follow-up spike.

Key numbers: hand-order.json ranks K2o #87 above 87s #99, Q2o #108 above 76s #116, J2o #123 above 65s #128. The 6-max UTG four-bet width goes 2.56% -> 18% for a 22/18 player at 100 hands under today's raw-PFR scaling (2.56% kept under Q-3 C). Full evidence: doit/TASK-7.29/spec.md §3 (current system, measured orders, re-raise table) and §5 (option costs, Q-3 C values).

REQ change: REQ-035.6 reworded for the relative re-raise rule; changelog row 1.14 (dreams/limit-holdem-trainer/requirements.md). REQ-035.2 unchanged.
Follow-ups: TASK-7.43 (FU-A, resize + three-way hand order; depends on TASK-7.29), TASK-7.44 (FU-B, relative re-raise scaling; depends on TASK-7.43), TASK-7.45 (FU-C spike, open-raise and calling-line scaling; depends on TASK-7.44).
No product code changed (D-5).

Build: decision-5, REQ-035.6 + changelog 1.14, follow-ups TASK-7.43/7.44/7.45; gate PASS

Step 6a: TASK-7.44 AC added (concrete widths, review r1 MINOR). Follow-ups TASK-7.43, 7.44, 7.45.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision spike, recorded as decision-5 (accepted): resize the authored default range for observed opponents (Q-1 B); rank hands by equity vs three random hands (Q-2 B); scale three-bet/four-bet lines by PFR relative to typical PFR, o = min(100, d x PFR / typical PFR) (Q-3 C); open-raise and calling lines go to a spike (Q-4 a). Only change: REQ-035.6 reworded and changelog 1.14 in requirements.md; no product code. Follow-ups: TASK-7.43 (range construction and hand order), TASK-7.44 (re-raise scaling), TASK-7.45 (open-raise/calling spike). Verification: npm test 1497 passed/56 skipped, lint and typecheck clean, review r1 no blockers, judge r1 PASS. Assumptions to review: A-1 empty decision body, A-2 three follow-ups, A-4 typical PFR = healthy-band midpoints (57.5/18/12.5), A-5 resize rule. Risks: product code disagrees with REQ-035.6 for 3-/4-bet lines until TASK-7.44 ships; TASK-7.44 AC#3 lacks concrete widths (MINOR, to be added); observed-ranges AC#2 needs unlock and re-pin in TASK-7.43.
<!-- SECTION:FINAL_SUMMARY:END -->
