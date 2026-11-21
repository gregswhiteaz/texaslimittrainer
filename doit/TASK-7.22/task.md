File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.22 - Pin-postflop-advice-rounding-and-reach-the-river-in-its-property-test.md

Task TASK-7.22 - Pin postflop advice rounding and reach the river in its property test
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 181000
Created: 2026-11-18 19:10 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-7 - Get trustworthy advice
References: doc-17

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
└─ TASK-7.3 - Recommend call or fold after the flop from equity and pot odds [completed]
   ├─ TASK-7.1 - Compute a hand's equity against opponent hands [completed]
   │  └─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
   │     └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
   │        └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
   └─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
      └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
         └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
            ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed] (shown above)
            └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
               └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.3 (doc-17) code review and judge (J-1-01, J-1-02): the +1e-9 nudge in toPct changes no observed output and no test pins it; the AC#3 hidden-card property only ever stops on the flop or turn with 6 live players, so its fc.pre discard path never runs. River spots are covered elsewhere, but the property should cover them too.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given toPct, When the nudge is either pinned by a case such as 0.5005 -> 50.1 or removed, Then a test fails if the chosen behaviour changes
- [ ] #2 Given the AC#3 property, When it runs, Then it reaches flop, turn and river decisions (stop point up to 23) with some non-hero seats folding, and its discard path is exercised

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

