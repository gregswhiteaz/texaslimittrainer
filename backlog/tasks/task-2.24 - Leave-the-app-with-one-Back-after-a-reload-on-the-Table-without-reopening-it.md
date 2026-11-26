---
id: TASK-2.24
title: Leave the app with one Back after a reload on the Table without reopening it
status: To Do
assignee: []
created_date: '2026-11-26T11:14:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.22
references:
  - doc-159
parent_task_id: TASK-2
priority: low
ordinal: 258000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.22 (doc-159). After a reload on the Table, if the user goes Home without reopening the Table, the earlier load's Table entry stays in history and the first Back from Home does nothing visible (no reload). History entries cannot be deleted and replaceState on the stale entry does not remove it (TASK-2.22 spec experiments); the only approach found, history.back() at page start, was rejected for racing a quick Resume. This task needs a race-free approach or should be closed as not worth it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a reload while on the Table, When the user presses Back from Home without reopening the Table, Then one Back leaves the app with no page reload, in Chromium and WebKit, and a quick Resume right after load still opens the Table
<!-- AC:END -->
