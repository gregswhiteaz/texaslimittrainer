File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.45 - Decide-position-aware-scaling-for-observed-open-raise-and-calling-ranges.md

Task TASK-7.45 - Decide position-aware scaling for observed open-raise and calling ranges
==================================================

Status: ○ To Do
Priority: Medium
Type: enhancement
Ordinal: 268000
Created: 2026-11-27 03:28 (UTC)
Labels: dream-limit-holdem-trainer, follow-up, spike
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doit/TASK-7.29/spec.md, dreams/limit-holdem-trainer/requirements.md
Documentation: doc-104

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 15 total):
└─ TASK-7.44 - Scale observed three-bet and four-bet ranges by PFR relative to a typical player [completed]
   └─ TASK-7.43 - Resize the authored opponent range and rank hands by three-way equity when scaling observed opponents [completed]
      └─ TASK-7.29 - Decide the hand order and re-raise scaling for observed-opponent ranges [completed]
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
Follow-up spike from TASK-7.29 (decision: Q-4 a). Open-raise lines scale toward raw PFR and calling lines toward raw VPIP, which ignores position. For an ordinary 22/18 player at 100 hands the 6-max BTN open goes 34.54% to 18%, BB call-raise 41.48% to 22% and SB limp 44.65% to 22%. Reusing the TASK-7.29 ratio rule for calling lines would push loose players to 100% (BB call-raise at 60/45). Lay out options with measured numbers (e.g. ratio with a cap, ratio for open-raise only, keep) and record the user's decision. Evidence: doit/TASK-7.29/spec.md §3 and the Q-4 options.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the options with measured widths for typical, loose and tight players at each table size, When the user decides, Then the decision is recorded and any change becomes a follow-up story with re-pinned expectations

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

