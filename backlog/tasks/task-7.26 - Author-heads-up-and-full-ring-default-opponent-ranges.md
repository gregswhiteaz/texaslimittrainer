---
id: TASK-7.26
title: Author heads-up and full-ring default opponent ranges
status: Done
assignee:
  - '@claude'
created_date: '2026-11-22T22:50:00Z'
updated_date: '2026-11-26T03:26:00Z'
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
documentation:
  - doc-152
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
- [x] #1 Given the range data, When the validator runs, Then every applicable (heads-up or full-ring position, preflop line) has a range and a plain-English justification, and a missing one fails validation
- [x] #2 Given a heads-up or full-ring postflop view, When the user's advice is computed, Then each opponent's start range is the authored range for that size, position and line (not every unseen combo), narrowed by TASK-7.5's rule
- [x] #3 Given the authored ranges, When their widths are measured, Then each lies inside its documented band
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Heads-up (12) and full-ring (54) default typical-player action ranges per spec Appendix A, validated like the 6-max file
2. Ranges used at 2 and 8-10 dealt-in seats; observed-stat rescaling applies there too; 3-5 and 7 seats unchanged (TASK-7.35)
3. Replace golden spots that stop being clear-cut like-for-like (logged); rewrite the unlocked heads-up unit test
4. Slow 100k heads-up and 9-max check logs the five stats; docs

Full spec: doit/TASK-7.26/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: 66 HU/full-ring default ranges in src/advice/ranges/{heads-up,full-ring}.json, rangesFor by table size; 6 golden spots replaced like-for-like (Q-2); stats at 2/9 seats all in healthy range after (9-max WTSD 50.7→38.4); TASK-7.2 locked preflop sandbox file list gained the two JSON paths (unlocked, no assertion change); gate PASS

Judge r1 PASS (12/12 SPEC items); J-1-01 LOW justification wording fixed by orchestrator

Follow-ups: AC added to TASK-7.35 (rangesFor size coverage test, DEFAULT_RANGES export). 5k-row doc NIT not tracked (docs only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added original heads-up (12) and full-ring (54) default opponent ranges with justifications and width bands. The validator now covers all three reference sizes, and estimateOpponentRanges starts opponents at 2 and 8-10 seats from the authored range for their size, position and line, then narrows as before. 3, 4, 5 and 7 seats are unchanged (TASK-7.35). Verified: npm test 1428 passed, e2e 375 passed, slow 100k-hand test passed, 0 violations at sizes 2, 6, 9, 6-max output byte-identical, judge PASS 12/12. All-TAG stats at heads-up and 9-max now sit inside the healthy ranges (9-max WTSD went from 51 to 38). Six golden spots were re-pinned like-for-like. Review: the 66 ranges (Q-1) and assumptions A-1 to A-6. Follow-ups: tighten the rangesFor null-case test, drop the unused DEFAULT_RANGES export, add 5k rows to the effect table. All fit under TASK-7.35.
<!-- SECTION:FINAL_SUMMARY:END -->
