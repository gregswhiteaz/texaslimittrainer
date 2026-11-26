File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.27 - Print-the-heads-up-and-full-ring-charts-for-review.md

Task TASK-7.27 - Print the heads-up and full-ring charts for review
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 221000
Created: 2026-11-22 22:50 (UTC)
Labels: follow-up, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-87

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
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
Follow-up from TASK-7.6 (doc-87): npm run chart:print prints only the 6-max chart, but the Claude-authored heads-up and full-ring charts need the user's review.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given npm run chart:print with a size argument (heads-up, 6-max, full-ring), When it runs, Then it prints that chart's grid per spot with its justification

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

