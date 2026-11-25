---
id: TASK-2.22
title: Leave the app with one Back after reloading on the Table
status: To Do
assignee: []
created_date: '2026-11-25T20:08:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.20
references:
  - doc-146
parent_task_id: TASK-2
priority: low
ordinal: 250000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.20 (doc-146). After a reload while on the Table, the earlier page load's Table history entry stays in history, so from Home it takes two Backs to leave the app (stepping back from that entry reloads the page). Pre-existing; outside TASK-2.20's ACs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a reload while on the Table, then Resume and Home, When the user presses Back from Home, Then one Back leaves the app (or the extra entry is replaced so no stale Table entry remains), with no page reload on the way
<!-- AC:END -->
