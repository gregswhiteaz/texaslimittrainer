---
id: TASK-7.47
title: Make the short-handed TAG postflop test cover river raises
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T10:03:00Z'
updated_date: '2026-11-27T13:23:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.46
references:
  - doc-185
parent_task_id: TASK-7
priority: low
ordinal: 273000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.46 judge J-1-03: the 50-hand sample in tests/bots/tag-short-handed.acceptance.test.ts has no river raises, so a river raise->call drift in decideTag is not caught.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given tests/bots/tag-short-handed.acceptance.test.ts (owner TASK-7.37/7.46), When its sample is enlarged or a targeted river-raise view is added, Then a mutation turning a TAG river raise into a call fails the test, with no assertion loosened
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New test tests/bots/tag-short-handed-river.acceptance.test.ts: 200 hands, 3 seats, seed 3; every river decision equals the advice engine and raises where it raises; at least one river raise
2. Mutation check: river raise->call fails the test; locked file and src untouched

Full spec: doit/TASK-7.47/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: new river-raise test (200 hands, 3 seats, seed 3, 6 river raises); river raise->call mutation fails it; gate PASS
<!-- SECTION:NOTES:END -->
