---
id: TASK-1.20
title: Keep strict wall-clock speed checks out of the CI test run
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T04:37:00Z'
updated_date: '2026-11-18T06:32:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.7
documentation:
  - doc-12
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
- [x] #1 Given CI (environment variable CI=true), When npm test runs, Then no test fails solely because a wall-clock duration or throughput limit is exceeded; correctness assertions in those tests still run
- [x] #2 Given a local run on the reference machine, When the documented full-speed commands run (hand evaluator and equity perf suites), Then the original speed targets are still enforced unchanged
- [x] #3 Given the bounded-work test for infeasible equity ranges, When it runs in CI, Then it still proves the work is bounded (e.g. by counting operations or a generous CI-only time ceiling) rather than being removed
- [x] #4 Given the README or perf test headers, When a developer reads them, Then they state which commands enforce the real speed targets and that CI does not
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: tests/support/speed.ts (speedLimitsEnforced: CI=true skips speed asserts only); evaluator/equity perf tests keep correctness asserts; bounded-work ceiling 2 s local / 10 s CI; nested-vitest acceptance test; README 'Speed targets'; no locked files touched; gate PASS.

CI run 44251035414 (head a6768ad): success first try, 28/28 files; note printed; evaluator 1.90M evals/s in CI; bounded-work 1673 ms. Judge round 1: PASS 8/8, no findings; mutation probes SPEC-04/06 caught; full-speed commands on Mac pass (15.2M evals/s, 25.5 ms build; equity p95 all within target, closest 72.7/80 ms).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Speed limits in the hand-evaluator and equity perf suites, and the bounded-work test ceiling, are no longer enforced when CI=true. The rate, build-time and p95 checks are skipped and the note 'speed limits not enforced (CI=true)' is printed. Correctness assertions still run. The bounded-work ceiling is 10 s in CI and 2 s locally. Local runs and the documented full-speed commands are unchanged, and README has a new Speed targets section. Verification: lint, typecheck and npm test passed locally (89 passed, 1 skipped); a nested-Vitest acceptance test proves CI vs local behaviour; 2 review rounds (r1 MAJOR FORCE_COLOR broke the summary regex, fixed with NO_COLOR plus ANSI strip, r2 clean). Judge and CI pending. Assumptions to review (A-1..A-5): CI means CI==='true'; 10 s / 2 s ceiling; retry timing tests unchanged; CI=true also ignores threshold env vars; local slack thresholds unchanged. Risks: CI no longer catches speed regressions, only the manual full-speed commands do. Follow-up not created: kill the nested Vitest process group on timeout.
<!-- SECTION:FINAL_SUMMARY:END -->
