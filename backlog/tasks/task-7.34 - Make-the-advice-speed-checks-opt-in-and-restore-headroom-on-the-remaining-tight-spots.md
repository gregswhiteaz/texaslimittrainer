---
id: TASK-7.34
title: >-
  Make the advice speed checks opt-in and restore headroom on the remaining
  tight spots
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T01:40:00Z'
updated_date: '2026-11-26T16:16:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.18
references:
  - doc-151
parent_task_id: TASK-7
priority: low
ordinal: 253000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.18 (doc-151). tests/advice/equity.perf.test.ts and tests/advice/postflop.perf.test.ts still run in every npm test at 20x slack, against the standing rule that speed checks are opt-in (TLH_SLOW_TESTS / npm run test:slow). HU advice facing a bet sits at 90% of its 25 ms target and the 8-opponent calling-range run takes ~97 ms.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given npm test without TLH_SLOW_TESTS, When it runs, Then neither advice perf file runs any timed scenario; they run in full under npm run test:slow
- [ ] #2 Given HU advice facing a bet and an 8-opponent calling-range spot, When the opt-in advice perf test runs at real targets, Then each p95 is at most 75% of its target
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Advice perf files run timed scenarios only under TLH_SLOW_TESTS=1 or their own scale variable; both listed in test:slow
2. New opt-in headroom test: HU facing a bet <= 18.75 ms, 9-seat vs 8 opponents <= 150 ms (200 ms target, Q-1)
3. No src change; playtest SHA unchanged; speed-limits CI test unchanged

Full spec: doit/TASK-7.34/spec.md
<!-- SECTION:PLAN:END -->
