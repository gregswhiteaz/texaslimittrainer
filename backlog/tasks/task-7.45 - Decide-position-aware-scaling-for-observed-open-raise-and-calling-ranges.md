---
id: TASK-7.45
title: Decide position-aware scaling for observed open-raise and calling ranges
status: Done
assignee:
  - '@claude'
created_date: '2026-11-27T03:28:00Z'
updated_date: '2026-11-27T21:29:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.44
references:
  - doit/TASK-7.29/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-104
  - doc-197
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 268000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up spike from TASK-7.29 (decision: Q-4 a). Open-raise lines scale toward raw PFR and calling lines toward raw VPIP, which ignores position. For an ordinary 22/18 player at 100 hands the 6-max BTN open goes 34.54% to 18%, BB call-raise 41.48% to 22% and SB limp 44.65% to 22%. Reusing the TASK-7.29 ratio rule for calling lines would push loose players to 100% (BB call-raise at 60/45). Lay out options with measured numbers (e.g. ratio with a cap, ratio for open-raise only, keep) and record the user's decision. Evidence: doit/TASK-7.29/spec.md §3 and the Q-4 options.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the options with measured widths for typical, loose and tight players at each table size, When the user decides, Then the decision is recorded and any change becomes a follow-up story with re-pinned expectations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-8 (D: open-raise by PFR vs typical PFR, calling by VPIP vs typical VPIP, cap 100)
2. Reword REQ-035.6; changelog 1.18
3. Create the follow-up build story (7 ACs, locked re-pins with owners, 4 golden spots)
4. No code change; tick AC#1

Full spec: doit/TASK-7.45/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (TASK-7.45 Q-1, user, 2026-11-27): option D, recorded as decision-8. Open-raise scales o = min(100, d x observed PFR / typical PFR); limp, call-raise and call-three-bet scale o = min(100, d x observed VPIP / typical VPIP). Typical VPIP = healthy VPIP midpoint per size (heads-up 77.5, 6-max 24, full ring 16.5); typical PFR unchanged (57.5 / 18 / 12.5). Blend, 30-hand threshold, resize rule and the three-bet/four-bet rule (TASK-7.44) unchanged.

Key numbers (n = 100): under today's raw rule a typical 6-max 24/18 player's BTN open goes 34.54 -> 18.0 and SB limp 44.65 -> 24.0; a typical heads-up caller's BTN call-raise goes 11.76 -> 77.5. Under D the typical player keeps every authored default at every size and position survives (BTN stays wider than UTG). The 100 cap binds only on SB limp and BB call-raise, for VPIP >= about 45-60 (6-max SB limp 53.8, BB call-raise 57.9; full ring SB limp 44.7, BB call-raise 59.8).

REQ-035.6 reworded in dreams/limit-holdem-trainer/requirements.md (changelog row 1.18). No product code changed; implementation, TYPICAL_VPIP constant, docs and locked-test re-pins go to the follow-up story TASK-7.48. Full measured tables for options A-D and the golden-spot widths: doit/TASK-7.45/spec.md section 3.

Build: decision-8; REQ-035.6 + changelog 1.18; follow-up TASK-7.48; gate PASS

Step 6a: none new (TASK-7.48 owns the work; r2 NITs already noted on TASK-7.48).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision spike, no product code. User chose Q-1 D (decision-8): open-raise width scales by PFR relative to typical PFR and calling lines (limp, call-raise, call-three-bet) by VPIP relative to typical VPIP (77.5 / 24 / 16.5), each capped at 100; a typical player now keeps the authored ranges. REQ-035.6 reworded in requirements.md (changelog 1.18). Follow-up TASK-7.48 (7 ACs) implements it with the complete locked re-pin list and owners. Verification: 4 gate runs PASS, review r2 clean (r1 BLOCKER: incomplete re-pin list, fixed in TASK-7.48; locked spec lists stay incomplete, TASK-7.48 is authoritative), judge PASS r1 (5/5). Assumptions to review: A-4 typical VPIP = healthy band midpoint; A-1 evidence lives in notes, not the decision body. Risks: golden a6s needs re-tuning with user sign-off in TASK-7.48; 100 cap binds on 6-max/full-ring blind lines for VPIP of about 45-60 and up.
<!-- SECTION:FINAL_SUMMARY:END -->
