---
id: TASK-5
title: Play a sit-and-go
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-5.1
  - TASK-5.2
  - TASK-5.4
  - TASK-5.10
  - TASK-5.5
  - TASK-5.6
  - TASK-5.7
  - TASK-5.8
  - TASK-5.3
  - TASK-5.9
  - TASK-5.11
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 50
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user plays a single-table sit-and-go with rising limits until they bust or win, and gets a finishing position.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Levels rise every 10 hands on the published schedule and busted bots are not replaced [REQ-008.2, REQ-008.3, REQ-008.4]
- [ ] #2 The sit-and-go ends with the user's finishing position out of the starting players [REQ-008.5, REQ-008.6]
<!-- AC:END -->
