---
id: TASK-8.5
title: Label positions and situations in plain English for hints
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-26T06:46:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SITUATION_LABELS copy in src/advice/explanations.ts (Q-1)
2. positionLabel/situationLabel in src/advice/explain.ts; chartBasisText uses positionLabel (same output)
3. Acceptance test tests/advice/labels.acceptance.test.ts
4. One paragraph in docs/advice/explanations.md

Full spec: doit/TASK-8.5/spec.md
<!-- SECTION:PLAN:END -->
