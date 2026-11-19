---
id: TASK-7.19
title: Review and revise the 6-max preflop chart with the user
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-19T03:03:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.2
references:
  - doc-14
  - src/advice/charts/six-max.json
parent_task_id: TASK-7
priority: high
type: enhancement
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.2 (doc-14). The chart was authored by Claude (Q-1) and the user has not reviewed it yet. The judge (J-1-01..03) and code review found content issues: re-raise spots fold much of the hero's own opening range to one 3-bet at ~6.5:1 (UTG opens 16.0% but continues 9.7%) while the UTG/HJ texts say opened hands usually call; some justifications describe only one route into the spot; K9o is a borderline call in BB defence while weaker Q9o/J9o/T8o are firm calls; HJ raise-and-calls text says 'usually close' and 'suited aces' too broadly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given npm run chart:print, When it runs, Then it prints every spot as a 13x13 grid with its raise and continue percentages
- [ ] #2 Given the facing-a-re-raise spots for UTG, HJ, CO and BTN, When the chart is revised, Then each continues with a share of its own unopened range that the user approves, and each justification agrees with its grid
- [ ] #3 Given every spot's justification, When reviewed against the routes into that spot (e.g. SB blind defence after an SB complete and BB raise; HJ facing a raise after limping), Then it is accurate for every route
- [ ] #4 Given BB blind defence, When the chart is revised, Then no offsuit hand is a firmer call than a strictly stronger hand of the same high card (K9o vs Q9o/J9o/T8o fixed)
- [ ] #5 Given the HJ raise-and-calls text, When revised, Then it says we close the action and names only the suited aces the grid calls with
- [ ] #6 Given the revised chart, When npm test runs, Then every spot is still inside its spec band and the user has signed off the chart in the task notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. tools/chart-print: npm run chart:print prints every spot as a 13x13 grid with raise and continue percentages (Node built-ins, type-stripping loadable).
2. Re-raise spots (UTG/HJ/CO/BTN/SB): continue with 80-90% of the opener's unopened raise combos, subset of the open range, 4-bet only premiums {AA,KK,QQ,JJ,AKs,AKo,AQs} (Q-1); BB per A-2; justifications rewritten to match.
3. Justifications accurate for every route into each spot (route table in spec §5), incl. SB blind defence after SB complete and BB raise, HJ facing a raise after limping.
4. Consistency rule across all 26 spots (offsuit dominance; suited same-high-card with kicker 6+); fix BB blind defence (K9o vs Q9o/J9o/T8o), BTN unopened 98o, SB unopened K9o/98o flags.
5. HJ raise-and-calls text: 'close the action' (qualified per A-5) and names only the suited aces it calls.
6. BTN re-raise band widened to [6, 41] in six-max-chart.test.ts (D-3, user Q-1); other bands unchanged.
7. Show the user the changed spots via chart:print and record sign-off in task notes before Done (Q-2).

Full spec: doit/TASK-7.19/spec.md
<!-- SECTION:PLAN:END -->
