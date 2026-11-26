File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-6.24 - Decide-TAG-aggression-headroom-against-its-65-band-ceiling.md

Task TASK-6.24 - Decide TAG aggression headroom against its 65% band ceiling
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 226000
Created: 2026-11-23 15:21 (UTC)
Labels: dream-limit-holdem-trainer, follow-up, spike
Milestone: m-1
Parent: TASK-6 - Face distinct opponents

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 19 total):
└─ TASK-6.11 - Report each bot style's VPIP, PFR and aggression against its band [completed]
   ├─ TASK-6.6 - Seat bots by line-up preset with unique names [completed]
   │  ├─ TASK-6.3 - Face a Calling station that calls where TAG would fold or raise [completed]
   │  │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed]
   │  │     └─ TASK-6.18 - Draw bot randomness only from the replay code and seat [completed]
   │  │        └─ TASK-6.1 - Face TAG bots that act from the advice engine [completed]
   │  │           ├─ TASK-1.6 - Run seeded bot-only hands from the command line [completed]
   │  │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │  │           │     └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │  │           │        ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │  │           │        │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │  │           │        │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │  │           │        └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │  │           │           └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   │  │           ├─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │  │           │  └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed] (shown above)
   │  │           └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │  │              ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  │              │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │  │              └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed] (shown above)
   │  ├─ TASK-6.4 - Face a Maniac that bets and raises where TAG would check or call [completed]
   │  │  └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   │  └─ TASK-6.5 - Face a Rock that folds every hand outside a narrow starting range [completed]
   │     └─ TASK-6.2 - Vary TAG's play in mixed spots from its style data file [completed] (shown above)
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Description:
--------------------------------------------------
From TASK-6.11 (and TASK-6.16/6.17/7.9 judge notes): TAG aggression measures 63.5–64.2% over 100k hands against the REQ-027.1 band 45–65%, and short --check-styles runs (2k hands) read 67.2% and fail with no tuning problem. A later advice change could push the 100k value out. Options: widen the band (requirements change), tune TAG postflop (e.g. a small value bar like the Rock's), or document a minimum run length for --check-styles.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the options (widen band / tune TAG / document minimum run length), When the user decides, Then the decision is recorded on this task and any resulting change is a follow-up story

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

