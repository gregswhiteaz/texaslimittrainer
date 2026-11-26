---
id: TASK-7.18
title: Restore equity calculation performance headroom
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T07:03:00Z'
updated_date: '2026-11-26T01:39:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.1
references:
  - doc-8
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.1: the full-ring equity scenarios run at about 88% of their p95 latency target on the reference Mac, so small regressions will break the target. The global 30 s testTimeout was raised for the slowest equity tests and also loosens every other test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the full-speed equity command (EQUITY_PERF_SCALE=1) on the reference Mac, When it runs, Then every scenario's p95 is at most 75% of its target
- [x] #2 Given vite.config.ts, When tests run, Then the default per-test timeout applies everywhere except the tests that need longer, which set their own timeout
- [x] #3 Given postflop advice at a 10-seat flop with 9 opponents, When the advice latency test runs at real targets, Then p95 is at most 75 ms (currently 71.5 ms against 100 ms)
- [x] #4 Given a 9-opponent postflop spot, When the user's advice is computed with value betting (two equity runs: whole and calling range), Then p95 latency meets the 100 ms target (TASK-7.8 measured ~205 ms because the calling-range run exhausts the sampler's rejection budget before falling back)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Faster sampler loop that keeps the random stream (byte-identical results)
2. Early abort for hopeless calling-range runs (same RangeError, sooner) so 9-opponent value-bet advice meets 100 ms
3. 15 untimed warm-ups in both perf tests; new 10-seat value-bet perf scenario (slow group only)
4. Remove the global 30 s testTimeout; 42 slow files set their own (1 s threshold under coverage)

Full spec: doit/TASK-7.18/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-7.8 review MINOR (multiway user-advice latency)

Build: stamp-based sampler with inlined xoshiro (results byte-identical, SHA pinned); early abort z=8 every 8,192 rejections; 15 warm-ups; new value-bet perf scenario (slow group); global testTimeout removed, 42 files set 30 s. p95: full ring 73→52 ms (/80), HU 15.9→4.8 (/20), 9-opp advice 207→54 (/100). test:slow 99 pass. gate PASS.

Recorded deviation (review r1 MAJOR): early-abort projection subtracts z std devs of the remaining count; spec §5's T=500,a=0,r=8192 example changes to false. Approved by orchestrator to honour Q-1's 'no successful result changes'.

Judge r1 PASS 7/7: 521 outputs byte-identical to base 6622918; ~23k simulated runs, 0 false aborts under the corrected (recorded-deviation) rule; p95 at 0.75 scale full ring 51-52 ms (/60), HU 4.6 (/15); 9-opp advice 53 ms (/75); value-bet 52 ms (/100); playtest hash unchanged. J-1-01: equity-reference.test.ts given the 30 s line by orchestrator (43 files now). CI 45735151058 green.
<!-- SECTION:NOTES:END -->
