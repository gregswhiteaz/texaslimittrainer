File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.17 - Ignore-a-forced-fold-voided-raise-when-classifying-the-preflop-situation-and-tidy-the-forced-fold-code.md

Task TASK-10.17 - Ignore a forced-fold-voided raise when classifying the preflop situation, and tidy the forced-fold code
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 269000
Created: 2026-11-27 05:16 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-10 - Read the session report
References: doc-178

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 34 total):
└─ TASK-10.13 - Decide how a forced fold of the top bettor is settled (dead money vs refund) [completed]
   └─ TASK-10.2 - Leave the table in the middle of a hand [completed]
      └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
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
         ├─ TASK-3.9 - Keep a permanent record of every completed hand [completed]
         │  ├─ TASK-1.15 - Show and muck cards at showdown in casino order [completed]
         │  │  ├─ TASK-1.8 - Check game invariants after every playtest action [completed]
         │  │  │  ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed] (shown above)
         │  │  │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
         │  │  └─ TASK-1.10 - Split the pot into side pots for unequal all-ins [completed]
         │  │     └─ TASK-1.9 - Let a short-stacked player call all-in [completed]
         │  │        └─ TASK-1.8 - Check game invariants after every playtest action [completed] (shown above)
         │  ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed]
         │  │  └─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed] (shown above)
         │  ├─ TASK-6.7 - Record an edited line-up as Custom [completed]
         │  │  └─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
         │  │     ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
         │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
         │  │     │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
         │  │     │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed] (shown above)
         │  │     ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
         │  │     │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
         │  │     └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
         │  │        └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
         │  ├─ TASK-6.8 - Replace a busted bot with a new bot from the line-up preset [completed]
         │  │  └─ TASK-6.7 - Record an edited line-up as Custom [completed] (shown above)
         │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
         │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
         ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
         │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
         └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
            ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
            └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Description:
--------------------------------------------------
From TASK-10.13 (doc-178). After a forced fold voids the leaver's raise (dead money), the engine's amount to match drops, but situationOf (src/advice/preflop.ts:104-118) still counts the voided raise, so bots and advice look up the facing-a-raise chart cell for a pot that is effectively unraised (A-2). Also bundles review r1 tidy-ups: the redundant toAct ternary at src/engine/hand.ts:791 and recomputing sole per winner at src/engine/invariants.ts:292.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the user raises preflop and is force-folded so their raise is voided, When the next bot or the advice classifies the preflop situation, Then it is classified as if the voided raise had not been made (e.g. unopened or facing limpers), and a test pins one such case
- [ ] #2 Given hands with no voided raise, When situationOf runs, Then its result is unchanged (seeded playtest output byte-identical)
- [ ] #3 Given src/engine/hand.ts forceFold and src/engine/invariants.ts, When the tidy-ups are applied (clockwiseAfter(open, toAct - 1) with a comment; sole computed once), Then all engine tests and the 10,000-hand playtest stay green and byte-identical

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

