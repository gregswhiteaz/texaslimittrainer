---
id: TASK-8.7
title: Decide whether hints and reviews show the situation label
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T07:04:00Z'
updated_date: '2026-11-27T19:31:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-8.5
references:
  - doc-155
parent_task_id: TASK-8
priority: low
ordinal: 256000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-8.5 (doc-155). situationLabel() now returns approved labels (e.g. 'facing a raise and calls') but, per TASK-8.5 Q-2, nothing on screen shows them. The hint card's chart basis line could read e.g. 'From the 6-max chart: call A9o from the cutoff, facing a raise and calls'. Doing so edits TASK-8.1's locked hint/review tests and e2e specs (~8 files).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the choice to show or not show the situation label on the hint card and review entries, When the user decides, Then the decision is recorded on this task (and, if yes, a build task with Given/When/Then ACs is created)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record decision-7 (no situation label on hints/reviews)
2. requirements.md unchanged; no code change; evidence in notes
3. Reword TASK-7.40 AC#4 and TASK-7.42 AC#3
4. Tick AC#1

Full spec: doit/TASK-8.7/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decision (Q-1 A, user, 2026-11-27): the hint card chart line and preflop review entries do not show the situation label; they keep "From the 6-max chart: raise A9o from the cutoff". Recorded as decision-7. No requirements change (REQ-042.6 and REQ-043.9 already match). No follow-up story. Q-2 (blind-defence wording) is moot; the approved label stays. No product code changed.

Evidence (full detail in doit/TASK-8.7/spec.md §3):
- The explanation's first sentence (PREFLOP_CONTEXT[situation], src/advice/explain.ts:43-45) already states the situation on both the hint card and the review entry, so a label would repeat it on the line above.
- A review entry could recompute the situation from the stored view (chartSpotOf returns { position, situation }, src/advice/preflop.ts:90-102), so showing it later needs no hand-record format change.
- Showing it in the chart line would re-pin locked tests: tests/ui/hint.acceptance.test.tsx:229 (TASK-8.1), tests/ui/review-numbers.acceptance.test.tsx:180,205 (TASK-9.3, TASK-7.43); tests/advice/labels.acceptance.test.ts:29-30 (TASK-8.5) breaks if chartBasisText requires a situation.
- Worst-case chart line with the label would be 93 characters ("From the full-ring chart: raise A9o from the small blind, defending the blind against a raise"), wrapping to two lines in the 640 px hint card; today's longest is about 60.
- TASK-7.40 AC#4 and TASK-7.42 AC#3 reworded (numbers kept) to: "Given each new situation, When the chart is authored, Then it has a label in SITUATION_LABELS and a context sentence shown in the preflop explanation, both with wording the user approved in this story's Q&A". TASK-7.41 untouched.
<!-- SECTION:NOTES:END -->
