---
id: TASK-7.29
title: Decide the hand order and re-raise scaling for observed-opponent ranges
status: To Do
assignee: []
created_date: '2026-11-23T16:31:00Z'
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
