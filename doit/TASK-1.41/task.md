File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.41 - Clarify-naming-and-comments-in-the-invariant-checker.md

Task TASK-1.41 - Clarify naming and comments in the invariant checker
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 201000
Created: 2026-11-19 21:53 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-33

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
└─ TASK-1.27 - Tighten the playtest invariant checker and its messages [completed]
   └─ TASK-1.8 - Check game invariants after every playtest action [completed]
      ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.27 (code MINOR) and TASK-1.8 (L4 raise-clause comment, excluded from TASK-1.27). Readability only; no behaviour change.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given checkStep in src/engine/invariants.ts, When it is read, Then the arrays formerly named rest and others are named stateChecks and afterChips
- [ ] #2 Given the L4 legal-action check, When it is read, Then a comment explains why its raise clause is written as it is (with a reference to the rule it enforces)
- [ ] #3 Given the change, When npm test and npm run playtest -- --hands 10000 --seed 42 run, Then all tests pass and the output is byte-identical to before

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

