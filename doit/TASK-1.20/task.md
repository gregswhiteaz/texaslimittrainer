File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.20 - Keep-strict-wall-clock-speed-checks-out-of-the-CI-test-run.md

Task TASK-1.20 - Keep strict wall-clock speed checks out of the CI test run
==================================================

Status: ○ To Do
Priority: High
Type: chore
Ordinal: 6600
Created: 2026-11-18 04:37 (UTC)
Labels: dream-limit-holdem-trainer
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 2 total):
└─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
On TASK-1.3's CI attempt 2 (run 44236421395), two pre-existing wall-clock tests failed on a slow shared GitHub runner although no related code changed: tests/engine/hand-evaluator.perf.test.ts reached 975,968 evals/s against its 1,000,000 floor, and tests/advice/equity.test.ts 'bounds the work…' took 2676 ms against a 2000 ms limit. Shared runners vary several-fold in speed, so hard wall-clock limits inside the CI suite make unrelated pushes go red. The real speed targets are already enforced by separate full-speed commands on the reference Mac (TASK-1.2 SPEC-12, TASK-7.1 SPEC-12). Follow-up from TASK-1.3 judge finding J-1-00.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given CI (environment variable CI=true), When npm test runs, Then no test fails solely because a wall-clock duration or throughput limit is exceeded; correctness assertions in those tests still run
- [ ] #2 Given a local run on the reference machine, When the documented full-speed commands run (hand evaluator and equity perf suites), Then the original speed targets are still enforced unchanged
- [ ] #3 Given the bounded-work test for infeasible equity ranges, When it runs in CI, Then it still proves the work is bounded (e.g. by counting operations or a generous CI-only time ceiling) rather than being removed
- [ ] #4 Given the README or perf test headers, When a developer reads them, Then they state which commands enforce the real speed targets and that CI does not

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

