---
id: TASK-8.7
title: Decide whether hints and reviews show the situation label
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T07:04:00Z'
updated_date: '2026-11-27T19:30:00Z'
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
