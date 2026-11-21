File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.20 - Pin-the-preflop-chart-validators-edge-cases.md

Task TASK-7.20 - Pin the preflop chart validator's edge cases
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 176000
Created: 2026-11-18 16:24 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-7 - Get trustworthy advice
References: doc-14

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 7 total):
└─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
            └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.2 reviews: one mutant survived (word count accepts non-letter tokens) and two behaviours are unspecified.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a justification of 60 numeric or punctuation tokens, When the validator runs, Then it is rejected as missing its justification
- [ ] #2 Given chartCell is called with an unknown hand class, When it throws, Then the RangeError and its message are documented in the module and covered by a test
- [ ] #3 Given parseChart reports a bad token or spot name, When the message is built, Then the echoed value is cut to at most 20 characters

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

