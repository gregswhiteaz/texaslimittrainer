---
id: TASK-1.19
title: Retry the stalled Playwright system-dependency install in CI
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T04:37:00Z'
updated_date: '2026-11-18T05:17:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
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
- [ ] #1 Given the workflow, When the Playwright system-dependency (and browser) install step runs, Then it has a step-level timeout well below the job timeout (e.g. 5 minutes per attempt)
- [ ] #2 Given the install step fails or times out, When CI continues, Then it retries the install automatically (at least 2 retries) before failing the job
- [ ] #3 Given all install attempts fail, When the job ends, Then the workflow is reported as failed with a log line naming the install step
- [ ] #4 Given a normal run, When the install succeeds on the first attempt, Then total job time is not increased by more than 10 seconds
- [ ] #5 Given the static workflow tests in tests/ci/workflow.test.ts, When they run, Then they assert the timeout and retry are present
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/ci/retry.js: Node-only retry helper (3 attempts, 240 s per attempt, 10 s delay, 10 s kill grace, process-group kill, ::warning:: on retry, ::error:: '<step> failed after 3 attempts' then exit 1).
2. ci.yml: wrap both Playwright install steps (install --with-deps / install-deps) with the helper; step timeout-minutes 13.
3. tests: helper tests against tests/ci/fixtures/flaky-command.js (fail N times, hang, all-fail); update tests/ci/workflow.test.ts for timeout/retry wiring.
4. README sentence; measure helper overhead on the branch's green CI run (≤ 10 s).

Full spec: doit/TASK-1.19/spec.md
<!-- SECTION:PLAN:END -->
