---
id: TASK-7.36
title: Give graded postflop examples chart-consistent preflop lines
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T06:37:00Z'
updated_date: '2026-11-26T19:28:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.31
references:
  - doc-154
parent_task_id: TASK-7
priority: low
ordinal: 255000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.31 (doc-154, assumption A-1). TASK-7.31 made every postflop golden spot reach its decision through hero preflop actions the chart does not grade Major, but left tests/golden/graded-examples.json out of scope. Three graded examples still model a Major preflop error: graded-postflop-fold-minor-6max-flop-gutshot, graded-postflop-check-minor-6max-river-top-pair, graded-postflop-check-major-6max-turn-trips. Also remove the unreachable 'if (!result.ok) break;' in heroPreflopProblems (src/advice/golden.ts).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given every postflop graded example, When its hero preflop actions are graded against the chart for its table size and position, Then none is a Major error and a test enforces this
- [ ] #2 Given a re-authored graded example, When the golden suite runs, Then its grade, rule id and margin are re-pinned like-for-like and logged in docs/advice/golden-spots.md
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. parseExample applies the hero-preflop Major-error rule to postflop graded examples
2. Re-author the three examples like-for-like (grade, rule id, margin kept); evaluator-checked justifications
3. Remove the unreachable break in heroPreflopProblems
4. Docs: rule, failure text, change log

Full spec: doit/TASK-7.36/spec.md
<!-- SECTION:PLAN:END -->
