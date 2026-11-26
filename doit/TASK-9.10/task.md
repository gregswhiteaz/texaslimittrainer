File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-9.10 - Handle-a-failed-decision-grade-cleanly-and-test-the-pending-grades-state.md

Task TASK-9.10 - Handle a failed decision grade cleanly and test the pending-grades state
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 234000
Created: 2026-11-24 13:09 (UTC)
Updated: 2026-11-25 17:55 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-9 - Review the hand just played
References: doc-117

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 41 total):
└─ TASK-9.3 - See the numbers and reason behind each reviewed decision [completed]
   ├─ TASK-3.6 - Keep the table responsive while bots and advice compute [completed]
   │  └─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
   │     ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │     │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │     │     ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │     │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │     │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     │     └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │     │        └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │     ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
   │     │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
   │     └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │        ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │        ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │        │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
   │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
   │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
   │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
   │  │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │  │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
   │  │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
   │  │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
   │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
   │  │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
   │  │  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed] (shown above)
   │  │  │     └─ TASK-3.5 - Read big-index cards drawn in code [completed] (shown above)
   │  │  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
   │  │  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   │  │  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │  │  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │  │  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
   │  │  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  │  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
   │  │  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
   │  │  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
   │  │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
   │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
   │  ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed]
   │  │  ├─ TASK-7.6 - Recommend preflop actions at heads-up and full-ring tables [completed]
   │  │  │  └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  │  ├─ TASK-7.8 - Recommend betting or raising for value [completed]
   │  │  │  └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   │  │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   │  │  └─ TASK-7.9 - Count implied odds for drawing hands [completed]
   │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   │  └─ TASK-7.15 - Prove advice is identical for identical decisions [completed]
   │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
   │     ├─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
   │     │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
   │     ├─ TASK-7.10 - Explain every recommendation in plain English with its numbers [completed] (shown above)
   │     └─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
   │        ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed] (shown above)
   │        └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)
   └─ TASK-9.1 - Review each decision of the hand I just played [completed]
      ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
      └─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-9.3 (doc-117). If the advice worker's grade request for a decision fails mid-hand, nothing handles the rejection until the hand ends (or ever, if it never ends), so the browser reports an unhandled rejection on top of the intended 'Hand record could not be saved' log (code review MINOR, judge J-1-02). Also no test covers A-2: while a hand's grades are pending, the review panel is hidden but Deal next hand shows (code review MINOR).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the worker rejects a decision's grade request mid-hand, When the page runs, Then no unhandledrejection event fires, the hand end still logs 'Hand record could not be saved', and no review panel opens (Chromium and WebKit)
- [ ] #2 Given a finished hand whose grades are still pending, When the Table renders, Then no review panel (<aside>) is shown and the Deal next hand button is present
- [ ] #3 Given a decision grade that fails mid-hand, When it rejects, Then the outcome is handled deliberately (not an unhandled rejection) and docs/ui/navigation.md states what the user sees

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-13.1 follow-up (doc-143): since TASK-13.1, an unhandled pending-grade rejection mid-hand shows the app error screen instead of stalling at the hand write.

