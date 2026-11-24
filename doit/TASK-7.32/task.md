File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.32 - Investigate-why-advised-play-almost-never-folds-after-the-flop-WTSD-~94.md

Task TASK-7.32 - Investigate why advised play almost never folds after the flop (WTSD ~94%)
==================================================

Status: ○ To Do
Priority: High
Ordinal: 237000
Created: 2026-11-24 20:47 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 36 total):
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
Found while specifying TASK-10.3: in 100,000-hand 6-max playtests (seeds 42 and 7) the all-TAG line-up shows WTSD 94.4%/94.3% (VPIP 22.2, PFR 16.2, Aggression 63, W$SD 50). TAG bots fold after the flop in only ~3.4% of flops seen (98 folds in 2,855 seat-hands), and every bot style in the Mixed line-up sits at 92-96% WTSD. Healthy limit play folds far more postflop (realistic WTSD roughly 30-42% at 6-max). Bots and the user's hints share the postflop advice, so the trainer may be teaching over-calling. Find the cause (pot-odds thresholds, range model, equity vs opponent ranges, bot style policies) and fix it, then re-run TASK-10.3's WTSD check.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the 6-max all-TAG playtest, When the cause of the ~94% WTSD is investigated, Then the root cause is written up with evidence (which rules/thresholds produce the calls) and the fix approach is recorded
- [ ] #2 Given the fix, When a 100,000-hand 6-max all-TAG playtest runs (opt-in slow group), Then WTSD falls inside the authored 6-max healthy WTSD range from TASK-10.3 and VPIP, PFR, Aggression and W$SD stay inside theirs
- [ ] #3 Given the fix, When the golden-spot suites run, Then they pass (re-pinning any spot only with a recorded justification)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

