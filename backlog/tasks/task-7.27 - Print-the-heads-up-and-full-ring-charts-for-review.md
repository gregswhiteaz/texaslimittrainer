---
id: TASK-7.27
title: Print the heads-up and full-ring charts for review
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-22T22:50:00Z'
updated_date: '2026-11-26T14:18:00Z'
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
- [x] #1 Given npm run chart:print with a size argument (heads-up, 6-max, full-ring), When it runs, Then it prints that chart's grid per spot with its justification
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. chartPrintMain(argv, io): no argument = today's 6-max grids; heads-up / 6-max / full-ring = review format with chart and per-spot justifications
2. Bad input: stderr message + usage, exit 2
3. Spawn tests for each size and unknown size; unit tests for the formatter

Full spec: doit/TASK-7.27/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: chart:print -- heads-up|6-max|full-ring prints the review format with justifications; no-argument output unchanged; bad input exits 2; gate PASS

Judge r1 PASS (7/7 SPEC items)
<!-- SECTION:NOTES:END -->
