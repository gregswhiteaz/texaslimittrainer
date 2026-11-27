---
id: TASK-7.37
title: Bring short-handed TAG VPIP inside its healthy range at 3 and 4 seats
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T10:09:00Z'
updated_date: '2026-11-27T08:19:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.35
references:
  - doc-158
parent_task_id: TASK-7
priority: low
ordinal: 257000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.35 (doc-158). Over 100,000 all-TAG cash hands (seed 42), VPIP is 31.1 at 3 seats and 28.1 at 4 seats against the 6-max healthy range 20-28. VPIP comes from the preflop charts (3-7 seats use the 6-max chart via referenceSizeOf), not the postflop ranges TASK-7.35 changed. 4-seat WTSD 42.5 at 10k is sampling noise (41.5 at 100k, inside) and is not tracked.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given all-TAG cash play at 3 and 4 seats, When 100,000 hands are measured (opt-in slow group), Then VPIP is inside 20-28 and PFR, aggression, WTSD and W$SD stay inside their 6-max healthy ranges, with before/after figures recorded
- [ ] #2 Given 2, 6 and 9 seat tables, When the same playtests run, Then their output is byte-identical to before (no change outside 3-5 seats)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. TAG bot at 3-4 dealt-in seats: BTN/SB unopened spots use the 6-max CO opening cells (derived chart in src/bots/tag.ts; shared chart and advice untouched)
2. Style check uses the same chart
3. Fast acceptance test + opt-in 100k slow test at 3/4 seats
4. 2/5/6/7/9-seat playtest output byte-identical (cmp vs base)
5. Docs before/after figures

Full spec: doit/TASK-7.37/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Locked edit: tests/playtest/summary.acceptance.test.ts (owner TASK-1.26) withAwards drops 'returned' (Q-1 autopilot).
<!-- SECTION:NOTES:END -->
