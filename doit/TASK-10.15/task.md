File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.15 - Simplify-preflop-leak-pairing-in-src-stats-leaks.ts.md

Task TASK-10.15 - Simplify preflop leak pairing in src/stats/leaks.ts
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 242000
Created: 2026-11-25 06:45 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-10 - Read the session report
References: doc-131

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 43 total):
└─ TASK-10.6 - See my preflop leaks by position group [completed]
   └─ TASK-10.5 - See my postflop leaks with evidence and a one-sentence fix [completed]
      ├─ TASK-3.12 - Record the advice and grade for each of my decisions with the hand [completed]
      │  ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
      │  │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
      │  │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
      │  │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
      │  │  │  │  │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │  │  │  │  │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │  │  │  │  │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │  │  │  │  │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │  │  │  │  │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │  │  │  │  │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │  │  │  │  │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      │  │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
      │  │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
      │  │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
      │  │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
      │  │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
      │  │  │     ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
      │  │  │     │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │  │  │     │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
      │  │  │     │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
      │  │  │     │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
      │  │  │     │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
      │  │  │     │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │  │  │     │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
      │  │  │     │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │  │  │     │        ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │  │  │     │        │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │  │  │     │        └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
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
      └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
         ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
         ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
         ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
         │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
         └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
            ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
            └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-10.6 code review (doc-131). handCategoryDecisions recomputes the dealt-in seat list and the user's position group for every paired preflop decision though they are fixed per hand, and its user-non-blind-action check duplicates userMade in src/table/hand-record.ts.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a hand with several user preflop decisions, When handCategoryDecisions runs, Then the seat list and user position group are computed once per hand and every existing leak test still passes unchanged
- [ ] #2 Given the user's non-blind action filter, When leaks.ts pairs decisions, Then it reuses the hand-record helper instead of a copy, with the same results

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

