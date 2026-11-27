File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-10.18 - Keep-the-engines-bet-voiding-rule-in-one-place-liveLevels-and-voidedBets.md

Task TASK-10.18 - Keep the engine's bet-voiding rule in one place (liveLevels and voidedBets)
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 271000
Created: 2026-11-27 09:11 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-10 - Read the session report
References: doc-184

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 35 total):
└─ TASK-10.17 - Ignore a forced-fold-voided raise when classifying the preflop situation, and tidy the forced-fold code [completed]
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
From TASK-10.17 (doc-184, review r1 MINOR). voidedBets (src/engine/hand.ts) copies liveLevels' forced-fold voiding walk; nothing keeps the two in step, so a later rule change could make bots/advice disagree with the engine's amount to match.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given src/engine/hand.ts, When liveLevels and voidedBets are refactored to share one voiding walk (or a property test over random forced-fold hands asserts they agree), Then a change to the rule in one place cannot silently diverge, all engine/advice tests pass, and the 10,000-hand seeded playtest stays byte-identical

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

