---
id: TASK-7.22
title: Pin postflop advice rounding and reach the river in its property test
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T19:10:00Z'
updated_date: '2026-11-21T03:14:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.3
references:
  - doc-17
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.3 (doc-17) code review and judge (J-1-01, J-1-02): the +1e-9 nudge in toPct changes no observed output and no test pins it; the AC#3 hidden-card property only ever stops on the flop or turn with 6 live players, so its fc.pre discard path never runs. River spots are covered elsewhere, but the property should cover them too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given toPct, When the nudge is either pinned by a case such as 0.5005 -> 50.1 or removed, Then a test fails if the chosen behaviour changes
- [ ] #2 Given the AC#3 property, When it runs, Then it reaches flop, turn and river decisions (stop point up to 23) with some non-hero seats folding, and its discard path is exercised
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New tests/advice/postflop-coverage.acceptance.test.ts pins the toPct nudge on all twelve inputs it affects (0.5005 -> 50.1 ... 0.5115 -> 51.2).
2. New property: folds allowed, stop up to 23, seed 7322, 60 runs; asserts flop, turn and river reached, a non-hero fold seen, and the fc.pre discard path hit.

Full spec: doit/TASK-7.22/spec.md
<!-- SECTION:PLAN:END -->
