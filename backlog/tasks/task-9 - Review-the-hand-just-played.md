---
id: TASK-9
title: Review the hand just played
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-9.1
  - TASK-9.3
  - TASK-9.2
  - TASK-9.4
  - TASK-9.5
  - TASK-9.6
  - TASK-9.7
  - TASK-9.8
  - TASK-9.9
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 90
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After each hand the user sees every decision they made graded Correct / Minor / Major with the recommended action, the numbers and the reason.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Hand Review panel opens within 1 s of a hand ending, listing each user decision with grade and numbers [REQ-043.1, REQ-055.2]
- [ ] #2 Feedback never blocks practice: the next hand waits only while the panel is open [REQ-024.2, REQ-043.7]
<!-- AC:END -->
