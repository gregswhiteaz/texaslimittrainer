---
id: TASK-7.31
title: Give postflop golden spots chart-consistent preflop lines
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-24T06:32:00Z'
updated_date: '2026-11-26T04:58:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.14
references:
  - doc-111
parent_task_id: TASK-7
priority: medium
ordinal: 232000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.14 (doc-111). Many postflop golden spots reach their decision through hero preflop actions the project's own chart grades as Major errors (e.g. UTG opening 92o, 82o, T4o, K3o, K2o; CO opening 72o, 83o; full-ring UTG 94o; BB only calling an SB raise with AA) — code review MINOR hero-preflop-lines-contradict-chart. A trainer's reference spots should not model bad preflop play. Also: 6max-turn-bb-raise-92o says 'set of kings' where it means kings full; and a gradeDecision RangeError escapes parsePostflopGoldenSpots instead of being reported as a problem (NIT grade-throw-escapes-validation).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given every postflop golden spot, When its hero preflop actions are graded against the chart for that table size and position, Then none is a Major error (a test enforces this), with spot decisions and clear-cut margins re-validated after any line change
- [ ] #2 Given 6max-turn-bb-raise-92o, When its justification is read, Then it names the hand as kings full, not a set
- [ ] #3 Given a postflop spot whose advice makes gradeDecision throw, When parsePostflopGoldenSpots runs, Then the error is listed as a problem for that spot id rather than thrown
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Validator rejects postflop spots whose hero preflop step grades Major on the chart
2. Clear-cut grading errors become listed problems, not throws (AC#3)
3. Re-author the 72 failing spots like-for-like (action fix, hole-card swap, then line change), coverage unchanged
4. 6max-turn-bb-raise-92o: chart-consistent line, justification says kings full
5. Acceptance test pinning coverage; change log in docs/advice/golden-spots.md

Full spec: doit/TASK-7.31/spec.md
<!-- SECTION:PLAN:END -->
