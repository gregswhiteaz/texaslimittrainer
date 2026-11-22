---
id: TASK-7.27
title: Print the heads-up and full-ring charts for review
status: To Do
assignee: []
created_date: '2026-11-22T22:50:00Z'
labels:
  - follow-up
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.6
references:
  - doc-87
parent_task_id: TASK-7
priority: low
ordinal: 221000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.6 (doc-87): npm run chart:print prints only the 6-max chart, but the Claude-authored heads-up and full-ring charts need the user's review.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given npm run chart:print with a size argument (heads-up, 6-max, full-ring), When it runs, Then it prints that chart's grid per spot with its justification
<!-- AC:END -->
