File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.32 - Tighten-the-remaining-engine-input-guards.md

Task TASK-1.32 - Tighten the remaining engine input guards
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 192000
Created: 2026-11-19 04:25 (UTC)
Updated: 2026-11-19 23:33 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-29

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-1.21 - Harden engine input validation found in review [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.21 (doc-29) spec and reviews: a few engine entry points still throw native TypeErrors or echo input of any length. Nothing untrusted reaches them today, but saved sessions and replay-code input will.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given parseCards or evaluate receives a non-array or non-string input, When called, Then it throws RangeError with a message that echoes no input
- [ ] #2 Given createHand receives a null config or non-array seats, When called, Then it throws RangeError('Invalid hand config') instead of TypeError
- [ ] #3 Given an invalid seat, button or replay code longer than 10 characters, When the error is built, Then 'Invalid seat', 'Button must be a dealt-in seat' and 'Invalid replay code' echo at most 10 characters plus '...', and TASK-1.3's locked messages for short inputs stay byte-identical

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
From TASK-1.31 security review (doc-35): restored sessions (TASK-3.10) are the real source of a non-array seats / null config reaching createHand; AC#2 here owns the RangeError('Invalid hand config') guard.

