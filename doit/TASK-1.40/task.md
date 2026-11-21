File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.40 - Hold-src-playtest-and-src-table-to-the-90-coverage-threshold.md

Task TASK-1.40 - Hold src/playtest and src/table to the 90% coverage threshold
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 200000
Created: 2026-11-19 20:45 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-32

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-1.26 - Pin the playtest summary and policy-lifetime tests [completed]
   └─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
            ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
            │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
            │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
            └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
               └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.26 (A-1): the two folders now get the headless lint rule but not the 90% coverage threshold, because HEADLESS_DIRS also drives TASK-1.1's locked coverage test. Both are near 100% today, so this pins it.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given vite.config.ts, When coverage runs, Then src/playtest/** and src/table/** are held to the same 90% thresholds as engine, bots, advice and stats
- [ ] #2 Given TASK-1.1's coverage test (unlocked with a recorded reason), When it runs, Then it checks the widened glob and LINT_ONLY_HEADLESS_DIRS is folded into HEADLESS_DIRS

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

