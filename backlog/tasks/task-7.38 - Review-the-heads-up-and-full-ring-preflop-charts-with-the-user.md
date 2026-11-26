---
id: TASK-7.38
title: Review the heads-up and full-ring preflop charts with the user
status: To Do
assignee: []
created_date: '2026-11-26T14:18:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - spike
milestone: m-1
dependencies:
  - TASK-7.27
references:
  - doc-164
parent_task_id: TASK-7
priority: low
ordinal: 259000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.27 (doc-164). The heads-up and full-ring preflop charts were authored by Claude (TASK-7.6) and have not been reviewed by the user, as the 6-max chart was in TASK-7.19. Print them with npm run chart:print -- heads-up and npm run chart:print -- full-ring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the printed heads-up and full-ring charts, When the user reviews them, Then each requested change is recorded on this task and applied (or the charts are approved as they are)
<!-- AC:END -->
