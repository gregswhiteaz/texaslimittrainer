---
id: TASK-7.29
title: Decide the hand order and re-raise scaling for observed-opponent ranges
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T16:31:00Z'
updated_date: '2026-11-27T03:27:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.13
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
- [ ] #1 Given the options, When the user decides, Then the decision is recorded here and any change becomes a follow-up story with re-pinned expectations
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
