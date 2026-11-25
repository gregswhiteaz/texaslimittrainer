---
id: TASK-2.19
title: Fit Game Config's opponent rows on a phone screen
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T02:46:00Z'
updated_date: '2026-11-25T18:51:00Z'
labels:
  - follow-up
  - bug
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.8
references:
  - doc-91
parent_task_id: TASK-2
priority: medium
ordinal: 222000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.9 judge (J-1-02, doc-91). Since TASK-2.8 added a Style select to each bot row, Game Config scrolls sideways at 320–375 px (scrollWidth 388).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Game Config at 320 px and 375 px wide with 10 players, When it renders, Then the page does not scroll sideways and every bot row's name, seat and Style select are fully visible and usable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. CSS only: bot rows wrap on narrow screens, Style control right-aligned on its own line; desktop unchanged
2. New e2e at 320 and 375 px (10 players): no sideways scroll, 16px gutter, every row's seat, name and 44px select visible and usable

Full spec: doit/TASK-2.19/spec.md
<!-- SECTION:PLAN:END -->
