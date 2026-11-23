---
id: TASK-7.28
title: Count straight-draw outs only when a hole card is part of the draw
status: To Do
assignee: []
created_date: '2026-11-23T08:19:00Z'
updated_date: '2026-11-23T08:38:00Z'
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
- [ ] #2 Given hole 9c 2d and board 5h 6s 7h, When drawOuts runs, Then it returns the 8 straight-draw outs (a hole card extends the run)
- [ ] #3 Given the change, When the playtest and style-bands checks run, Then all four styles stay inside their bands and any changed playtest SHA is recorded
- [ ] #4 Given hole 9h 8h and board 7h 6h 2h (a made flush), When drawOuts runs, Then it lists no straight-draw outs (a made flush needs no draw)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.9 judge note (made flush still listed OESD outs).
<!-- SECTION:NOTES:END -->
