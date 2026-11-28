File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.39 - Restore-advice-speed-headroom-on-the-6-max-actions-spot-and-the-9-seat-calling-range-spot.md

Task TASK-7.39 - Restore advice speed headroom on the 6-max actions spot and the 9-seat calling-range spot
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 260000
Created: 2026-11-26 17:06 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-167

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-7.34 - Make the advice speed checks opt-in and restore headroom on the remaining tight spots [completed]
   └─ TASK-7.18 - Restore equity calculation performance headroom [completed]
      └─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
         └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
            └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
               └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-7.34 (doc-167). 'actions: 6-max flop facing a bet, one opponent' sits at ~79% of its 25 ms target (~15 ms outside equity, likely estimateOpponentRanges). The 9-seat vs 8 opponents spot needed a 200 ms target (TASK-7.34 Q-1) and runs ~132 ms against a 150 ms headroom limit; reaching 100 ms needs a faster multiway calling-range sampler, which may change seeded results.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the opt-in advice perf test, When 'actions: 6-max flop facing a bet, one opponent' runs at real targets, Then its p95 is at most 75% of 25 ms with advice results unchanged (playtest SHA identical)
- [ ] #2 Given a faster multiway calling-range sampler, When the 9-seat vs 8 opponents spot runs, Then its p95 is at most 75 ms (75% of 100 ms), and any change to seeded advice or bot results is measured and approved by the user before merge

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

