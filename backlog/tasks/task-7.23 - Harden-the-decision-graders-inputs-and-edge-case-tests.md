---
id: TASK-7.23
title: Harden the decision grader's inputs and edge-case tests
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T20:12:00Z'
updated_date: '2026-11-21T03:36:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.4
references:
  - doc-19
documentation:
  - doc-55
parent_task_id: TASK-7
priority: low
type: chore
ordinal: 183000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.4 (doc-19) reviews. gradeDecision accepts a hand-built recommendation with non-finite equity and grades it Minor with a NaN margin, which would serialise as null in a hand record. A wrong-way margin is only tested at -5, so a Math.abs mutant survives. One test name claims a float trap (26.7-16.7) that is exact in floating point.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a recommendation whose equity or required-equity percentage used by the deciding rule is NaN, Infinity or missing, When gradeDecision runs, Then it throws RangeError and a unit test covers it
- [x] #2 Given a wrong-way margin of -15 points, When graded, Then the result is Minor with marginPts -15
- [x] #3 Given the float-subtraction boundary test, When read, Then its cases and name only claim float traps that are real (e.g. 16.4-6.4)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. grade.ts: private finitePct check in the two margin rules; RangeError '<field> must be a finite number, got <v>'; missing equityVsCallingRangePct still grades aggression-no-range.
2. New grade-hardening acceptance test: non-finite inputs throw; -15 wrong-way margin is Minor with marginPts -15 for all four pairings.
3. Rename the float-subtraction test and assert 26.7-16.7 is exact (nothing removed).

Full spec: doit/TASK-7.23/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: finitePct guard in the two margin rules; grade-hardening acceptance tests (non-finite throws, -15 wrong-way Minor; Math.abs and TypeError mutants caught); float test renamed + exact-case assertion; gate PASS

Judge R1 PASS 6/6; J-1-01 LOW applied in-story (grade 'correct' asserted).

Follow-ups (Step 6a): none.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The decision grader now throws RangeError when a number its deciding rule reads (equityPct, requiredEquityPct, equityVsCallingRangePct) is NaN, Infinity or missing, instead of returning Minor with a NaN margin. Added a -15 wrong-way margin test and fixed a misnamed float test. Verified: npm test 382 passed/6 skipped, typecheck clean, lint/prettier clean, judge PASS 6/6, review no blockers. Assumptions to review: A-1 guard only fields the rule reads; A-2 message format; A-3 rename plus assertion. No follow-ups; no real caller can hit the throw.
<!-- SECTION:FINAL_SUMMARY:END -->
