---
id: TASK-7.21
title: Decide whether to split preflop spots by raiser position and re-raise type
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-26T23:50:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.2
references:
  - doc-14
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-176
parent_task_id: TASK-7
priority: medium
type: spike
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2 Q-4. REQ-032.2 fixes 26 spots, so blind defence and facing-a-raise ignore who raised (BB defends the same vs UTG as vs a BTN steal), and facing-a-re-raise lumps 'my open was 3-bet' with 'cold 3-bet'. A real strategy weakness the user chose to ship and revisit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given options (split by raiser position, split re-raise by open-vs-cold, keep 26 spots), When the user decides, Then the decision is recorded as a Backlog decision and REQ-032.2 and the chart format are updated if needed
- [x] #2 Given re-raise spots are split into 'my open was 3-bet' and 'cold 3-bet', When the CO cold-3-bet spot is authored, Then CO A9o/A8o are reconsidered (TASK-7.19 folds them only because TASK-9.1's locked review test pins CO A9o as Fold) and that test is updated if the advice changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. requirements.md: new REQ-032.2 and REQ-032.6 text + change-log row 1.13
2. Backlog decision (Q-1/Q-2/Q-3)
3. Follow-up stories FU-1 (6-max re-raise split, carries AC#2), FU-2 (full-ring re-raise split), FU-3 (blind defence early/late)

Full spec: doit/TASK-7.21/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence from TASK-7.19 (user Q-1/Q-3, 2026-11-19): re-raise spots now continue with 80-90% of each opener's range, which suits 'my open was 3-bet' but makes cold 3-bet routes loose. For example, CO facing a UTG open and an HJ 3-bet continues ~22% of hands from an uninvested seat. Splitting the spot would fix this.

AC added from TASK-7.19 follow-up (doc-28).

Decision (Q-1/Q-2/Q-3, user 2026-11-26): split facing a re-raise into own-raise-re-raised and re-raised-when-I-had-not-raised (rule A-2); split blind defence by an early or a late raiser; authoring in follow-ups. Recorded as decision-4. Cost: heads-up stays 6 spots; 6-max 26 -> 34; full ring 41 -> 52 (facts and cost table: doit/TASK-7.21/spec.md §3 and §5). Chart format version 1 needs no change (spots matched by string key, src/advice/preflop-chart.ts:185-232). Follow-ups: TASK-7.40 (6-max re-raise split), TASK-7.41 (full-ring re-raise split, after 7.40; related to TASK-7.38), TASK-7.42 (blind defence early/late, after 7.40).

Judge r1 PASS (5/5 SPEC items). Chart format: tlh-preflop-chart version 1 (unchanged).

Follow-ups: TASK-7.40, TASK-7.41, TASK-7.42 (TASK-7.41 overlaps TASK-7.38: review full ring after or within 7.41).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decision (Q-1/Q-2/Q-3, user 2026-11-26), recorded as decision-4: split facing a re-raise into own-raise-re-raised and re-raised-when-I-had-not-raised (rule A-2: own raise re-raised when the viewer made a preflop raise that a later raise now faces; everything else is not-my-raise), and split blind defence by an early or a late raiser; authoring goes to follow-ups. REQ-032.2 and REQ-032.6 updated, change-log row 1.13. Chart format v1 needs no change. Cost: heads-up stays 6 spots, 6-max 26 to 34, full ring 41 to 52. Follow-ups: TASK-7.40 (6-max re-raise split), TASK-7.41 (full-ring re-raise split, after TASK-7.40), TASK-7.42 (blind defence early/late, after TASK-7.40). AC#2 moved verbatim to TASK-7.40 (6-max re-raise split) as its AC#3; CO A9o/A8o are reconsidered there. Under rule A-2 the locked TASK-9.1 route (UTG opens, CO calls, BB 3-bets) lands in the re-raised-when-I-had-not-raised spot, so A9o can continue in the own-raise-re-raised spot without that test changing.
<!-- SECTION:FINAL_SUMMARY:END -->
