File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-3.24 - Decide-whether-the-user-gets-a-Show-Muck-choice-at-showdown.md

Task TASK-3.24 - Decide whether the user gets a Show/Muck choice at showdown
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 210000
Created: 2026-11-21 08:35 (UTC)
Labels: follow-up, spike, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-3 - Play hands at the table
References: doc-62

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 11 total):
└─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
      └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
         └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)

Description:
--------------------------------------------------
Spike from TASK-1.15 (doc-62). TASK-1.15 Q-1 was auto-accepted in autopilot: the user's hand follows the same automatic show/muck rule as the bots (shown if it beats or ties the best hand shown so far, otherwise mucked). Casinos let a player choose to show a losing hand or muck a winning-but-uncalled one; whether the trainer should offer that choice is a product decision for the user.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 The user decides between keeping automatic show/muck for their own hand and adding a Show/Muck prompt, and the decision is recorded in this task's notes (and, if a prompt is chosen, a story is created for it)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

