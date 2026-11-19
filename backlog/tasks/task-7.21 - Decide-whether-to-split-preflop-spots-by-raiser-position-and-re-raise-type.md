---
id: TASK-7.21
title: Decide whether to split preflop spots by raiser position and re-raise type
status: To Do
assignee: []
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-19T03:52:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.2
references:
  - doc-14
  - dreams/limit-holdem-trainer/requirements.md
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
- [ ] #1 Given options (split by raiser position, split re-raise by open-vs-cold, keep 26 spots), When the user decides, Then the decision is recorded as a Backlog decision and REQ-032.2 and the chart format are updated if needed
- [ ] #2 Given re-raise spots are split into 'my open was 3-bet' and 'cold 3-bet', When the CO cold-3-bet spot is authored, Then CO A9o/A8o are reconsidered (TASK-7.19 folds them only because TASK-9.1's locked review test pins CO A9o as Fold) and that test is updated if the advice changes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence from TASK-7.19 (user Q-1/Q-3, 2026-11-19): re-raise spots now continue with 80-90% of each opener's range, which suits 'my open was 3-bet' but makes cold 3-bet routes loose. For example, CO facing a UTG open and an HJ 3-bet continues ~22% of hands from an uninvested seat. Splitting the spot would fix this.

AC added from TASK-7.19 follow-up (doc-28).
<!-- SECTION:NOTES:END -->
