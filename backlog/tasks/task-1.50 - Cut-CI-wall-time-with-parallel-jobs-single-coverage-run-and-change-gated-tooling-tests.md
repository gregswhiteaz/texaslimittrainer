---
id: TASK-1.50
title: >-
  Cut CI wall time with parallel jobs, single coverage run and change-gated
  tooling tests
status: Done
assignee:
  - '@claude'
created_date: '2026-11-22T03:13:00Z'
updated_date: '2026-11-22T04:53:00Z'
labels:
  - chore
  - ci
  - dream-limit-holdem-trainer
milestone: m-1
dependencies: []
documentation:
  - doc-78
parent_task_id: TASK-1
priority: high
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CI is now a blocker: main's unit-test step grew from 319 s (#148) to 661 s (#161) to 869 s (#164) in about nine merges, browser tests take 150–210 s, and TASK-6.4's branch hit the 20-minute GitHub job limit once. The apt install is no longer the bottleneck (~20 s with the cache). User asked (2026-11-22) for one story doing all of: measure first, parallel CI jobs, coverage measured once, tooling tests only when tooling changes, and a 30-minute safety timeout. Must stay within the free GitHub Actions budget (no paid runners) and keep every check that runs today running somewhere.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the current CI, When the slowest test files are profiled on CI (per-file durations from a CI run), Then the top files and the share of time spent on coverage instrumentation, process-spawning tooling tests and bot/engine sweeps are recorded in the story doc before any change
- [x] #2 Given a push, When CI runs, Then lint+typecheck, unit tests split into at least two shards, and browser (e2e) tests run as parallel jobs, every existing check still runs, and the workflow's wall time on main is measured and is at most about half of CI #164's (about 18 min) — target 5–6 min
- [x] #3 Given a push, When unit tests run, Then code coverage is measured once (one shard or one dedicated job) and the existing coverage thresholds are still enforced, and the other shards run without coverage instrumentation
- [x] #4 Given a push that touches no tooling files (tools/, configuration files, .github/), When CI runs, Then the process-spawning tooling tests (CI scripts, git helpers, lint/toolchain config tests) are skipped; Given a push that touches any of those, or the scheduled run, Then they run
- [x] #5 Given the CI workflows, When a job runs, Then its time limit is 30 minutes
- [x] #6 Given the new CI, When a test is deliberately broken in each shard and in a tooling test (on a branch, then reverted), Then CI fails in the right job each time — nothing is silently skipped
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record CI #164 measurements (per-file times, coverage share, partition) — done in spec §3.1.
2. ci.yml: parallel jobs — lint+typecheck+build, unit (coverage, thresholds), sweeps ×2 shards (no coverage), tooling (gated), e2e; changes job via tools/ci/tooling-changed.js; daily 06:00 UTC tooling-only schedule; 30-min job limits in ci/visual/million.
3. npm scripts test:unit, test:sweeps, test:tooling; npm test unchanged.
4. Q-6 locked-test edits; README lists the six checks.
5. Live proof on doit/TASK-1.50: drill run (one broken test per gated job), revert run green with wall time ≤ 9 min, non-tooling push shows tooling skipped.

Full spec: doit/TASK-1.50/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: 6-job ci.yml (e2e, checks, coverage, sweeps×2, changes, tooling), tools/ci/tooling-changed.js, test:unit/sweeps/tooling scripts, 30-min limits, daily tooling-only schedule, README checks; Q-6 locked edits only; gate PASS. Live proofs A–D pending.

Review R1: 0 blocking; security MINOR (:: line injection) + 2 code MINORs fixed in-story; gate PASS. Live: #166 green 212 s; #167 tooling skipped on doit-only push.

Judge R1 PASS 14/14 (55/55 scratch-repo detector cases, 29/29 mutants, live runs #166–#169 verified; #169 wall 233 s).

Follow-ups (Step 6a): created TASK-1.51 (spike: Actions usage vs budget). Post-merge: record first main run wall time and first nightly (06:00 UTC) run in doc-78; open a task if main > 540 s. Not tracked (infra, below bar): persist-credentials default, '... and N more' line, branch protection (403 on Free private).

Post-merge: main CI #171 (44986680853, 551c270) success, all 7 jobs, wall 260 s (≤ 540 s); Visual #91 success; branch pruned. First nightly 06:00 UTC run still to record.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CI split from one serial job into six (e2e, checks, coverage, 2 sweep shards, changes, tooling), coverage instrumented once on the unit group, tooling tests gated by an in-repo change detector plus a daily 06:00 UTC schedule, 30-min limit on every job. Why: main CI #164 took about 1,172 s. Verified: new acceptance/unit tests, npm test 164 files green, live runs #166 green 212 s, #167 tooling skipped on doit-only push, #168 drill failed exactly the 4 expected jobs, #169 revert green 233 s (about 5x faster than #164). Review R1: 0 blocking, 3 MINORs fixed. Assumptions A-1..A-10 to review (story doc). Risks: Actions budget (about 2,680 min used since 2026-11-18 vs 2,000/month Free allowance; runs not reduced); first main run and first nightly run to be recorded after merge.
<!-- SECTION:FINAL_SUMMARY:END -->
