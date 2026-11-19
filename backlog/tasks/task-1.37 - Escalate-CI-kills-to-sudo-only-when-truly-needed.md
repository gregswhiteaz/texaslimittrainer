---
id: TASK-1.37
title: Escalate CI kills to sudo only when truly needed
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
priority: medium
type: chore
ordinal: 197000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.23 (judge J-1-01 MEDIUM, security MINOR, code MINOR, spec scope concern). retry.js's sudo fallback can fire spuriously while a SIGKILLed child is still dying (seen on macOS), can race a PGID reuse, runs two reap loops at once, and the cancellation path never escalates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a child that is SIGKILLed at the end of the grace period, When the reap loop's next group kill returns EPERM once and the group is gone at the next poll, Then sudo is never called
- [ ] #2 Given the group no longer exists, When retry is about to call sudoKillGroup, Then groupExists is checked immediately before and sudo is skipped
- [ ] #3 Given the kill timer and the child's exit both start reaping, When the attempt ends, Then a single shared reap runs and each sudo call and log line appears at most once per poll
- [ ] #4 Given retry.js receives SIGINT or SIGTERM while an attempt runs under sudo, When it stops the attempt, Then a refused group kill escalates to sudo -n kill exactly as on timeout
<!-- AC:END -->
