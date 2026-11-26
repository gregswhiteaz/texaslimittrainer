---
id: TASK-7.42
title: Split blind defence by an early or a late raiser at 6-max and full ring
status: To Do
assignee: []
created_date: '2026-11-26T23:45:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.40
references:
  - doit/TASK-7.21/spec.md
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-28
parent_task_id: TASK-7
priority: medium
type: enhancement
ordinal: 265000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.21 (decision: Q-2 split blind defence early/late). Today the 6-max BB defends the same 46.3% of hands against a UTG open (16.0% range) as against a button steal (40.6%), and the SB spot (10.7%) is shared by every raiser. Split blind defence into 'vs an early raiser' and 'vs a late raiser': +2 spots per chart size (heads-up unchanged, as there is only one possible raiser), 4 new grids and the 4 existing blind-defence grids re-justified. Proposed groups, to confirm with the user in the spec: 6-max early = UTG, HJ and late = CO, BTN, SB; full ring early = UTG to LJ and late = HJ, CO, BTN, SB. Facts, cost table and affected code/locked tests (including Rock's BB range pin): doit/TASK-7.21/spec.md §3 and §5. The spec must ask the user for the wording of the new labels and context sentences, and the user signs off the new and changed spots from npm run chart:print (6-max and full-ring), as in TASK-7.19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand where the SB or BB faces exactly one raise, When preflop advice is computed, Then it reads the vs-early-raiser or vs-late-raiser blind-defence spot according to the raiser's seat, using the seat groups the user confirmed
- [ ] #2 Given the 6-max and full-ring charts, When the split is authored, Then each new spot has all 169 hand classes and a plain-English justification that agrees with its grid, and each blind's range against an early raiser is no wider than against a late raiser
- [ ] #3 Given each new situation, When it appears in a hint, a review or the preflop explanation, Then it shows a label and a context sentence whose wording the user approved in this story's Q&A
- [ ] #4 Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot
- [ ] #5 Given the revised charts, When npm test runs, Then all checks pass and the user has signed off the new and changed spots from npm run chart:print in the task notes
<!-- AC:END -->
