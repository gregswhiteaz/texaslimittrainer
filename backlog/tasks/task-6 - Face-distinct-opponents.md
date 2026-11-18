---
id: TASK-6
title: Face distinct opponents
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-6.1
  - TASK-6.18
  - TASK-6.2
  - TASK-6.3
  - TASK-6.4
  - TASK-6.5
  - TASK-6.6
  - TASK-6.15
  - TASK-6.7
  - TASK-6.8
  - TASK-6.9
  - TASK-6.10
  - TASK-6.11
  - TASK-6.16
  - TASK-6.17
  - TASK-6.12
  - TASK-6.13
  - TASK-6.14
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 60
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user faces recognisable, reproducible bot styles (TAG, Calling station, Maniac, Rock) built on the advice engine, whose measured profiles and strength are proven headlessly.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each style's measured VPIP, PFR and aggression fall inside its target band in 100,000-hand playtests [REQ-027.5]
- [ ] #2 A TAG bot beats five bots of any weaker style with 95% confidence [REQ-030.1, REQ-030.2, REQ-030.3]
- [ ] #3 Replaying a hand reproduces every bot decision [REQ-028.2]
<!-- AC:END -->
