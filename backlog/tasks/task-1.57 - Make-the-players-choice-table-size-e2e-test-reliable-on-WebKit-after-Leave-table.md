---
id: TASK-1.57
title: >-
  Make the players-choice table-size e2e test reliable on WebKit after Leave
  table
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-27T10:20:00Z'
updated_date: '2026-11-27T10:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies: []
parent_task_id: TASK-1
priority: medium
ordinal: 274000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Main CI run 45978923317 (commit 46e6e83, TASK-7.46 merge, no app/bot change) failed once on WebKit: e2e/players-choice.spec.ts:94 'each table size from 2 to 10 starts with that many players and the right advice note' — at :143 after clicking Leave table the 'TLH Trainer' level-1 heading was not visible within 5 s. The failed-job re-run passed. Treat as a timing-sensitive check: find why Leave table sometimes does not reach the main menu within the wait (e.g. a hand in progress opening the leave dialog, or slow session end) and make the test wait on the real condition.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given e2e/players-choice.spec.ts table-size test, When it runs repeatedly on Chromium and WebKit (e.g. --repeat-each 10), Then it passes every time because it waits on the actual condition after Leave table (dialog handled or session-end complete), with no assertion removed or loosened
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Before the n=2 and n=10 table axe scans, poll until the session start record is stored (deal timer already waiting on the paused clock)
2. Locked edit under TASK-2.2: import + poll only
3. Verify 20/20 on chromium+webkit with --repeat-each 10

Full spec: doit/TASK-1.57/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: wait for the session start record before the n=2/n=10 table axe scans (locked edit under TASK-2.2, Q-1); 40/40 on chromium+webkit --repeat-each 10; gate PASS
<!-- SECTION:NOTES:END -->
