---
id: TASK-8.5
title: Label positions and situations in plain English for hints
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-26T07:04:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.2
references:
  - doc-14
documentation:
  - doc-155
parent_task_id: TASK-8
priority: medium
type: feature
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2: the advice API returns ids (CO, raise-and-calls); REQ-042.6 hint text needs readable labels.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given each position id (UTG, HJ, CO, BTN, SB, BB) and situation id, When a label is requested, Then it returns the approved English label (e.g. 'the cutoff', 'facing a raise and calls')
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. SITUATION_LABELS copy in src/advice/explanations.ts (Q-1)
2. positionLabel/situationLabel in src/advice/explain.ts; chartBasisText uses positionLabel (same output)
3. Acceptance test tests/advice/labels.acceptance.test.ts
4. One paragraph in docs/advice/explanations.md

Full spec: doit/TASK-8.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: SITUATION_LABELS + positionLabel/situationLabel; chartBasisText output unchanged; no display change (Q-2); gate PASS

Judge r1 PASS (3/3 SPEC items)

Follow-ups: TASK-8.7 created (spike: show situation label on hint/review?).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added SITUATION_LABELS plus positionLabel/situationLabel (positions reuse the TASK-8.1 CHART_POSITIONS copy; chartBasisText now routes through positionLabel, output unchanged). Verified: 3 acceptance tests (all 9 positions, all 6 situations), npm test 1442 passed, lint/typecheck clean, judge round 1 PASS. Review: assumptions A-1..A-5 and auto-accepted Q-1 (wording) / Q-2 (no display change). Follow-up: situationLabel has no UI consumer yet; no existing task owns showing it.
<!-- SECTION:FINAL_SUMMARY:END -->
