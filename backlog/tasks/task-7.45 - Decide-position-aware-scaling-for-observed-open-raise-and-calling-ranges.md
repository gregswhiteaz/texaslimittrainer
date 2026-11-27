---
id: TASK-7.45
title: Decide position-aware scaling for observed open-raise and calling ranges
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T03:28:00Z'
updated_date: '2026-11-27T20:51:00Z'
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
- [ ] #1 Given the options with measured widths for typical, loose and tight players at each table size, When the user decides, Then the decision is recorded and any change becomes a follow-up story with re-pinned expectations
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-8 (D: open-raise by PFR vs typical PFR, calling by VPIP vs typical VPIP, cap 100)
2. Reword REQ-035.6; changelog 1.18
3. Create the follow-up build story (7 ACs, locked re-pins with owners, 4 golden spots)
4. No code change; tick AC#1

Full spec: doit/TASK-7.45/spec.md
<!-- SECTION:PLAN:END -->
