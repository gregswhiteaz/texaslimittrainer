---
id: TASK-1.39
title: Recover dpkg and harden the remaining test timeouts
status: To Do
assignee: []
created_date: '2026-11-19T19:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.23
references:
  - doc-31
parent_task_id: TASK-1
priority: low
type: chore
ordinal: 199000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.23 scope concerns: killing apt mid-install can leave dpkg interrupted for the next attempt, and runInSandbox still has the spawnSync-timeout weakness fixed for the speed-limits test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given retry killed an apt attempt in the Playwright system-dependencies step, When the next attempt starts, Then sudo dpkg --configure -a runs first and an interrupted dpkg no longer fails the install
- [ ] #2 Given tests/support/sandbox.ts runInSandbox times out, When it stops the command, Then the whole process group is killed (via runProcessGroup), with a test using a grandchild that ignores SIGTERM
<!-- AC:END -->
