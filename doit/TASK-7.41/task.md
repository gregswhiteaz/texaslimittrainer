File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.41 - Split-the-full-ring-re-raise-spots-into-own-raise-re-raised-and-re-raised-when-I-had-not-raised.md

Task TASK-7.41 - Split the full-ring re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised
==================================================

Status: ○ To Do
Priority: Medium
Type: enhancement
Ordinal: 264000
Created: 2026-11-26 23:45 (UTC)
Updated: 2026-11-27 23:56 (UTC)
Labels: dream-limit-holdem-trainer, follow-up
Milestone: m-1
Parent: TASK-7 - Get trustworthy advice
References: doit/TASK-7.21/spec.md, dreams/limit-holdem-trainer/requirements.md
Documentation: doc-28

Dependency Graph:
--------------------------------------------------
Depends on (1 direct, 9 total):
└─ TASK-7.40 - Split the 6-max re-raise spots into own-raise-re-raised and re-raised-when-I-had-not-raised [completed]
   └─ TASK-7.21 - Decide whether to split preflop spots by raiser position and re-raise type [completed]
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
Follow-up from TASK-7.21 (decision: Q-1 split re-raise), after the 6-max split. Apply the same A-2 rule and the situation names, labels and context sentences from the 6-max story to the full-ring chart: 41 to 50 spots (+9), with 9 new grids and the 9 existing re-raise grids re-justified. Cost table and affected code/locked tests: doit/TASK-7.21/spec.md §3 and §5. Heads-up is unchanged (every heads-up re-raise is an own-raise re-raise). The spec must ask the user for wording of any new label or context text the 6-max story did not already settle, and the user signs off the new and changed spots from npm run chart:print full-ring, as in TASK-7.19. Related: TASK-7.38 (full-ring chart review).

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a full-ring hand with two or more preflop raises, When preflop advice is computed, Then it reads the own-raise-re-raised spot if the viewer made a preflop raise that a later raise now faces, and the re-raised-when-I-had-not-raised spot otherwise (TASK-7.21 rule A-2)
- [ ] #2 Given the full-ring chart, When the split is authored, Then it has 50 spots, each with all 169 hand classes and a plain-English justification that agrees with its grid, and each own-raise-re-raised spot continues with a share of that seat's opening range that the user approves
- [ ] #3 Given any new user-visible label or context text, When shown, Then its wording was approved by the user in this story's Q&A
- [ ] #4 Given the golden spots, When npm test runs, Then at least one full-ring golden spot covers each re-raise situation
- [ ] #5 Given the revised chart, When npm test runs, Then all checks pass and the user has signed off the new and changed full-ring spots from npm run chart:print full-ring in the task notes
- [ ] #6 Given a 6-max or full-ring hand where the viewer has not raised and a fourth bet is already in (e.g. BB facing r(4,8) r(5,12) r(6,16) f(1) f(2)), When preflop advice is computed, Then it reads re-raise-not-mine and a raise cell (AA) is advised call because the betting is capped

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

Implementation Notes:
--------------------------------------------------
AC added from TASK-7.40 follow-up (review r1 MINOR: no cap assertion for a not-mine fourth-bet route)

