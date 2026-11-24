---
id: TASK-1.56
title: Keep postflop-ranges unit tests inside the coverage-run time limit
status: Done
assignee:
  - '@claude'
created_date: '2026-11-24T01:43:00Z'
updated_date: '2026-11-24T02:14:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
  - ci
milestone: m-1
dependencies: []
documentation:
  - doc-106
parent_task_id: TASK-1
priority: high
ordinal: 230000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CI's 'Unit tests with coverage' job timed out (30 s testTimeout) on tests/advice/postflop-ranges.test.ts > 'actions mode is total, deterministic and falls back' twice in an hour: main run 45302242833 (d72e593, passed on re-run) and branch run 45306421540 (doit/TASK-2.6). Locally the test takes 1.7 s plain and 8.4 s under coverage; 'default advice stays on every unseen combo' takes 5.2 s under coverage. CI runners are slower, so the margin is gone. Fix the timing without dropping or loosening any assertion (e.g. a measured per-test timeout, moving the heavy case to the uncovered sweep job, or making the equity work cheaper).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the unit tests with coverage run on a CI runner, When tests/advice/postflop-ranges.test.ts runs, Then every test finishes with at least 3x headroom under its timeout, shown by the measured duration in the CI log
- [x] #2 Given the change, When the test file is compared with its previous version, Then no assertion is removed or loosened and the number of checked cases is unchanged
- [x] #3 Given three consecutive CI runs on the story branch, When they finish, Then 'Unit tests with coverage' passes in all three
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the fast-check property block and the 'default advice stays on every unseen combo' test verbatim into tests/advice/postflop-ranges.property.test.ts (uncovered sweep job)
2. Keep the scripted fallback + heads-up checks and the blocked-start test in postflop-ranges.test.ts under coverage
3. Prove no expect/seed/case-count change by a sorted diff; coverage thresholds still met
4. Push and get three consecutive green CI runs, reading durations from the logs

Full spec: doit/TASK-1.56/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: heavy property block and default-advice test moved verbatim to tests/advice/postflop-ranges.property.test.ts (sweep job, no coverage); remaining coverage tests 174/142 ms locally; expect-line diff empty; gate PASS

Judge r1 PASS. CI: 45308447002 (602ef4d), 45309089872 attempts 1+2 (580fc4b) all green; coverage-job tests ≤309 ms, sweep-job moved tests ≤7,125 ms (30 s timeout).

Follow-ups: none (sweep-job timing already proven in three CI runs by the judge).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved the two 30,000-trial equity tests (property block and 'default advice stays on every unseen combo') verbatim from postflop-ranges.test.ts into a new postflop-ranges.property.test.ts. It runs in the uncovered sweep job, because coverage slowed them about 5x and one timed out on CI (36 s against 30 s). Verified: test:unit passes (299 passed, coverage lines 92.65 %, thresholds met). Remaining coverage tests take about 95 ms. Moved tests take about 1.6 s plain. Reviews had zero findings and judge round 1 passed. Assumptions to review: A-1 (move rather than raise timeouts), A-3 (new test names), A-4 (two constants copied, no helper). Follow-up: confirm the sweep job on the next CI run.
<!-- SECTION:FINAL_SUMMARY:END -->
