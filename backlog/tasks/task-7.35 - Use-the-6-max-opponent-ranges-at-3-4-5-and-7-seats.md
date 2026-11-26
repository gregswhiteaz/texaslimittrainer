---
id: TASK-7.35
title: Use the 6-max opponent ranges at 3, 4, 5 and 7 seats
status: To Do
assignee: []
created_date: '2026-11-26T01:56:00Z'
updated_date: '2026-11-26T03:26:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.26
parent_task_id: TASK-7
priority: medium
ordinal: 254000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.26 Q-4. After TASK-7.26 only 2, 6 and 8-10 seat tables have default action ranges; 3, 4, 5 and 7 dealt-in seats still assume every unseen combo, the TASK-7.32 'bots never fold' cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a postflop spot at 3, 4, 5 or 7 dealt-in seats, When advice is computed with action ranges, Then it uses default typical-player ranges (6-max, keyed by referenceSizeOf) rather than every unseen combo, and the change to advice and bot play is measured and reviewed
- [ ] #2 Given rangesFor, When called with 3, 4, 5 and 7 seats Then it returns null, and with 2, 6, 8, 9 and 10 seats it returns the heads-up, 6-max and full-ring ranges respectively; and DEFAULT_RANGES is either used by rangesFor or no longer exported
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.26 follow-up (review MINOR + NIT)
<!-- SECTION:NOTES:END -->
