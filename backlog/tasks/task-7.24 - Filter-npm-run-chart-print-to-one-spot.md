---
id: TASK-7.24
title: Filter npm run chart:print to one spot
status: To Do
assignee: []
created_date: '2026-11-19T03:52:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.19
references:
  - doc-28
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 190000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.19 (doc-28): chart:print always prints all 26 spots; reviewing one spot means scrolling a long output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given npm run chart:print -- --spot "CO re-raise", When it runs, Then only that spot's grid and percentages are printed
- [ ] #2 Given an unknown spot name, When it runs, Then it exits 2 with a usage message listing valid spots
<!-- AC:END -->
