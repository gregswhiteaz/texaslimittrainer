---
id: TASK-8.5
title: Label positions and situations in plain English for hints
status: To Do
assignee: []
created_date: '2026-11-18T16:24:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.2
references:
  - doc-14
parent_task_id: TASK-8
priority: medium
type: feature
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2: the advice API returns ids (CO, raise-and-calls); REQ-042.6 hint text needs readable labels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given each position id (UTG, HJ, CO, BTN, SB, BB) and situation id, When a label is requested, Then it returns the approved English label (e.g. 'the cutoff', 'facing a raise and calls')
<!-- AC:END -->
