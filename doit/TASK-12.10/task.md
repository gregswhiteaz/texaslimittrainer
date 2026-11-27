File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-12.10 - Harden-the-settings-upgrade-and-back-control-focus-order.md

Task TASK-12.10 - Harden the settings upgrade and back-control focus order
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 247000
Created: 2026-11-25 15:55 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-12 - Tune the trainer
References: doc-141

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 15 total):
└─ TASK-12.1 - Open Settings from Home and see the app version [completed]
   └─ TASK-2.1 - Start a game from Home through Game Config [completed]
      └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
         ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
         │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
         ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
         │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
         └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
            ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
            │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
            ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
            │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
            └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
               ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
               │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
               └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-12.1 review and judge (doc-141). The v3->v4 upgrade unit test checks defaults only via readSettings(), which returns defaults even when no record exists; there is no onblocked handler, so a tab holding the old DB leaves store calls pending; in Chromium the first Tab from the Settings/Statistics heading leaves the page because the back control precedes the h1.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a v3 database upgraded to v4, When the raw 'settings' record is read, Then a unit test asserts it equals the defaults
- [ ] #2 Given another tab holds the old database version open, When the app upgrades, Then the blocked upgrade is handled (the user sees a clear message or the other connection closes on versionchange) instead of hanging
- [ ] #3 Given Settings or Statistics opened with the heading focused, When the user presses Tab once, Then focus reaches the back control without leaving the page

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

