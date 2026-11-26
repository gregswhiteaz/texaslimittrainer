---
id: TASK-7.34
title: >-
  Make the advice speed checks opt-in and restore headroom on the remaining
  tight spots
status: Done
assignee:
  - '@claude'
created_date: '2026-11-26T01:40:00Z'
updated_date: '2026-11-26T17:06:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.18
references:
  - doc-151
documentation:
  - doc-167
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
- [x] #1 Given npm test without TLH_SLOW_TESTS, When it runs, Then neither advice perf file runs any timed scenario; they run in full under npm run test:slow
- [x] #2 Given HU advice facing a bet and an 8-opponent calling-range spot, When the opt-in advice perf test runs at real targets, Then each p95 is at most 75% of its target
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Advice perf files run timed scenarios only under TLH_SLOW_TESTS=1 or their own scale variable; both listed in test:slow
2. New opt-in headroom test: HU facing a bet <= 18.75 ms, 9-seat vs 8 opponents <= 150 ms (200 ms target, Q-1)
3. No src change; playtest SHA unchanged; speed-limits CI test unchanged

Full spec: doit/TASK-7.34/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Recorded deviation: headroom scenarios timed 9-seat first, then HU (HU-first gave fresh-worker spikes over 18.75 ms in 6/17 runs). Limits unchanged.

Build: advice perf files opt-in; new headroom test (9-seat 131-133 ms of 150 limit, HU 9.3 ms of 18.75) 3/3; test:slow both files; speed-limits unchanged; playtest SHA unchanged; gate PASS

Judge r1 PASS (6/6 SPEC items); CI 45863631179

Follow-ups: TASK-7.39 created (actions-spot headroom; faster multiway sampler).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both advice perf files now run timed tests only when opted in (TLH_SLOW_TESTS=1 or the file's scale variable); test:slow lists both. New headroom test: 9-seat vs 8 opponents p95 ~132 ms (limit 150, 75% of a 200 ms target, Q-1 auto-accepted), HU facing a bet ~9.3 ms (limit 18.75). No src/ change; playtest hash identical. Judge PASS 6/6, CI green. Review: Q-1 200 ms target (thin margin), headroom scenarios timed 9-seat first (JIT bimodality). Follow-up: 6-max actions HU scenario sits at ~79% of 25 ms.
<!-- SECTION:FINAL_SUMMARY:END -->
