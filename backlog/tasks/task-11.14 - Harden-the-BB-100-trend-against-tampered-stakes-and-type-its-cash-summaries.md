---
id: TASK-11.14
title: Harden the BB/100 trend against tampered stakes and type its cash summaries
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T10:36:00Z'
updated_date: '2026-11-26T17:26:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-11.2
references:
  - doc-135
parent_task_id: TASK-11
priority: low
ordinal: 245000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-11.2 security and code review (doc-135). A tampered store with many unusual big bets can push bb100Value's LCM past 2^53; gcd then recurses to a stack overflow, and because statisticsView runs inside the .then success handler (src/ui/App.tsx:90) the Statistics screen stays on loading. trendHand also casts any gameType 'cash' source as having cash fields; and there is no all-negative chart geometry unit case.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given stored cash hands whose big bets make the exact LCM exceed a safe integer, When Statistics opens, Then it either shows a finite BB/100 value or the load-failure message, never stays on loading, and a test pins this
- [ ] #2 Given TrendSource, When a cash source lacks its cash fields, Then the type system rejects it and trendHand needs no cast
- [ ] #3 Given all-negative BB/100 points, When the chart is drawn, Then a unit case pins the break-even line at the top of the plot
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. bb100Value: exact LCM while safe; float per-hand fallback above MAX_SAFE_INTEGER; iterative gcd
2. TrendSource becomes CashTrendSource | OtherTrendSource; trendHand has no cast
3. Unit case pins the break-even line above all-negative points
4. Acceptance test: tampered store with 500 prime big bets shows a finite point, never stuck loading

Full spec: doit/TASK-11.14/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: bb100Value exact while safe, float fallback above MAX_SAFE_INTEGER, iterative gcd; TrendSource union, no cast; all-negative break-even unit case; gate PASS
<!-- SECTION:NOTES:END -->
