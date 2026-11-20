File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.22 - Close-engine-test-gaps-found-in-review.md

Task TASK-1.22 - Close engine test gaps found in review
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 167000
Created: 2026-11-18 07:03 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-7, doc-10

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 5 total):
└─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from the TASK-1.2 judge (J-1-01) and TASK-1.4 code review: behaviours that are correct today but not pinned by a test.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given two seven-card hands that differ only in the third kicker, When compared, Then the hand with the higher third kicker wins (unit example)
- [ ] #2 Given a seat that folds after contributing chips, When pots are built, Then it is not eligible for any pot and its totalContribution is still counted in the pot amounts
- [ ] #3 Given stakes where the small blind equals the big blind, When createHand validates them, Then the boundary behaviour (accept or reject) is pinned by a test matching the documented rule

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

