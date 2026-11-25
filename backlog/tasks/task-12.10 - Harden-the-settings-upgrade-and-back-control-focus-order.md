---
id: TASK-12.10
title: Harden the settings upgrade and back-control focus order
status: To Do
assignee: []
created_date: '2026-11-25T15:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-12.1
references:
  - doc-141
parent_task_id: TASK-12
priority: low
ordinal: 247000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-12.1 review and judge (doc-141). The v3->v4 upgrade unit test checks defaults only via readSettings(), which returns defaults even when no record exists; there is no onblocked handler, so a tab holding the old DB leaves store calls pending; in Chromium the first Tab from the Settings/Statistics heading leaves the page because the back control precedes the h1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a v3 database upgraded to v4, When the raw 'settings' record is read, Then a unit test asserts it equals the defaults
- [ ] #2 Given another tab holds the old database version open, When the app upgrades, Then the blocked upgrade is handled (the user sees a clear message or the other connection closes on versionchange) instead of hanging
- [ ] #3 Given Settings or Statistics opened with the heading focused, When the user presses Tab once, Then focus reaches the back control without leaving the page
<!-- AC:END -->
