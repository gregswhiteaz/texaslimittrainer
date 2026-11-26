---
id: TASK-10.15
title: Simplify preflop leak pairing in src/stats/leaks.ts
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T06:45:00Z'
updated_date: '2026-11-26T18:39:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.6
references:
  - doc-131
documentation:
  - doc-170
parent_task_id: TASK-10
priority: low
ordinal: 242000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.6 code review (doc-131). handCategoryDecisions recomputes the dealt-in seat list and the user's position group for every paired preflop decision though they are fixed per hand, and its user-non-blind-action check duplicates userMade in src/table/hand-record.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a hand with several user preflop decisions, When handCategoryDecisions runs, Then the seat list and user position group are computed once per hand and every existing leak test still passes unchanged
- [x] #2 Given the user's non-blind action filter, When leaks.ts pairs decisions, Then it reuses the hand-record helper instead of a copy, with the same results
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Export userMade from hand-record.ts; leaks.ts pairs decisions against it (no inline blind check)
2. Position group computed lazily once per hand
3. New unit tests count seat reads; no existing test file changes

Full spec: doit/TASK-10.15/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: leaks.ts reuses exported userMade; position group computed once per hand (lazy); no existing test changed; gate PASS

Judge r1 PASS (4/4 SPEC items; base-vs-head differential identical)

Follow-ups: none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Refactor only: handCategoryDecisions now computes the seat list and user position group once per hand (lazily, on the first paired preflop decision) and reuses the exported hand-record userMade instead of a duplicate blind check. Outputs and errors are unchanged. Verified by 8 new unit assertions, unchanged existing leak tests, a judge differential over 200k fuzzed hands and 60 sessions (identical), and green CI 45876467250. Review assumptions A-1 (lazy computation), A-2 (export userMade as is), A-3 (new test file). No risks or follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
