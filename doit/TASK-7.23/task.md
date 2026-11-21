File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.23 - Harden-the-decision-graders-inputs-and-edge-case-tests.md

Task TASK-7.23 - Harden the decision grader's inputs and edge-case tests
==================================================

Status: ○ To Do
Priority: Low
Type: chore
Ordinal: 183000
Created: 2026-11-18 20:12 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-0
Parent: TASK-7 - Get trustworthy advice
References: doc-19

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 10 total):
└─ TASK-7.4 - Grade a decision as Correct, Minor error or Major error [completed]
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
Follow-up from TASK-7.4 (doc-19) reviews. gradeDecision accepts a hand-built recommendation with non-finite equity and grades it Minor with a NaN margin, which would serialise as null in a hand record. A wrong-way margin is only tested at -5, so a Math.abs mutant survives. One test name claims a float trap (26.7-16.7) that is exact in floating point.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a recommendation whose equity or required-equity percentage used by the deciding rule is NaN, Infinity or missing, When gradeDecision runs, Then it throws RangeError and a unit test covers it
- [ ] #2 Given a wrong-way margin of -15 points, When graded, Then the result is Minor with marginPts -15
- [ ] #3 Given the float-subtraction boundary test, When read, Then its cases and name only claim float traps that are real (e.g. 16.4-6.4)

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

