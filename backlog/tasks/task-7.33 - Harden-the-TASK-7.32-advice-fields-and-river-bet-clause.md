---
id: TASK-7.33
title: Harden the TASK-7.32 advice fields and river-bet clause
status: To Do
assignee: []
created_date: '2026-11-25T01:41:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.32
references:
  - doc-129
parent_task_id: TASK-7
priority: low
ordinal: 240000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.32 code and security review (doc-129). requiredCountsRiverBet and valueThresholdPct are optional on PostflopRecommendation though always set; explain.ts adds the Q-3 river-bet clause by text replace, so template drift would silently drop it; grade.ts does not validate valueThresholdPct as a finite number; value-bet AC#6 test title still says 50.1% while testing 65.1%; golden spot id 6max-flop-co-raise-jj now names a different spot.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given recommendPostflop output, When its type is checked, Then requiredCountsRiverBet and valueThresholdPct are required fields (hand-built test inputs updated, no assertion removed)
- [ ] #2 Given a turn pot-odds or implied-odds explanation with requiredCountsRiverBet, When the template wording changes, Then a test fails if the river-bet clause is missing (the clause is built from its own template, not a text replace)
- [ ] #3 Given an EquityGradeInput with a non-finite valueThresholdPct, When it is graded, Then grading rejects it with the same error as other non-finite percent fields
- [ ] #4 Given the value-bet AC#6 test and golden spot 6max-flop-co-raise-jj, When read, Then the test title names 65.1% and the spot id describes its current spot (re-pin logged)
<!-- AC:END -->
