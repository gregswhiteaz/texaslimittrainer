---
id: TASK-6.19
title: Keep earlier showdowns tied to the player, not the seat
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
parent_task_id: TASK-6
priority: medium
type: feature
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-1.5. earlierShowdowns is keyed by seat number. When a busted cash bot is replaced (REQ-007.5) or seats change in a sit-and-go, a new occupant would inherit the previous player's shown hands, so bots could profile the wrong player. The list is also shared by reference across views.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a bot at seat 4 is replaced, When later views are built, Then no earlier showdown of the previous seat-4 player is attributed to the new bot
- [ ] #2 Given the session appends an earlier showdown, When any seat policy receives it, Then the entry is frozen and cannot be changed by a policy
<!-- AC:END -->
