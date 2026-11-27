File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.29 - Decide-the-hand-order-and-re-raise-scaling-for-observed-opponent-ranges.md

Task TASK-7.29 - Decide the hand order and re-raise scaling for observed-opponent ranges
==================================================

Status: ○ To Do
Priority: Medium
Ordinal: 228000
Created: 2026-11-23 16:31 (UTC)
Labels: dream-limit-holdem-trainer, follow-up, spike
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 12 total):
└─ TASK-7.13 - Adjust opponent ranges to their observed play after 30 hands [completed]
   ├─ TASK-7.5 - Estimate each opponent's range from their actions in the hand [completed]
   │  └─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   │     ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │     │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │     │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   │     └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   │        └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
   │           └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
   │              ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
   │              └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
   │                 └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)
   └─ TASK-7.12 - Enabler: shared style-stat functions for VPIP, PFR, Aggression, WTSD and W$SD [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed] (shown above)

Description:
--------------------------------------------------
From TASK-7.13 review: the approved hand order (equity vs one random hand) ranks Q2o/J2o/K2o above suited connectors (76s/65s/87s), the opposite of how loose limit players choose hands; and scaling every raising line by PFR widens re-raise ranges a lot (a 22/18 player's UTG four-bet range goes 2.56% → 18% at 100 hands). Options: keep; switch to a playability-weighted order (e.g. equity vs a typical calling range, or an authored order); scale re-raise lines by a 3-bet stat instead of PFR.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the options, When the user decides, Then the decision is recorded here and any change becomes a follow-up story with re-pinned expectations

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

