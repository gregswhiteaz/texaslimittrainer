File: /Users/gregwhite/Documents/claudeworkspaces/limitholdem/backlog/tasks/task-7.42 - Split-blind-defence-by-an-early-or-a-late-raiser-at-6-max-and-full-ring.md

Task TASK-7.42 - Split blind defence by an early or a late raiser at 6-max and full ring
==================================================

Status: ○ To Do
Priority: Medium
Type: enhancement
Ordinal: 265000
Created: 2026-11-26 23:45 (UTC)
Updated: 2026-11-27 19:30 (UTC)
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
Follow-up from TASK-7.21 (decision: Q-2 split blind defence early/late). Today the 6-max BB defends the same 46.3% of hands against a UTG open (16.0% range) as against a button steal (40.6%), and the SB spot (10.7%) is shared by every raiser. Split blind defence into 'vs an early raiser' and 'vs a late raiser': +2 spots per chart size (heads-up unchanged, as there is only one possible raiser), 4 new grids and the 4 existing blind-defence grids re-justified. Proposed groups, to confirm with the user in the spec: 6-max early = UTG, HJ and late = CO, BTN, SB; full ring early = UTG to LJ and late = HJ, CO, BTN, SB. Facts, cost table and affected code/locked tests (including Rock's BB range pin): doit/TASK-7.21/spec.md §3 and §5. The spec must ask the user for the wording of the new labels and context sentences, and the user signs off the new and changed spots from npm run chart:print (6-max and full-ring), as in TASK-7.19.

Acceptance Criteria:
--------------------------------------------------
- [ ] #1 Given a hand where the SB or BB faces exactly one raise, When preflop advice is computed, Then it reads the vs-early-raiser or vs-late-raiser blind-defence spot according to the raiser's seat, using the seat groups the user confirmed
- [ ] #2 Given the 6-max and full-ring charts, When the split is authored, Then each new spot has all 169 hand classes and a plain-English justification that agrees with its grid, and each blind's range against an early raiser is no wider than against a late raiser
- [ ] #3 Given each new situation, When the chart is authored, Then it has a label in SITUATION_LABELS and a context sentence shown in the preflop explanation, both with wording the user approved in this story's Q&A
- [ ] #4 Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot
- [ ] #5 Given the revised charts, When npm test runs, Then all checks pass and the user has signed off the new and changed spots from npm run chart:print in the task notes

Definition of Done:
--------------------------------------------------
No Definition of Done items defined

