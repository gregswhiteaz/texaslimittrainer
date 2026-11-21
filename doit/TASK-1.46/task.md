File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.46 - Stop-local-timing-tests-flaking-under-heavy-load.md

Task TASK-1.46 - Stop local timing tests flaking under heavy load
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 207000
Created: 2026-11-20 06:02 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-42

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 4 total):
└─ TASK-1.35 - Harden and tidy the merged-branch cleanup script [completed]
   └─ TASK-1.24 - Protect main and keep CI action pins current [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]

Description:
--------------------------------------------------
Seen in TASK-1.35 (judge J-1-01 and the build): wall-clock assertions failed under parallel load on the Mac — tests/advice/equity.test.ts 'bounds the work when range sets cannot all be dealt' (2092 ms vs 2000 ms), hand-evaluator.perf and invariants.perf once each — then passed on rerun. CI already skips wall-clock checks (TASK-1.20). Flaky local gates slow every doit run.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a full local npm test while other heavy processes run (load average well above the core count), When the timing assertions run, Then they do not fail spuriously (e.g. run perf files serially, measure CPU time, or widen local limits with a documented margin)
- [ ] #2 Given a real 2x slowdown in one of those hot paths, When the timing tests run locally, Then they still fail

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

