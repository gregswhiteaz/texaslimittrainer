---
id: TASK-7.28
title: Count straight-draw outs only when a hole card is part of the draw
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T08:19:00Z'
updated_date: '2026-11-26T03:52:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.9
parent_task_id: TASK-7
priority: medium
ordinal: 224000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
From TASK-7.9 review (MINOR): drawOuts counts an open-ended straight draw made entirely by board cards (e.g. 7c 2d on 5h 6s 7h 8d gets 8 outs, the 7c only pairs the board), while the flush half already excludes board-only draws. Every player shares a board-only draw, so advice should not credit hero with those outs. hasOpenEnder (ranges classification) uses the same definition — decide whether range classification changes too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given hole 7c 2d and board 5h 6s 7h 8d, When drawOuts runs, Then it returns no straight-draw outs
- [ ] #2 Given the change, When the playtest and style-bands checks run, Then all four styles stay inside their bands and any changed playtest SHA is recorded
- [ ] #3 Given hole 9h 8h and board 7h 6h 2h (a made flush), When drawOuts runs, Then it lists no straight-draw outs (a made flush needs no draw)
- [ ] #4 Given hole 8c 2d and board 5h 6s 7h, When drawOuts runs, Then it returns the 8 straight-draw outs (the four 4s and four 9s; a hole card extends the run)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Straight outs need a hole rank in the four-card run that isn't on the board
2. Skip straight outs on a made flush or straight
3. Acceptance tests on fixed cards (AC#1, #3, #4); playtest SHA and slow style-bands check (AC#2)
4. Update docs/advice/postflop-rules.md

Full spec: doit/TASK-7.28/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.9 judge note (made flush still listed OESD outs).

AC#2 replaced (Q-1, auto-accepted): the original example 9c 2d on 5h 6s 7h is only a gutshot, so it now uses 8c 2d; the replacement is the last AC listed
<!-- SECTION:NOTES:END -->
