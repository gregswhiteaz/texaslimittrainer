File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-2.19 - Fit-Game-Configs-opponent-rows-on-a-phone-screen.md

Task TASK-2.19 - Fit Game Config's opponent rows on a phone screen
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 222000
Created: 2026-11-23 02:46 (UTC)
Labels: follow-up, bug, dream-limit-holdem-trainer
Milestone: m-1
Parent: TASK-2 - Launch and set up a session
References: doc-91

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 27 total):
└─ TASK-2.8 - Change the style of one bot seat [completed]
   └─ TASK-2.5 - Choose a line-up preset for the bots [completed]
      ├─ TASK-2.2 - Choose how many players sit at the table [completed]
      │  ├─ TASK-1.11 - Play heads-up hands with heads-up blinds and order [completed]
      │  │  └─ TASK-1.8 - Check game invariants after every playtest action [completed]
      │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │  │     │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │  │     │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  │     │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │  │     │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │  │     │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │  │     │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
      │  │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
      │  │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │  │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
      │  │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
      │  │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      │  │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │  │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │  │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │  │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │  │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │  │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      │  └─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
      │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
      └─ TASK-6.7 - Record an edited line-up as Custom [completed]
         └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
            ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
            │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
            │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
            │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
            ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
            │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
            └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
               └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-2.9 judge (J-1-02, doc-91). Since TASK-2.8 added a Style select to each bot row, Game Config scrolls sideways at 320–375 px (scrollWidth 388).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given Game Config at 320 px and 375 px wide with 10 players, When it renders, Then the page does not scroll sideways and every bot row's name, seat and Style select are fully visible and usable

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

