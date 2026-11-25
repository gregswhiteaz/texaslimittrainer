---
id: TASK-6.25
title: >-
  Keep every bot style inside its band in the Mixed line-up now that bots read
  opponents' actions
status: To Do
assignee: []
created_date: '2026-11-25T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.32
parent_task_id: TASK-6
priority: high
ordinal: 239000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.32 (user Q-2). Once bots use action-based ranges and fold to bets, Maniacs stop busting and take over replaced seats in the Mixed line-up, pushing other styles out of their REQ-027 bands (seed 42, 10k hands: TAG PFR 12.0 / Aggression 34.8; Rock VPIP 7.6 / Aggression 31.8). Until this lands, the opt-in slow tests/bots/style-bands.acceptance.test.ts and the manual style-bands.yml workflow are expected to fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the Mixed line-up with bots on action ranges, When the opt-in style-bands check runs (TLH_SLOW_TESTS=1), Then every style's VPIP, PFR and Aggression fall inside their REQ-027 bands
- [ ] #2 Given the fix, When the manual style-bands.yml workflow is dispatched, Then it passes
<!-- AC:END -->
