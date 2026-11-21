File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-1.44 - Pin-what-a-fold-out-leaves-in-currentBet-and-betCount.md

Task TASK-1.44 - Pin what a fold-out leaves in currentBet and betCount
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 205000
Created: 2026-11-20 04:07 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-1 - Prove the game headlessly
References: doc-39

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 6 total):
└─ TASK-1.22 - Close engine test gaps found in review [completed]
   └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-1.4 code review NIT fold-out-resets-bet-counters, still unowned after TASK-1.22 (doc-39): foldOut (src/engine/hand.ts ~320-321) zeroes the street's currentBet and betCount when a hand ends by fold-out. Either keep them or document the reset; either way pin it.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a hand that ends because all but one player folded mid-street, When the final state is read, Then currentBet and betCount follow one documented rule (kept or reset) and a test pins it
- [ ] #2 Given that rule, When the code comment on foldOut is read, Then it states the rule and why

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

