---
id: TASK-1.55
title: Make the onHandComplete-once e2e check wait for the callback
status: Done
assignee:
  - '@claude'
created_date: '2026-11-23T15:30:00Z'
updated_date: '2026-11-24T08:55:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies: []
documentation:
  - doc-103
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
- [x] #1 Given the onHandComplete-once e2e test, When it checks the call count after each result, Then it waits with expect.poll (bounded) for exactly the expected count instead of reading once, keeping every exact-count assertion (no assertion dropped or loosened)
- [x] #2 Given the fix, When the spec runs 20 times in WebKit and Chromium locally (--repeat-each), Then it passes every time
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. e2e/hand-records.spec.ts: poll exact onHandComplete counts (lines 237/245/248/251-252) with expect.poll; keep exact assertions.
2. Verify --repeat-each 20 in Chromium and WebKit.

Full spec: doit/TASK-1.55/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: 4 immediate onHandComplete count reads → expect.poll with the same exact checks; --repeat-each 20 both browsers 360/360; gate PASS.

Judge R1 PASS 2/2 (200 ms delay mutant: base fails 10/10, branch passes 20/20; duplicate-call mutant still fails 6/6; 60/60 repeats).

Locked e2e/hand-records.spec.ts unlocked for TASK-3.12 Q-4 (oldRecord fixture gains decisions; no assertion change).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed the WebKit race that turned main CI #249 red: the onHandComplete-once e2e test read the callback log immediately, before the IndexedDB write resolved. The four racy reads now use bounded expect.poll with the same exact matchers, so no assertion is loosened (test-only, 11 lines, 1 file). Verified with 360/360 passes over 20 repeats in chromium and webkit, plus gates PASS and clean code and security reviews. Assumptions to review: default 5 s poll bound; the post-advance check stays an immediate exact read. No risks or follow-ups.
<!-- SECTION:FINAL_SUMMARY:END -->
