---
id: TASK-1.56
title: Keep postflop-ranges unit tests inside the coverage-run time limit
status: To Do
assignee: []
created_date: '2026-11-24T01:43:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - ci
milestone: m-1
dependencies: []
parent_task_id: TASK-1
priority: high
ordinal: 230000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CI's 'Unit tests with coverage' job timed out (30 s testTimeout) on tests/advice/postflop-ranges.test.ts > 'actions mode is total, deterministic and falls back' twice in an hour: main run 45302242833 (d72e593, passed on re-run) and branch run 45306421540 (doit/TASK-2.6). Locally the test takes 1.7 s plain and 8.4 s under coverage; 'default advice stays on every unseen combo' takes 5.2 s under coverage. CI runners are slower, so the margin is gone. Fix the timing without dropping or loosening any assertion (e.g. a measured per-test timeout, moving the heavy case to the uncovered sweep job, or making the equity work cheaper).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the unit tests with coverage run on a CI runner, When tests/advice/postflop-ranges.test.ts runs, Then every test finishes with at least 3x headroom under its timeout, shown by the measured duration in the CI log
- [ ] #2 Given the change, When the test file is compared with its previous version, Then no assertion is removed or loosened and the number of checked cases is unchanged
- [ ] #3 Given three consecutive CI runs on the story branch, When they finish, Then 'Unit tests with coverage' passes in all three
<!-- AC:END -->
