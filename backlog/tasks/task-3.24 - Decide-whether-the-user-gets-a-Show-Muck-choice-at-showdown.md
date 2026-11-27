---
id: TASK-3.24
title: Decide whether the user gets a Show/Muck choice at showdown
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-21T08:35:00Z'
updated_date: '2026-11-27T17:47:00Z'
labels:
  - follow-up
  - spike
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.15
references:
  - doc-62
parent_task_id: TASK-3
priority: low
ordinal: 210000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spike from TASK-1.15 (doc-62). TASK-1.15 Q-1 was auto-accepted in autopilot: the user's hand follows the same automatic show/muck rule as the bots (shown if it beats or ties the best hand shown so far, otherwise mucked). Casinos let a player choose to show a losing hand or muck a winning-but-uncalled one; whether the trainer should offer that choice is a product decision for the user.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The user decides between keeping automatic show/muck for their own hand and adding a Show/Muck prompt, and the decision is recorded in this task's notes (and, if a prompt is chosen, a story is created for it)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-6 (automatic show/muck for the user's hand, no control, uncalled winners never show)
2. Reword REQ-019.5/REQ-019.8 for the user's hand; changelog 1.17
3. No code change; evidence in notes
4. Tick AC#1

Full spec: doit/TASK-3.24/spec.md
<!-- SECTION:PLAN:END -->
