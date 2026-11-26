---
id: TASK-8.7
title: Decide whether hints and reviews show the situation label
status: To Do
assignee: []
created_date: '2026-11-26T07:04:00Z'
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
