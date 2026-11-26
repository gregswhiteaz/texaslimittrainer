File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.18 - Restore-equity-calculation-performance-headroom.md

Task TASK-7.18 - Restore equity calculation performance headroom
==================================================

Status: ○ To Do
Priority: Medium
Type: enhancement
Ordinal: 171000
Created: 2026-11-18 07:03 (UTC)
Updated: 2026-11-23 04:39 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-8

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 4 total):
└─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-7.1: the full-ring equity scenarios run at about 88% of their p95 latency target on the reference Mac, so small regressions will break the target. The global 30 s testTimeout was raised for the slowest equity tests and also loosens every other test.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the full-speed equity command (EQUITY_PERF_SCALE=1) on the reference Mac, When it runs, Then every scenario's p95 is at most 75% of its target
- [ ] #2 Given vite.config.ts, When tests run, Then the default per-test timeout applies everywhere except the tests that need longer, which set their own timeout
- [ ] #3 Given postflop advice at a 10-seat flop with 9 opponents, When the advice latency test runs at real targets, Then p95 is at most 75 ms (currently 71.5 ms against 100 ms)
- [ ] #4 Given a 9-opponent postflop spot, When the user's advice is computed with value betting (two equity runs: whole and calling range), Then p95 latency meets the 100 ms target (TASK-7.8 measured ~205 ms because the calling-range run exhausts the sampler's rejection budget before falling back)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-7.8 review MINOR (multiway user-advice latency)

