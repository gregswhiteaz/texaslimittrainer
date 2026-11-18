---
id: TASK-1.20
title: Keep strict wall-clock speed checks out of the CI test run
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T04:37:00Z'
updated_date: '2026-11-18T06:17:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
parent_task_id: TASK-1
priority: high
type: chore
ordinal: 6600
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On TASK-1.3's CI attempt 2 (run 44236421395), two pre-existing wall-clock tests failed on a slow shared GitHub runner although no related code changed: tests/engine/hand-evaluator.perf.test.ts reached 975,968 evals/s against its 1,000,000 floor, and tests/advice/equity.test.ts 'bounds the work…' took 2676 ms against a 2000 ms limit. Shared runners vary several-fold in speed, so hard wall-clock limits inside the CI suite make unrelated pushes go red. The real speed targets are already enforced by separate full-speed commands on the reference Mac (TASK-1.2 SPEC-12, TASK-7.1 SPEC-12). Follow-up from TASK-1.3 judge finding J-1-00.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given CI (environment variable CI=true), When npm test runs, Then no test fails solely because a wall-clock duration or throughput limit is exceeded; correctness assertions in those tests still run
- [ ] #2 Given a local run on the reference machine, When the documented full-speed commands run (hand evaluator and equity perf suites), Then the original speed targets are still enforced unchanged
- [ ] #3 Given the bounded-work test for infeasible equity ranges, When it runs in CI, Then it still proves the work is bounded (e.g. by counting operations or a generous CI-only time ceiling) rather than being removed
- [ ] #4 Given the README or perf test headers, When a developer reads them, Then they state which commands enforce the real speed targets and that CI does not
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tests/support/speed.ts: speedLimitsEnforced(env) (false when CI=true) + note text.
2. hand-evaluator.perf.test.ts and equity.perf.test.ts: keep running and printing numbers; skip only speed assertions when CI=true; correctness/method assertions always run.
3. equity.test.ts bounded-work: ceiling 2000 ms locally, 10,000 ms per call when CI=true; error-message assertions unchanged.
4. tests/ci/speed-limits.acceptance.test.ts: nested vitest runs with impossible limits — CI=true passes with the note, without CI fails.
5. README 'Speed targets' section + perf test header comments naming the full-speed commands.

Full spec: doit/TASK-1.20/spec.md
<!-- SECTION:PLAN:END -->
