---
id: TASK-2
title: Launch and set up a session
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-2.1
  - TASK-2.2
  - TASK-2.3
  - TASK-2.4
  - TASK-2.5
  - TASK-2.8
  - TASK-2.9
  - TASK-2.6
  - TASK-2.14
  - TASK-2.7
  - TASK-2.15
  - TASK-2.10
  - TASK-2.12
  - TASK-2.13
  - TASK-2.16
  - TASK-2.17
  - TASK-2.11
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user launches TLH Trainer, lands on Home and configures a session (game type, table size, stakes, line-up, speed) or resumes a paused one.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Splash opens Home automatically; Home offers New game and Resume session when a paused session exists [REQ-001.2, REQ-002.4]
- [ ] #2 Game Config offers 2-10 players, cash or sit-and-go, the six stakes and line-up presets, pre-filled from the last session [REQ-005.2, REQ-006.1, REQ-012.1]
- [ ] #3 A session interrupted by going Home or closing the app resumes at the start of the next hand [REQ-004.2, REQ-004.3]
<!-- AC:END -->
