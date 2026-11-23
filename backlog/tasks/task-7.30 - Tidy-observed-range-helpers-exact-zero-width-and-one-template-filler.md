---
id: TASK-7.30
title: 'Tidy observed-range helpers: exact zero width and one template filler'
status: To Do
assignee: []
created_date: '2026-11-23T19:21:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.13
references:
  - doc-104
parent_task_id: TASK-7
priority: low
ordinal: 229000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.13 (doc-104). scaledWidthPct can return about 3.55e-15 instead of exactly 0 when the observed PFR/VPIP is 0 (judge J-2-01; the range is still AA). basisText fills its placeholder with String.replace instead of the existing fillTemplate (code review MINOR basis-text-reimplements-fill-template).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a CO open-raiser observed for 100 hands with PFR 0, When its scaled width is computed, Then the width is exactly 0 (toBe(0), not toBeCloseTo)
- [ ] #2 Given basisText for 45 hands, When it is rendered, Then it is produced through fillTemplate and reads exactly 'based on 45 hands of this opponent', and no other template-filling helper remains in src/advice
<!-- AC:END -->
