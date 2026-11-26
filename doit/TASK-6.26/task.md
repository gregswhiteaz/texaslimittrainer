File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.26 - Tidy-after-same-style-bot-replacement-dead-Replay-option-stale-comments-style-justifications.md

Task TASK-6.26 - Tidy after same-style bot replacement (dead Replay option, stale comments, style justifications)
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 241000
Created: 2026-11-25 05:57 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-6 - Face distinct opponents
References: doc-130

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 38 total):
└─ TASK-6.25 - Keep every bot style inside its band in the Mixed line-up now that bots read opponents' actions [completed]
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
Follow-up from TASK-6.25 review and judge (doc-130). Since replacements keep their style, src/playtest/cli.ts replacedStylesOption can no longer print anything in a real run; runner.ts PlaytestOptions.lineUp comment still says a replacement is drawn from the preset; rock.json CO raise justification omits the added AJo (offsuit); maniac.json fold-to-call justification ends with an unclear clause; tests/bots/replacement.acceptance.test.ts tally() still loops 10,000 replay codes though style no longer depends on the code.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a playtest run, When its Replay line is built, Then no dead replaced-styles branch remains in src/playtest/cli.ts and its cli test is updated without removing a check of live behaviour
- [ ] #2 Given runner.ts and the Rock and Maniac style files, When read, Then the lineUp comment says replacements keep their style, the Rock CO raise justification names AJo, and the Maniac fold-to-call justification is one clear sentence
- [ ] #3 Given tests/bots/replacement.acceptance.test.ts, When it runs, Then the same-style checks hold over a small fixed set of codes with the same check count

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

