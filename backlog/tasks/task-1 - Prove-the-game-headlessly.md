---
id: TASK-1
title: Prove the game headlessly
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - epic
  - dream-limit-holdem-trainer
dependencies:
  - TASK-1.1
  - TASK-1.7
  - TASK-1.2
  - TASK-1.3
  - TASK-1.4
  - TASK-1.5
  - TASK-1.6
  - TASK-1.8
  - TASK-1.9
  - TASK-1.10
  - TASK-1.11
  - TASK-1.12
  - TASK-1.13
  - TASK-1.14
  - TASK-1.15
  - TASK-1.16
  - TASK-1.17
  - TASK-1.18
documentation:
  - doc-1
  - doc-2
type: feature
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A seeded, pure fixed-limit Hold'em rules engine plays complete hands headlessly and a playtest runner proves it, on a strict TypeScript toolchain with one-command checks and CI.

Done when: every child story is Done (this epic depends on all of its stories).

Plan key: E01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Toolchain, npm check scripts and CI run on every push from the first story [REQ-063.1, REQ-064.1]
- [ ] #2 Every hand follows casino fixed-limit rules: blinds, order of action, bet + 3 raises cap, all-ins, side pots, showdown, button movement [REQ-014.4, REQ-016.3, REQ-018.3, REQ-019.1]
- [ ] #3 Seeded playtest runs report zero invariant violations over 1,000,000 hands and are reproducible [REQ-056.2, REQ-062.4]
<!-- AC:END -->
