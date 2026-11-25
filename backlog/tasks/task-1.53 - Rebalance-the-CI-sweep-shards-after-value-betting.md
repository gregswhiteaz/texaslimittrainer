---
id: TASK-1.53
title: Rebalance the CI sweep shards after value betting
status: To Do
assignee: []
created_date: '2026-11-23T04:42:00Z'
updated_date: '2026-11-25T18:48:00Z'
labels:
  - follow-up
  - ci
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.8
parent_task_id: TASK-1
priority: medium
ordinal: 223000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After TASK-7.8, CI run #210: sweep shard 2 took 476 s while shard 1 took 156 s (vitest --shard splits by file count, and the playtest-heavy files cluster). CI wall time went from ~4.5 to ~8 min; the 30-min job limit is still far, but every new bot test lands on the slow shard.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the sweep tests on CI, When they run, Then no sweep shard takes more than about 1.5× the other (by duration, e.g. 3 shards or duration-based file assignment) and the CI wall time on main is back under about 6 min, with every sweep file still run exactly once
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot 2026-11-25 measurement (main CI run 45677932929): wall time 5.6 min (<6 min target met); sweep shard 1 = 123 s, shard 2 = 219 s (1.8x); E2E job (5.6 min) is the critical path, so rebalancing sweeps would not shorten CI. Skipped in autopilot as no-gain; user to decide whether to keep, re-scope or drop.
<!-- SECTION:NOTES:END -->
