---
id: TASK-2.20
title: Prove the pause write-race guard and harden Table history entries
status: To Do
assignee: []
created_date: '2026-11-24T03:18:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-2.14
references:
  - doc-108
parent_task_id: TASK-2
priority: medium
ordinal: 231000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-2.14 (doc-108). No test exercises tableWritesSettled(): removing the A-2 guard leaves every test green (code review MINOR writes-settled-race-untested). The Table history key is ${performance.timeOrigin}:${counter}, which Playwright's fake clock reuses across loads, so only one SPEC-07 case runs on the real clock (NIT history-key-clock-derived). After Back then Forward on the Table, the next Back on Home lands on the app's stale entry and needs a second Back to leave (NIT forward-then-back-stays-on-home).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a sessions-store write held open by an init script, When the user chooses Home (and, separately, browser Back) while it is held, Then Home shows the previous hand count only after the write is released and the shown count equals the stored handsPlayed; removing the tableWritesSettled wait makes this test fail
- [ ] #2 Given the Table history entry key, When it is created, Then it does not depend on the clock (e.g. crypto.getRandomValues like newSessionId) and every SPEC-07 Back/Forward case of TASK-2.14 runs under the paused Playwright clock
- [ ] #3 Given Back then Forward on the Table, When the user presses Back on Home, Then one Back leaves the app (no visible no-op step), with a Chromium and WebKit test
<!-- AC:END -->
