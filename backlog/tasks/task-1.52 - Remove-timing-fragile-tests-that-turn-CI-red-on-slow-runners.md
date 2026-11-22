---
id: TASK-1.52
title: Remove timing-fragile tests that turn CI red on slow runners
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-22T14:55:00Z'
updated_date: '2026-11-22T15:24:00Z'
labels:
  - follow-up
  - bug
  - ci
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.6
parent_task_id: TASK-1
priority: high
ordinal: 217000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Main CI #174 (44990101974, 341563c) failed on two code checks that passed on re-run: (1) tests/playtest/policy.test.ts 'lineUpPolicyFactory plays the preset at 6 seats…' (TASK-6.6) plays 2×200 six-max line-up hands with a Maniac under coverage: 17.5–20 s normally, 31 s on a slow runner, past the 30 s per-test timeout; (2) e2e/action-bar-limits.spec.ts:33 (TASK-3.7, Chromium) expected seat 5 to act after a fixed 1,000 ms paused-clock budget, but seat 4's bot reply from the advice worker had not arrived — the same worker-vs-clock race class TASK-3.27 fixed in rapid-pace.spec.ts. Such failures stop autopilot. User asked (2026-11-22) for a small fix story that also sweeps for other tests with tight timing margins.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the unit (coverage) test group on CI, When it runs, Then no single test takes more than 10 s on the last green CI run, and the TASK-6.6 lineUpPolicyFactory checks keep their assertions (the 200-hand 6-max comparison moves to the sweep group or the opt-in slow group, with a smaller every-push version kept in unit)
- [ ] #2 Given e2e/action-bar-limits.spec.ts with a paused clock, When the bot at seat 4 replies late from the advice worker, Then the test still passes because it advances the clock until the expected seat is to act (bounded), instead of a fixed 1,000 ms budget — proven by delaying worker replies in a test run
- [ ] #3 Given every unit, sweep and e2e test, When per-test durations from the latest main CI run are compared with their timeouts, Then each test that uses more than 50% of its timeout, and each e2e test that advances a paused clock by a fixed budget while waiting for a worker reply, is listed in the story doc and fixed (or justified)
- [ ] #4 Given the changes, When CI runs on the branch, Then all jobs are green and no test assertion is removed or loosened
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the 200/500-hand lineUpPolicyFactory comparison and the calling-station draws test into sweep (acceptance) files; keep smaller unit versions with the same expects.
2. e2e/support/paused-clock.ts runUntilMyTurn (50 ms slices, 60 s fake / 10 s real cap, throws).
3. Replace fixed worker-waiting clock budgets in six locked e2e files (Q-1 approved).
4. e2e/worker-delay.spec.ts: 2 s delayed worker replies — old loop fails (control), helper passes, bound throws.
5. Audit table (tests > 50% of timeout, fixed-budget waits) in the story doc.

Full spec: doit/TASK-1.52/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build blocked on A-3 vs SPEC-04 (60 s fake cap exhausted in ~3 s real). Resolved by orchestrator: maxFakeMs default 600,000; 10 s real bound governs (recorded deviation).

Build: slow line-up and calling-station tests moved to sweeps (unit versions keep every expect, 1.7 s / 1 ms); runUntilMyTurn helper (50 ms slices, 600 s fake / 10 s real cap); six locked e2e files switched (clock advance only); worker-delay.spec (2 s replies: control fails, helper passes, bound throws); e2e twice green; gate PASS.
<!-- SECTION:NOTES:END -->
