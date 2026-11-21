File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.18 - Pin-Home-focus-user-seat-cards-and-config-driven-stacks-in-tests.md

Task TASK-2.18 - Pin Home focus, user-seat cards and config-driven stacks in tests
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 185000
Created: 2026-11-18 23:20 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-2 - Launch and set up a session
References: doc-23

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 14 total):
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
Follow-up from TASK-2.1 (doc-23) code review: three behaviours are correct today but no test fails if they regress — focus is left alone on first load of Home; the Table shows the user's cards at the configured userSeat (a hard-coded seat 5 mutant survives); stacks come from config.seats rather than DEFAULT_SEATS.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the app's first load, When Home renders, Then focus is not moved to its heading, and a test fails if it is
- [ ] #2 Given a SessionConfig whose userSeat is not 5, When the Table renders, Then the user's face-up cards appear at that seat, and a test fails if seat 5 is hard-coded
- [ ] #3 Given a SessionConfig whose seats differ from DEFAULT_SEATS in seat numbers, When the table is seated, Then stacks are keyed by config.seats, and a test fails if DEFAULT_SEATS is used

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

