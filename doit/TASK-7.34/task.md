File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.34 - Make-the-advice-speed-checks-opt-in-and-restore-headroom-on-the-remaining-tight-spots.md

Task TASK-7.34 - Make the advice speed checks opt-in and restore headroom on the remaining tight spots
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 253000
Created: 2026-11-26 01:40 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-151

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 5 total):
└─ TASK-7.18 - Restore equity calculation performance headroom [completed]
   └─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
            └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Follow-up from TASK-7.18 (doc-151). tests/advice/equity.perf.test.ts and tests/advice/postflop.perf.test.ts still run in every npm test at 20x slack, against the standing rule that speed checks are opt-in (TLH_SLOW_TESTS / npm run test:slow). HU advice facing a bet sits at 90% of its 25 ms target and the 8-opponent calling-range run takes ~97 ms.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given npm test without TLH_SLOW_TESTS, When it runs, Then neither advice perf file runs any timed scenario; they run in full under npm run test:slow
- [ ] #2 Given HU advice facing a bet and an 8-opponent calling-range spot, When the opt-in advice perf test runs at real targets, Then each p95 is at most 75% of its target

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

