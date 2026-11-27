File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-8.7 - Decide-whether-hints-and-reviews-show-the-situation-label.md

Task TASK-8.7 - Decide whether hints and reviews show the situation label
==================================================

Status: ○ To Do
Priority: Low
Ordinal: 256000
Created: 2026-11-26 07:04 (UTC)
Labels: dream-limit-holdem-trainer, follow-up, spike
Milestone: m-1
Parent: TASK-8 - Ask for a hint
References: doc-155

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 8 total):
└─ TASK-8.5 - Label positions and situations in plain English for hints [completed]
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
Follow-up from TASK-8.5 (doc-155). situationLabel() now returns approved labels (e.g. 'facing a raise and calls') but, per TASK-8.5 Q-2, nothing on screen shows them. The hint card's chart basis line could read e.g. 'From the 6-max chart: call A9o from the cutoff, facing a raise and calls'. Doing so edits TASK-8.1's locked hint/review tests and e2e specs (~8 files).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given the choice to show or not show the situation label on the hint card and review entries, When the user decides, Then the decision is recorded on this task (and, if yes, a build task with Given/When/Then ACs is created)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

