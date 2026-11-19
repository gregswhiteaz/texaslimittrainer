File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.19 - Review-and-revise-the-6-max-preflop-chart-with-the-user.md

Task TASK-7.19 - Review and revise the 6-max preflop chart with the user
==================================================

Status: ○ To Do
Priority: High
Type: enhancement
Ordinal: 175000
Created: 2026-11-18 16:24 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-7 - Get trustworthy advice
References: doc-14, src/advice/charts/six-max.json

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
Follow-up from TASK-7.2 (doc-14). The chart was authored by Claude (Q-1) and the user has not reviewed it yet. The judge (J-1-01..03) and code review found content issues: re-raise spots fold much of the hero's own opening range to one 3-bet at ~6.5:1 (UTG opens 16.0% but continues 9.7%) while the UTG/HJ texts say opened hands usually call; some justifications describe only one route into the spot; K9o is a borderline call in BB defence while weaker Q9o/J9o/T8o are firm calls; HJ raise-and-calls text says 'usually close' and 'suited aces' too broadly.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given npm run chart:print, When it runs, Then it prints every spot as a 13x13 grid with its raise and continue percentages
- [ ] #2 Given the facing-a-re-raise spots for UTG, HJ, CO and BTN, When the chart is revised, Then each continues with a share of its own unopened range that the user approves, and each justification agrees with its grid
- [ ] #3 Given every spot's justification, When reviewed against the routes into that spot (e.g. SB blind defence after an SB complete and BB raise; HJ facing a raise after limping), Then it is accurate for every route
- [ ] #4 Given BB blind defence, When the chart is revised, Then no offsuit hand is a firmer call than a strictly stronger hand of the same high card (K9o vs Q9o/J9o/T8o fixed)
- [ ] #5 Given the HJ raise-and-calls text, When revised, Then it says we close the action and names only the suited aces the grid calls with
- [ ] #6 Given the revised chart, When npm test runs, Then every spot is still inside its spec band and the user has signed off the chart in the task notes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

