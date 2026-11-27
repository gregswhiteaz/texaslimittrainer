File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-12.11 - Tell-me-when-a-Settings-change-could-not-be-saved.md

Task TASK-12.11 - Tell me when a Settings change could not be saved
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 248000
Created: 2026-11-25 17:01 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-12 - Tune the trainer
References: doc-142

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 17 total):
└─ TASK-12.2 - Hide opponent style labels at the table [completed]
   ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │  │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │  │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │  │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │  │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │  │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │  │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   └─ TASK-12.1 - Open Settings from Home and see the app version [completed]
      └─ TASK-2.1 - Start a game from Home through Game Config [completed]
         └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-12.2 (doc-142). A failed settings save is only logged (console.error 'Settings could not be saved'); the screen keeps the new value until the app closes, so the user can believe a change was saved when it was not.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a settings save that fails, When the user changes a setting, Then Settings shows a short visible message that the change was not saved (approved wording) and the stored record is unchanged

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

