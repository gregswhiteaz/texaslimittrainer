File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.26 - Author-heads-up-and-full-ring-default-opponent-ranges.md

Task TASK-7.26 - Author heads-up and full-ring default opponent ranges
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 220000
Created: 2026-11-22 22:50 (UTC)
Labels: follow-up, feature, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-87

Dependency Graph:
--------------------------------------------------
Depends on (2 direct, 11 total):
├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
│  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
│     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
│     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
│     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
│     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
│     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
│        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
│           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
│              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
│              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
│                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
└─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
   └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.6 Q-3 (doc-87). TASK-7.5 authored 36 6-max default opponent ranges; at other table sizes postflop advice still assumes every unseen combo for each opponent (TASK-7.5 A-3). Needs original heads-up and full-ring ranges (REQ-061) keyed by position and preflop line, with justifications and width bands, and the range validator extended.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the range data, When the validator runs, Then every applicable (heads-up or full-ring position, preflop line) has a range and a plain-English justification, and a missing one fails validation
- [ ] #2 Given a heads-up or full-ring postflop view, When the user's advice is computed, Then each opponent's start range is the authored range for that size, position and line (not every unseen combo), narrowed by TASK-7.5's rule
- [ ] #3 Given the authored ranges, When their widths are measured, Then each lies inside its documented band

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

