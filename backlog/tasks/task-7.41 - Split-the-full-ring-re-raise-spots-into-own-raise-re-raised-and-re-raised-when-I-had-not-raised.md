---
id: TASK-7.41
title: >-
  Split the full-ring re-raise spots into own-raise-re-raised and
  re-raised-when-I-had-not-raised
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T23:45:00Z'
updated_date: '2026-11-28T05:54:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.40
references:
  - doit/TASK-7.21/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-28
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 264000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.21 (decision: Q-1 split re-raise), after the 6-max split. Apply the same A-2 rule and the situation names, labels and context sentences from the 6-max story to the full-ring chart: 41 to 50 spots (+9), with 9 new grids and the 9 existing re-raise grids re-justified. Cost table and affected code/locked tests: doit/TASK-7.21/spec.md §3 and §5. Heads-up is unchanged (every heads-up re-raise is an own-raise re-raise). The spec must ask the user for wording of any new label or context text the 6-max story did not already settle, and the user signs off the new and changed spots from npm run chart:print full-ring, as in TASK-7.19. Related: TASK-7.38 (full-ring chart review).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a full-ring hand with two or more preflop raises, When preflop advice is computed, Then it reads the own-raise-re-raised spot if the viewer made a preflop raise that a later raise now faces, and the re-raised-when-I-had-not-raised spot otherwise (TASK-7.21 rule A-2)
- [ ] #2 Given the full-ring chart, When the split is authored, Then it has 50 spots, each with all 169 hand classes and a plain-English justification that agrees with its grid, and each own-raise-re-raised spot continues with a share of that seat's opening range that the user approves
- [ ] #3 Given any new user-visible label or context text, When shown, Then its wording was approved by the user in this story's Q&A
- [ ] #4 Given the golden spots, When npm test runs, Then at least one full-ring golden spot covers each re-raise situation
- [ ] #5 Given the revised chart, When npm test runs, Then all checks pass and the user has signed off the new and changed full-ring spots from npm run chart:print full-ring in the task notes
- [ ] #6 Given a 6-max or full-ring hand where the viewer has not raised and a fourth bet is already in (e.g. BB facing r(4,8) r(5,12) r(6,16) f(1) f(2)), When preflop advice is computed, Then it reads re-raise-not-mine and a raise cell (AA) is advised call because the betting is capped
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Full-ring chart: add 9 re-raise-not-mine spots (Q-2 rule), re-justify/trim 9 re-raise spots to 80-90% of opening range (Q-1); one-line preflop-chart.ts change
2. AC#6 cap assertions for 6-max and full ring
3. 3 full-ring golden spots; user-approved re-pins (41->50 counts, 7.40 full-ring test flips) under owners
4. signoff.md package for the user before code review (18 spots, Rock shift, 9-seat TAG figures)
5. Full slow run once on final chart

Full spec: doit/TASK-7.41/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.40 follow-up (review r1 MINOR: no cap assertion for a not-mine fourth-bet route)
<!-- SECTION:NOTES:END -->
