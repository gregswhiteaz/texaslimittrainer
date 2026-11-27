---
id: TASK-6.30
title: >-
  Decide whether the style check's one-action rule needs a minimum sample for
  rare mixed spots
status: To Do
assignee: []
created_date: '2026-11-27T10:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.46
references:
  - doc-185
parent_task_id: TASK-6
priority: low
ordinal: 272000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.46 (doc-185, Q-2). REQ-027.5 fails --check-styles when any mixed spot used only one action. At 3 seats the TAG preflop-limpers spot occurs about once in 50,000-100,000 hands, so npm run playtest -- --size 3 --check-styles exits 1 even though every band holds. Options: a minimum sample before the rule applies; keep the rule; exclude spots below N occurrences. If the rule changes, restore the exit-0 assertion (or rename) in tests/playtest/check-styles-three-seats.acceptance.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the options above, When the user decides, Then the decision is recorded and any change becomes a follow-up story that restores an exit-0 check (or renames the slow test) for 3-seat --check-styles
<!-- AC:END -->
