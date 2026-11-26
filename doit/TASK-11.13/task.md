File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-11.13 - Strengthen-Statistics-trend-tests-ordering-fallback-speed-wait.md

Task TASK-11.13 - Strengthen Statistics trend tests (ordering, fallback, speed wait)
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 244000
Created: 2026-11-25 08:57 (UTC)
Updated: 2026-11-25 13:37 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-11 - Track progress over time
References: doc-134

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 45 total):
└─ TASK-11.1 - See my Major errors per 100 hands trend on the Statistics screen [completed]
   ├─ TASK-2.1 - Start a game from Home through Game Config [completed]
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
   ├─ TASK-10.2 - Leave the table in the middle of a hand [completed]
   │  └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
   │     ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
   │     ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   │     ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
   │     │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
   │     └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
   │        ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
   │        └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)
   └─ TASK-10.4 - See my hands played and error rates per 100 hands in the report [completed]
      ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed] (shown above)
      └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-11.1 code review (doc-134). The AC#2 view test feeds hands already in session order; trends.test.ts cannot tell the earliest-completedAt fallback from latest; tests/support/stat-records.ts exports unused TEMPLATE_DECISIONS; the opt-in speed check stops its timer on DOM presence, not visibility. Only the judge's holdout covered the first two.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given hands supplied in shuffled order across sessions whose start order differs from id order, When the trend view is computed, Then points and totals equal the sorted-order result
- [ ] #2 Given a session with no record whose earliest and latest hand times straddle another session's start, When hands are ordered, Then it orders by its earliest completedAt
- [ ] #3 Given the test support and the opt-in speed check, When read, Then TEMPLATE_DECISIONS is gone and the timer stops when the 6th point is visible
- [ ] #4 Given 1,000+ stored hands and any Table size / Game type filter, When the App renders Statistics, Then a repo test proves the G-2 target is computed from all stored hands (App passes all hands to statisticsView)
- [ ] #5 Given a filter select value that is not a known option id, When it changes, Then it is treated as All; and the unreachable data===undefined guard in App.tsx is removed
- [ ] #6 Given the Vitest day-grouping tests, When they run on a UTC machine (CI), Then they run in a pinned non-UTC time zone so a UTC-date day key fails npm test

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
ACs added from TASK-11.4 follow-ups (doc-137).

AC added from TASK-11.5 follow-up (doc-138).

