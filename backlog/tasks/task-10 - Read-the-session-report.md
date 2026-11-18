---
id: TASK-10
title: Read the session report
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-10.1
  - TASK-10.3
  - TASK-10.4
  - TASK-10.2
  - TASK-10.5
  - TASK-10.6
  - TASK-10.7
  - TASK-10.8
  - TASK-10.11
  - TASK-10.12
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 100
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a session ends the user sees and keeps a play-style report: result, error rates, hint usage, style stats against healthy ranges and the top leaks.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every report value equals a value recomputed from the stored hand records [REQ-044.2, REQ-044.4]
- [ ] #2 Up to three leaks are shown with evidence and a one-sentence fix [REQ-044.5, REQ-047.2]
- [ ] #3 Home shows the latest session snapshot linking to its report [REQ-003.1, REQ-003.2]
<!-- AC:END -->
