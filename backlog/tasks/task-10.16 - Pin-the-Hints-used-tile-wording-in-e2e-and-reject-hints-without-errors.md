---
id: TASK-10.16
title: Pin the Hints used tile wording in e2e and reject hints without errors
status: To Do
assignee: []
created_date: '2026-11-25T07:28:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-10.7
references:
  - doc-132
parent_task_id: TASK-10
priority: low
ordinal: 243000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-10.7 review/judge (doc-132). e2e/report-hints.spec.ts derives its expected tile text from hintTile itself, so a wording regression would not fail it; and a stored report with hints but no errors validates yet shows no tile (the app never writes that combination).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the e2e Hints used check, When it compares the tile, Then the expected text is built from the stored counts with the literal 'N of M decisions (P%)' wording, not from hintTile
- [ ] #2 Given a stored report with hints but no errors, When it is read, Then parseSessionReport rejects it with a RangeError naming hints
<!-- AC:END -->
