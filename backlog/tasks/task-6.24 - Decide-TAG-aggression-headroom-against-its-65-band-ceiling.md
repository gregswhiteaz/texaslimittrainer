---
id: TASK-6.24
title: Decide TAG aggression headroom against its 65% band ceiling
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T15:21:00Z'
updated_date: '2026-11-26T20:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-6.11
parent_task_id: TASK-6
priority: medium
ordinal: 226000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-6.11 (and TASK-6.16/6.17/7.9 judge notes): TAG aggression measures 63.5–64.2% over 100k hands against the REQ-027.1 band 45–65%, and short --check-styles runs (2k hands) read 67.2% and fail with no tuning problem. A later advice change could push the 100k value out. Options: widen the band (requirements change), tune TAG postflop (e.g. a small value bar like the Rock's), or document a minimum run length for --check-styles.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the options (widen band / tune TAG / document minimum run length), When the user decides, Then the decision is recorded on this task and any resulting change is a follow-up story
<!-- AC:END -->
