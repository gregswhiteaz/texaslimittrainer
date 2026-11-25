File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.25 - Keep-every-bot-style-inside-its-band-in-the-Mixed-line-up-now-that-bots-read-opponents-actions.md

Task TASK-6.25 - Keep every bot style inside its band in the Mixed line-up now that bots read opponents' actions
==================================================

Status: ○ To Do
Priority: High
Ordinal: 239000
Created: 2026-11-25 00:07 (UTC)
Updated: 2026-11-25 00:55 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 37 total):
└─ TASK-7.32 - Investigate why advised play almost never folds after the flop (WTSD ~94%) [completed]
   └─ TASK-10.3 - See my five style stats against healthy ranges for my table size [completed]
      ├─ TASK-6.17 - Keep Calling station and Maniac bots inside their style bands [completed]
      │  └─ TASK-7.8 - Recommend betting or raising for value [completed]
      │     └─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
      │        └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
      │           ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
      │           │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
      │           │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
      │           │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
      │           └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      │              └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      │                 └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
      │                    ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
      │                    └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
      │                       └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
      ├─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      │  └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)
      └─ TASK-10.1 - End the session with Leave table and see its saved report with my cash result [completed]
         ├─ TASK-3.3 - See every seat, the board, the pot and the button at a glance [completed]
         │  ├─ TASK-3.1 - Play a complete hand against TAG bots at a default 6-max table in the browser [completed]
         │  │  ├─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │  │  ├─ TASK-3.5 - Read big-index cards drawn in code [completed]
         │  │  │  └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed] (shown above)
         │  │  └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
         │  │     ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
         │  │     │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
         │  │     ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
         │  │     └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed] (shown above)
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
         │  └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed] (shown above)
         ├─ TASK-3.10 - Save the session after every hand so it can be resumed [completed]
         │  └─ TASK-3.9 - Keep a permanent record of every completed hand [completed] (shown above)
         └─ TASK-3.11 - Rebuy or leave when my stack runs out [completed]
            ├─ TASK-3.4 - See who won each hand and get the next hand dealt automatically [completed] (shown above)
            └─ TASK-3.10 - Save the session after every hand so it can be resumed [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.32 (user Q-2). Once bots use action-based ranges and fold to bets, Maniacs stop busting and take over replaced seats in the Mixed line-up, pushing other styles out of their REQ-027 bands (seed 42, 10k hands: TAG PFR 12.0 / Aggression 34.8; Rock VPIP 7.6 / Aggression 31.8). Until this lands, the opt-in slow tests/bots/style-bands.acceptance.test.ts and the manual style-bands.yml workflow are expected to fail.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the Mixed line-up with bots on action ranges, When the opt-in style-bands check runs (TLH_SLOW_TESTS=1), Then every style's VPIP, PFR and Aggression fall inside their REQ-027 bands
- [ ] #2 Given the fix, When the manual style-bands.yml workflow is dispatched, Then it passes
- [ ] #3 Given the Mixed line-up with bots on action ranges, When tests/playtest/check-styles.acceptance.test.ts's slow 100,000-hand Mixed check runs (seeds 42, 7, 1234), Then it passes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.32 build: check-styles slow Mixed check also fails until this lands (TAG PFR 10.3 / Agg 31.3, Rock VPIP 6.7 at seed 42).

