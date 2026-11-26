---
id: TASK-1.46
title: Stop local timing tests flaking under heavy load
status: Done
assignee:
  - '@claude'
created_date: '2026-11-20T06:02:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-1.35
references:
  - doc-42
documentation:
  - doc-45
parent_task_id: TASK-1
priority: medium
type: chore
ordinal: 207000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Seen in TASK-1.35 (judge J-1-01 and the build): wall-clock assertions failed under parallel load on the Mac — tests/advice/equity.test.ts 'bounds the work when range sets cannot all be dealt' (2092 ms vs 2000 ms), hand-evaluator.perf and invariants.perf once each — then passed on rerun. CI already skips wall-clock checks (TASK-1.20). Flaky local gates slow every doit run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a full local npm test while other heavy processes run (load average well above the core count), When the timing assertions run, Then they do not fail spuriously (e.g. run perf files serially, measure CPU time, or widen local limits with a documented margin)
- [x] #2 Given a real 2x slowdown in one of those hot paths, When the timing tests run locally, Then they still fail
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tests/support/speed.ts cpuNowMs() via process.cpuUsage(); replace performance.now() in the six timing call sites; limits/env/CI skip unchanged.
2. New cpu-clock acceptance test: blocked time not counted; doubled work measured >=1.5x.
3. Manual: timing files pass under 3x-core load; a doubled evaluate fails the README real-target command.

Full spec: doit/TASK-1.46/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: cpuNowMs() (process.cpuUsage) replaces wall-clock in the six local timing sites; new cpu-clock acceptance test; gate PASS. Recorded deviation: SPEC-03's subset run with --coverage exits 1 from global coverage thresholds (not test failures; same when idle) — judge on test counts.

Judge R2 PASS 4/4 after the best-of-10 fix: full-speed evaluator command passed 18/18 under 3x-core load; 2x-slower evaluate still fails idle; npm test 362/362 under load.

Follow-ups (Step 6a, value filter): none — nits recorded as not tracked in doc-45.

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Local speed assertions now time with a new CPU clock, cpuNowMs() in tests/support/speed.ts (process.cpuUsage), instead of the wall clock, so waiting for a core under heavy load no longer counts as slow code. Limits, env overrides, CI skip and log text are unchanged. The evaluator perf test takes best-of-10 CPU-timed runs (fix for judge finding J-1-01). Verified: npm test 362 passed idle and under 42 busy processes; unmutated real-target command passed 18/18 under load; a 2x evaluate mutation still fails 3/3 idle; judge round 2 PASS. Review: assumptions A-1 (AC#2 means detection power kept, npm test floors unchanged), A-2 (hang guards stay wall clock), A-3 (whole-process CPU). Risks: --coverage subset run exits 1 on global thresholds (recorded deviation); evaluator perf file now takes about 4.5 s; TASK-1.39 sandbox-timeout test hit EPERM once under load (watch for recurrence).
<!-- SECTION:FINAL_SUMMARY:END -->
