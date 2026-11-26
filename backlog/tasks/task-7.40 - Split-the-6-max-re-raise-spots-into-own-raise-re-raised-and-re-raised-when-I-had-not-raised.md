---
id: TASK-7.40
title: >-
  Split the 6-max re-raise spots into own-raise-re-raised and
  re-raised-when-I-had-not-raised
status: To Do
assignee: []
created_date: '2026-11-26T23:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.21
references:
  - doit/TASK-7.21/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-28
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 263000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.21 (decision: Q-1 split re-raise). Today `situationOf` sends every preflop spot with two or more raises to one `re-raise` spot, so the CO continues 22.5% against an open plus a 3-bet but only 8.4% against one open. Split it with the TASK-7.21 A-2 rule: 'own raise re-raised' when the viewer made a preflop raise and a later raise now faces them; every other spot with two or more raises is 're-raised when I had not raised' (cold 3-bets, called then 3-bet, limped then two raises). 6-max grows from 26 to 32 spots (+6), with 6 new grids and the 6 existing re-raise grids re-justified. Facts, routes, cost table and the full list of affected code and locked tests: doit/TASK-7.21/spec.md §3 and §5. Under A-2 the locked TASK-9.1 route (UTG opens, CO calls, BB 3-bets) lands in the not-my-raise spot. The spec must ask the user for the wording of the new hint/review label (SITUATION_LABELS) and context sentence (PREFLOP_CONTEXT), and the user signs off the new and changed spots from npm run chart:print, as in TASK-7.19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-max hand where the viewer made a preflop raise and a later raise now faces them, When preflop advice is computed, Then it reads that seat's own-raise-re-raised spot; and given two or more raises when the viewer has not raised, Then it reads that seat's re-raised-when-I-had-not-raised spot (TASK-7.21 rule A-2)
- [ ] #2 Given the 6-max chart, When the split is authored, Then it has 32 spots, each with all 169 hand classes and a plain-English justification that agrees with its grid, and each own-raise-re-raised spot continues with 80-90% of that seat's opening range (TASK-7.19 rule)
- [ ] #3 Given re-raise spots are split into 'my open was 3-bet' and 'cold 3-bet', When the CO cold-3-bet spot is authored, Then CO A9o/A8o are reconsidered (TASK-7.19 folds them only because TASK-9.1's locked review test pins CO A9o as Fold) and that test is updated if the advice changes
- [ ] #4 Given each new situation, When it appears in a hint, a review or the preflop explanation, Then it shows a label and a context sentence whose wording the user approved in this story's Q&A
- [ ] #5 Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot
- [ ] #6 Given a heads-up or full-ring hand, When the split is in place, Then the advice is unchanged from today (heads-up has only own-raise re-raises; full ring keeps today's re-raise grids until the full-ring story)
- [ ] #7 Given the revised chart, When npm test runs, Then all checks pass and the user has signed off the new and changed 6-max spots from npm run chart:print in the task notes
<!-- AC:END -->
