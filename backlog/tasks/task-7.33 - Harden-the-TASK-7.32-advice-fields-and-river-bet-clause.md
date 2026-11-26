---
id: TASK-7.33
title: Harden the TASK-7.32 advice fields and river-bet clause
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T01:41:00Z'
updated_date: '2026-11-26T16:05:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.32
references:
  - doc-129
documentation:
  - doc-166
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
- [x] #1 Given recommendPostflop output, When its type is checked, Then requiredCountsRiverBet and valueThresholdPct are required fields (hand-built test inputs updated, no assertion removed)
- [x] #2 Given a turn pot-odds or implied-odds explanation with requiredCountsRiverBet, When the template wording changes, Then a test fails if the river-bet clause is missing (the clause is built from its own template, not a text replace)
- [x] #3 Given an EquityGradeInput with a non-finite valueThresholdPct, When it is graded, Then grading rejects it with the same error as other non-finite percent fields
- [x] #4 Given the value-bet AC#6 test and golden spot 6max-flop-co-raise-jj, When read, Then the test title names 65.1% and the spot id describes its current spot (re-pin logged)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. requiredCountsRiverBet and valueThresholdPct required on PostflopRecommendation
2. River-bet clause from its own template slot {riverBet} (no text replace); explanation text byte-identical
3. grade.ts rejects non-finite valueThresholdPct like other percent fields
4. Value-bet AC#6 title 65.1%; golden id 6max-flop-co-raise-jj-3way (re-pin logged)

Full spec: doit/TASK-7.33/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: fields required; river-bet clause via {riverBet} template slot (text byte-identical, playtest SHAs unchanged); grade rejects non-finite valueThresholdPct; AC#6 title and golden id fixed; gate PASS

Judge r1 PASS (9/9 SPEC items; mutation-checked; text byte-identical)

Follow-ups: none tracked (percent range-check NIT is local-tampering only, below the value bar).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made requiredCountsRiverBet and valueThresholdPct required on PostflopRecommendation; the river-bet clause is now its own {riverBet} template slot (slot loss fails a test); grading rejects a non-finite valueThresholdPct; fixed the AC#6 title (65.1%) and renamed the golden spot to 6max-flop-co-raise-jj-3way (logged). Explanation text is byte-identical. Verified: gate PASS, judge round 1 PASS 9/9. Review: assumptions A-1..A-4 (GoldenNumbers threshold stays optional; id suffix -3way). Risks: none; optional follow-up to range-check percent fields.
<!-- SECTION:FINAL_SUMMARY:END -->
