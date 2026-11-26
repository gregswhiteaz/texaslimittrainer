File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-8.5 - Label-positions-and-situations-in-plain-English-for-hints.md

Task TASK-8.5 - Label positions and situations in plain English for hints
==================================================

Status: ○ To Do
Priority: Medium
Type: feature
Ordinal: 178000
Created: 2026-11-18 16:24 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-8 - Ask for a hint
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
Follow-up from TASK-7.2: the advice API returns ids (CO, raise-and-calls); REQ-042.6 hint text needs readable labels.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given each position id (UTG, HJ, CO, BTN, SB, BB) and situation id, When a label is requested, Then it returns the approved English label (e.g. 'the cutoff', 'facing a raise and calls')

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

