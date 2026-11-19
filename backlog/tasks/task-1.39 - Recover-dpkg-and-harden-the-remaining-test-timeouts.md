---
id: TASK-1.39
title: Recover dpkg and harden the remaining test timeouts
status: To Do
assignee: []
created_date: '2026-11-19T19:55:00Z'
updated_date: '2026-11-19T20:35:00Z'
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
- [ ] #3 Given main CI run #73 needed 3 attempts (240 s, 240 s, then 164.5 s) for Playwright system dependencies, When the install step's attempt timeout and step timeout are re-tuned (or the apt packages are cached between runs), Then a typical install finishes within its first attempt and the step's total stays under its timeout-minutes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC#3 added 2026-11-19 from CI run #73 (main 769293f): TASK-1.23's sudo kill worked live twice, but attempts 1-2 hit the 240 s limit.
<!-- SECTION:NOTES:END -->
