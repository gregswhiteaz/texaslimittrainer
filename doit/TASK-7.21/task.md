File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.21 - Decide-whether-to-split-preflop-spots-by-raiser-position-and-re-raise-type.md

Task TASK-7.21 - Decide whether to split preflop spots by raiser position and re-raise type
==================================================

Status: ○ To Do
Priority: Medium
Type: spike
Ordinal: 177000
Created: 2026-11-18 16:24 (UTC)
Updated: 2026-11-19 03:52 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doc-14, dreams/limit-holdem-trainer/requirements.md

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 7 total):
└─ TASK-7.2 - Recommend a preflop action from the 6-max chart [completed]
   └─ TASK-1.5 - Give each deciding seat only its own view of the hand [completed]
      └─ TASK-1.4 - Play a complete fixed-limit hand from blinds to showdown [completed]
         ├─ TASK-1.2 - Rank showdown hands by real poker hand rankings [completed]
         │  └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed]
         │     └─ TASK-1.1 - Bootstrap the strict TypeScript project with one-command checks [completed]
         └─ TASK-1.3 - Deal every hand from a seeded shuffle with a replay code [completed]
            └─ TASK-1.7 - Run every check in GitHub Actions on each push and pull request [completed] (shown above)

Description:
--------------------------------------------------
Follow-up from TASK-7.2 Q-4. REQ-032.2 fixes 26 spots, so blind defence and facing-a-raise ignore who raised (BB defends the same vs UTG as vs a BTN steal), and facing-a-re-raise lumps 'my open was 3-bet' with 'cold 3-bet'. A real strategy weakness the user chose to ship and revisit.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given options (split by raiser position, split re-raise by open-vs-cold, keep 26 spots), When the user decides, Then the decision is recorded as a Backlog decision and REQ-032.2 and the chart format are updated if needed
- [ ] #2 Given re-raise spots are split into 'my open was 3-bet' and 'cold 3-bet', When the CO cold-3-bet spot is authored, Then CO A9o/A8o are reconsidered (TASK-7.19 folds them only because TASK-9.1's locked review test pins CO A9o as Fold) and that test is updated if the advice changes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
Evidence from TASK-7.19 (user Q-1/Q-3, 2026-11-19): re-raise spots now continue with 80-90% of each opener's range, which suits 'my open was 3-bet' but makes cold 3-bet routes loose. For example, CO facing a UTG open and an HJ 3-bet continues ~22% of hands from an uninvested seat. Splitting the spot would fix this.

AC added from TASK-7.19 follow-up (doc-28).

