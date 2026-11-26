---
id: TASK-6.20
title: Decide how hand replay reproduces bot actions that use session memory
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-26T20:24:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record Backlog decision: bots decide from the current hand only (Q-1 = B)
2. requirements.md: REQ-029.3 + change-log row 1.12
3. Doc comment on PlayerView.earlierShowdowns
4. Guard test: bot actions identical with a different earlier-showdowns list
5. Archive TASK-6.23 as not needed

Full spec: doit/TASK-6.20/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: REQ-029.3 + change-log 1.12; PlayerView.earlierShowdowns doc comment; guard test bot-actions-ignore-earlier-showdowns (fails with 55 mismatches when a bot reads the list); gate PASS

Recorded decision-1 (accepted): bot decisions use only the current hand (Q-1 = B). TASK-6.23 archived as not needed.
<!-- SECTION:NOTES:END -->
