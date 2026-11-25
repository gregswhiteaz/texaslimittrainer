---
id: TASK-6.19
title: Keep earlier showdowns tied to the player, not the seat
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-25T21:27:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pure helpers rememberShowdown (frozen, capped) and forgetSeats in src/engine/player-view.ts
2. Playtest runner adds each finished hand's showdown, then forgets seats in replaced, so a seat's history covers only its current player
3. Re-pin the locked style-bots test's expected list (Q-1); new acceptance test at 3 seats with replacements; playtest output unchanged

Full spec: doit/TASK-6.19/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
From TASK-6.9: the playtest runner now passes earlier showdowns (runner.ts, last 1,000, keyed by seat). Its seat-vs-player attribution and freezing are this task's ACs #1–#2 — cover the runner too.

Build: rememberShowdown (frozen, capped) and forgetSeats; runner forgets replaced seats after each hand; locked style-bots expected list re-pinned (Q-1); playtest output byte-identical to base on 4 runs incl. Mixed with replacements; new tests fail without forgetSeats. gate PASS.
<!-- SECTION:NOTES:END -->
