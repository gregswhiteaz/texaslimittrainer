---
id: TASK-7.42
title: Split blind defence by an early or a late raiser at 6-max and full ring
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-26T23:45:00Z'
updated_date: '2026-11-28T18:58:00Z'
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
- [ ] #3 Given each new situation, When the chart is authored, Then it has a label in SITUATION_LABELS and a context sentence shown in the preflop explanation, both with wording the user approved in this story's Q&A
- [ ] #4 Given the Rock style and the golden spots, When npm test runs, Then every new 6-max spot has a Rock starting range that is a strict subset of the TAG chart's plays, and each new situation has at least one golden spot
- [ ] #5 Given the revised charts, When npm test runs, Then all checks pass and the user has signed off the new and changed spots from npm run chart:print in the task notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New situation blind-defence-early (SB/BB, 6-max + full ring), routed by raiser seat group (Q-1); label + context sentence (Q-2/Q-3)
2. 4 early grids (Q-4 subset/bands); late grids keep cells, text re-justified; 6-max 32->34, full ring 50->52
3. Rock SB/BB early ranges (Q-5); TAG mixing mapping
4. Golden spots (3 re-labelled, 2 new); pre-approved re-pins under all owners (Q-6)
5. signoff.md package for the user before code review; slow group once

Full spec: doit/TASK-7.42/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: blind-defence-early situation (Q-1..Q-5), 4 early grids, late grids unchanged, Rock early ranges, golden + Q-6 re-pins; gate PASS. Deviations: early-grid cells for 6 hands made borderline (F*/C) so 6 locked postflop golden spots (BB calls UTG) still grade Minor; route B8 uses c4 c5 f6 r1.

User chart sign-off 2026-11-28 (AC#5): the user signed off the 4 new blind-defence-early spots and the 4 re-justified late blind-defence spots (6-max and full ring) as printed in doit/TASK-7.42/signoff.md, including the borderline F*/C cells kept for the 6 postflop golden spots and Rock's early ranges.
<!-- SECTION:NOTES:END -->
