---
id: TASK-1.19
title: Retry the stalled Playwright system-dependency install in CI
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T04:37:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
documentation:
  - doc-11
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 6500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Twice in four CI-backed stories (TASK-1.7 PR run 44220403675 attempt 1, TASK-1.3 run 44236421395 attempt 1) the 'Install Playwright system dependencies' step stalled on the Ubuntu apt mirror for 19+ minutes and hit the 20-minute job timeout, while the same step normally takes ~30-70 s. Each stall costs a manual cancel/re-run and up to 20 billed minutes on this private repo. Follow-up from TASK-1.7 (J-2-01) and TASK-1.3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the workflow, When the Playwright system-dependency (and browser) install step runs, Then it has a step-level timeout well below the job timeout (e.g. 5 minutes per attempt)
- [x] #2 Given the install step fails or times out, When CI continues, Then it retries the install automatically (at least 2 retries) before failing the job
- [x] #3 Given all install attempts fail, When the job ends, Then the workflow is reported as failed with a log line naming the install step
- [x] #4 Given a normal run, When the install succeeds on the first attempt, Then total job time is not increased by more than 10 seconds
- [x] #5 Given the static workflow tests in tests/ci/workflow.test.ts, When they run, Then they assert the timeout and retry are present
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/ci/retry.js: Node-only retry helper (3 attempts, 240 s per attempt, 10 s delay, 10 s kill grace, process-group kill, ::warning:: on retry, ::error:: '<step> failed after 3 attempts' then exit 1).
2. ci.yml: wrap both Playwright install steps (install --with-deps / install-deps) with the helper; step timeout-minutes 13.
3. tests: helper tests against tests/ci/fixtures/flaky-command.js (fail N times, hang, all-fail); update tests/ci/workflow.test.ts for timeout/retry wiring.
4. README sentence; measure helper overhead on the branch's green CI run (≤ 10 s).

Full spec: doit/TASK-1.19/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: tools/ci/retry.js (3×240 s, process-group kill, ::warning::/::error::), both Playwright install steps wrapped with timeout-minutes 13; retry tests with flaky stub (hang/fail/tree/ignore-TERM); workflow static tests; README; gate PASS.

CI run 44247645009: attempt 1 failed only in pre-existing hand-evaluator throughput floor (935,660/s, TASK-1.20); real-sudo test passed 4.1 s. Attempt 2 success; install-deps 27 s via helper, overhead ~0.04 s. Judge round 1: PASS 12/12 (41/41 holdout checks).

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wrapped both Playwright install steps in a new dependency-free Node helper, tools/ci/retry.js: 240 s per attempt, 3 attempts, 10 s delay, process-group kill, plus step timeout-minutes 13 on both steps (worst case about 12.8 min vs the 20-min job timeout). Final failure logs an ::error:: line naming the step. Verified: gates build-1 and fix-2 PASS, 20 helper/workflow tests pass locally (Linux-only real-sudo hang test added after user decision Q-1, runs in CI only); judge and CI results pending. Assumptions to review: A-1..A-6 (timings, both steps wrapped, any non-zero exit retried, AC#4 measured as helper overhead). Risks/follow-ups: if SIGKILL also gets EPERM the attempt waits for the 13-min backstop; sudo test lacks try/finally cleanup; spec section 7 note on apt and process groups is likely wrong. Size 526 lines vs 360 budget (warning only).
<!-- SECTION:FINAL_SUMMARY:END -->
