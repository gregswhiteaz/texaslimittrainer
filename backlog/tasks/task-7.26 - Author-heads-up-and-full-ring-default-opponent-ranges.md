---
id: TASK-7.26
title: Author heads-up and full-ring default opponent ranges
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-22T22:50:00Z'
updated_date: '2026-11-26T01:57:00Z'
labels:
  - follow-up
  - feature
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.6
  - TASK-7.5
references:
  - doc-87
parent_task_id: TASK-7
priority: medium
ordinal: 220000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.6 Q-3 (doc-87). TASK-7.5 authored 36 6-max default opponent ranges; at other table sizes postflop advice still assumes every unseen combo for each opponent (TASK-7.5 A-3). Needs original heads-up and full-ring ranges (REQ-061) keyed by position and preflop line, with justifications and width bands, and the range validator extended.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the range data, When the validator runs, Then every applicable (heads-up or full-ring position, preflop line) has a range and a plain-English justification, and a missing one fails validation
- [ ] #2 Given a heads-up or full-ring postflop view, When the user's advice is computed, Then each opponent's start range is the authored range for that size, position and line (not every unseen combo), narrowed by TASK-7.5's rule
- [ ] #3 Given the authored ranges, When their widths are measured, Then each lies inside its documented band
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Heads-up (12) and full-ring (54) default typical-player action ranges per spec Appendix A, validated like the 6-max file
2. Ranges used at 2 and 8-10 dealt-in seats; observed-stat rescaling applies there too; 3-5 and 7 seats unchanged (TASK-7.35)
3. Replace golden spots that stop being clear-cut like-for-like (logged); rewrite the unlocked heads-up unit test
4. Slow 100k heads-up and 9-max check logs the five stats; docs

Full spec: doit/TASK-7.26/spec.md
<!-- SECTION:PLAN:END -->
