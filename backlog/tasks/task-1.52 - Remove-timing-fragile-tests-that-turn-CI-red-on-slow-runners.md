---
id: TASK-1.52
title: Remove timing-fragile tests that turn CI red on slow runners
status: Done
assignee:
  - '@claude'
created_date: '2026-11-22T14:55:00Z'
updated_date: '2026-11-22T17:18:00Z'
labels:
  - follow-up
  - bug
  - ci
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.6
documentation:
  - doc-80
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
- [x] #1 Given the unit (coverage) test group on CI, When it runs, Then no single test takes more than 10 s on the last green CI run, and the TASK-6.6 lineUpPolicyFactory checks keep their assertions (the 200-hand 6-max comparison moves to the sweep group or the opt-in slow group, with a smaller every-push version kept in unit)
- [x] #2 Given e2e/action-bar-limits.spec.ts with a paused clock, When the bot at seat 4 replies late from the advice worker, Then the test still passes because it advances the clock until the expected seat is to act (bounded), instead of a fixed 1,000 ms budget — proven by delaying worker replies in a test run
- [x] #3 Given every unit, sweep and e2e test, When per-test durations from the latest main CI run are compared with their timeouts, Then each test that uses more than 50% of its timeout, and each e2e test that advances a paused clock by a fixed budget while waiting for a worker reply, is listed in the story doc and fixed (or justified)
- [x] #4 Given the changes, When CI runs on the branch, Then all jobs are green and no test assertion is removed or loosened
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

Audit correction (spec §5, 400-slice loops): measured ~2.6–2.8 ms real per 50 ms slice, so 400 slices ≈ 1.0–1.1 s real (not 'several seconds'). Fixed under Q-2 with runUntil (10 s real / 600 s fake caps). Normal runs: slowest wait 450 ms fake / 310 ms real across 72 calls. stake-choice.spec:76 left alone: it asserts only blinds/stacks from the deal timer (spec §5).

Judge R1 PASS 8/8 (own 4,000 ms delay checks; diffs of every locked e2e file; CI slowest unit test 8.96 s cli.test.ts). Non-blocking: J-1-01 no-turn test does not prove which bound tripped; J-1-02 audit margins (cli.test.ts 8.96 s on CI vs 10 s AC target; million-hand timeout is 120 s). Not tracked (infra, no failure path): J-1-01, NITs, ~42 s e2e cost of delayed-hand proofs (left for the user to decide).

Locked test edited for TASK-6.8 Q-4 (user-approved): Tough comparison shortened to 45 hands.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved the two slow unit tests (lineUpPolicyFactory, Calling-station draws) to sweep files and kept fast unit versions; added runUntil/runUntilMyTurn (50 ms slices, 10 s real cap, 600 s fake cap — recorded deviation from A-3) and applied it to six locked e2e files (Q-1) and five more with 400-slice loops (Q-2); proved it with 2 s delayed worker replies (worker-delay.spec.ts, worker-delay-hand.spec.ts). Verified: unit 171 pass (slowest 3.4 s), sweeps 310 pass, e2e 142 pass x2, branch CI #176 green; review R1 MAJOR fixed, R2 clean. Review: A-2 hand counts (20/100/20 instead of 40/100/20), A-3 fake bound. Follow-up: delayed-hand tests add ~42 s to every e2e run (CI critical path).
<!-- SECTION:FINAL_SUMMARY:END -->
