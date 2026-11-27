---
id: TASK-1.53
title: >-
  Cut CI wall time to about 3.5 minutes: shard E2E and rebalance the sweep
  shards
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-23T04:42:00Z'
updated_date: '2026-11-27T18:49:00Z'
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
- [ ] #2 Given the E2E suite on CI, When it runs, Then it is split into 4 parallel jobs (2 shards per browser, Chromium and WebKit), every e2e test runs exactly once per browser, the Playwright report/artifact on failure still identifies the failing test, and no test or assertion is removed
- [ ] #3 Given a push to main after this change, When CI finishes, Then the wall time is about 3.5 minutes or less, measured on at least 2 runs (the repo is public, so the extra standard-runner jobs are not billed)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. E2E job -> matrix chromium/webkit x shard 1-2 (fail-fast false), per-job report artifact
2. Sweeps -> 3 shards by measured per-file time: tools/ci/sweep-shards.ts (assignShards + WeightedSequencer), tools/ci/sweep-weights.json, wired in vite.config.ts
3. Re-pin locked CI tests (job names, matrices, commands); new shard tests
4. README branch-protection contexts
5. Prove on 2 pushed branch runs; record 2 main runs after merge (AC#3)

Full spec: doit/TASK-1.53/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot 2026-11-25 measurement (main CI run 45677932929): wall time 5.6 min (<6 min target met); sweep shard 1 = 123 s, shard 2 = 219 s (1.8x); E2E job (5.6 min) is the critical path, so rebalancing sweeps would not shorten CI. Skipped in autopilot as no-gain; user to decide whether to keep, re-scope or drop.

2026-11-27: user chose 'Shard E2E + rebalance sweeps'. Main run 46046670509: wall 439 s; E2E job 439 s (test step 378 s, ~420 tests x 2 browsers); sweep shard 2 212 s, shard 1 147 s; unit 75 s; lint/build/playtest 62 s. Expected cost ~4-5 extra Actions minutes per run for job setup.

Build: E2E 4-job matrix; 3 weighted sweep shards (sweep-shards.ts + sweep-weights.json + sequencer); locked CI tests re-pinned (Q-2); recorded deviation: tests/support/sandbox.ts copies the two new tools/ci files because vite.config.ts imports them; gate PASS
<!-- SECTION:NOTES:END -->
