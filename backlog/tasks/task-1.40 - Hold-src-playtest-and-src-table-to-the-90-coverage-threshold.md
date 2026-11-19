---
id: TASK-1.40
title: Hold src/playtest and src/table to the 90% coverage threshold
status: To Do
assignee: []
created_date: '2026-11-19T20:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.26
references:
  - doc-32
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 200000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.26 (A-1): the two folders now get the headless lint rule but not the 90% coverage threshold, because HEADLESS_DIRS also drives TASK-1.1's locked coverage test. Both are near 100% today, so this pins it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given vite.config.ts, When coverage runs, Then src/playtest/** and src/table/** are held to the same 90% thresholds as engine, bots, advice and stats
- [ ] #2 Given TASK-1.1's coverage test (unlocked with a recorded reason), When it runs, Then it checks the widened glob and LINT_ONLY_HEADLESS_DIRS is folded into HEADLESS_DIRS
<!-- AC:END -->
