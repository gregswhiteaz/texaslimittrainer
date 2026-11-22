---
id: TASK-6.23
title: Give bots the same earlier showdowns in the app and on replay
status: To Do
assignee: []
created_date: '2026-11-22T19:31:00Z'
labels:
  - follow-up
  - feature
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.20
  - TASK-6.15
parent_task_id: TASK-6
priority: medium
ordinal: 218000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Moved from TASK-6.15 AC#4 (autopilot Q-1, auto-accepted 2026-11-22). A replay code alone does not carry the earlier-showdowns list; meeting this needs the hand-record / replay-context decision that spike TASK-6.20 owns. Today no bot reads earlierShowdowns, so nothing is lost until a bot uses session memory. The playtest runner already passes the list (TASK-6.9).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand played in the app or replayed with --replay-code, When bots decide, Then they receive the same earlier-showdowns list they had when the hand was first played (the app session passes earlier showdowns like the playtest runner does since TASK-6.9), using the approach the user chose in TASK-6.20
<!-- AC:END -->
