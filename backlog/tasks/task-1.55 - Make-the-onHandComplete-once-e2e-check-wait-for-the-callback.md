---
id: TASK-1.55
title: Make the onHandComplete-once e2e check wait for the callback
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T15:30:00Z'
updated_date: '2026-11-23T15:31:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies: []
parent_task_id: TASK-1
priority: high
ordinal: 227000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Main CI #249 (run 45204245680) failed in WebKit: e2e/hand-records.spec.ts:230 'onHandComplete fires exactly once per hand even with the same replay code' read the harness log once right after the result appeared and saw 0 calls (expected 1). onHandComplete can land just after the real IndexedDB write resolves, so the immediate read races. Test-timing problem, not a product bug (TASK-3.9 owns the locked test).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the onHandComplete-once e2e test, When it checks the call count after each result, Then it waits with expect.poll (bounded) for exactly the expected count instead of reading once, keeping every exact-count assertion (no assertion dropped or loosened)
- [ ] #2 Given the fix, When the spec runs 20 times in WebKit and Chromium locally (--repeat-each), Then it passes every time
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. e2e/hand-records.spec.ts: poll exact onHandComplete counts (lines 237/245/248/251-252) with expect.poll; keep exact assertions.
2. Verify --repeat-each 20 in Chromium and WebKit.

Full spec: doit/TASK-1.55/spec.md
<!-- SECTION:PLAN:END -->
