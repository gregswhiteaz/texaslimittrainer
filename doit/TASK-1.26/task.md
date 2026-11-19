File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.26 - Pin-the-playtest-summary-and-policy-lifetime-tests.md

Task TASK-1.26 - Pin the playtest summary and policy-lifetime tests
==================================================

Status: ○ To Do
Priority: Medium
Type: chore
Ordinal: 179000
Created: 2026-11-18 17:24 (UTC)
Updated: 2026-11-18 21:33 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-15

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 7 total):
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
Follow-up from TASK-1.6 (doc-15): the judge's J-1-01 (MEDIUM) and code review found that no test checks a real 'Largest pot' value — two mutants survive (last hand's pot instead of the max; summing the pot index instead of the amount). Also untested: each seat's policy is created once per hand. src/playtest is not covered by the headless-boundary lint.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a playtest summary over at least two hands where the larger pot comes first, When summarize runs, Then Largest pot equals the largest per-hand sum of award amounts
- [ ] #2 Given a real multi-hand run, When the report is built, Then the Largest pot line matches an independent recomputation from the played hands
- [ ] #3 Given a hand with several decisions per seat, When the runner plays it, Then each seat's policy is created exactly once for that hand
- [ ] #4 Given src/playtest imports a UI or browser module, When npm run lint runs, Then the headless-boundary rule fails naming the file
- [ ] #5 Given src/table imports a UI or browser module, When npm run lint runs, Then the headless-boundary rule fails naming the file, and the TASK-3.1 import-scan test (SPEC-10) is removed

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-3.1 follow-up (doc-21).

