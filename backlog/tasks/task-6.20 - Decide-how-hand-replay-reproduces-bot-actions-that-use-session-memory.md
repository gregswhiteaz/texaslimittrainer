---
id: TASK-6.20
title: Decide how hand replay reproduces bot actions that use session memory
status: To Do
assignee: []
created_date: '2026-11-18T07:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-1.5
references:
  - doc-13
  - dreams/limit-holdem-trainer/requirements.md
parent_task_id: TASK-6
priority: medium
type: spike
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.5. REQ-028.2 says replaying a hand reproduces every bot action, but if bots use earlierShowdowns or observed opponent stats, a single hand's record (REQ-052.2) lacks that context. Needs a user decision before bot memory is built.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the options (store session context in hand records, forbid cross-hand bot memory, or relax REQ-028.2), When the user decides, Then the decision is recorded as a Backlog decision and requirements.md is updated if needed
<!-- AC:END -->
