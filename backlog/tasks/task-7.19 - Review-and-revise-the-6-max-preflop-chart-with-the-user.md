---
id: TASK-7.19
title: Review and revise the 6-max preflop chart with the user
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T16:24:00Z'
updated_date: '2026-11-19T03:25:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-0
dependencies:
  - TASK-7.2
references:
  - doc-14
  - src/advice/charts/six-max.json
documentation:
  - doc-28
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: npm run chart:print (src/advice/chart-print.ts + tools/chart-print/main.ts); re-raise spots keep UTG 0.887, HJ 0.858, CO 0.832, BTN 0.844, SB 0.882 of opening range (Q-1); BB blind defence widened 43.6%→46.3% with no offsuit inversions; BTN/SB unopened flags fixed; 23 justifications rewritten; CO re-raise folds A9o/A8o to keep TASK-9.1's locked review test valid; BTN re-raise band [6,41] (D-3); playtest 0 violations; gate PASS. User review files: doit/TASK-7.19/chart-print.txt, chart-changes.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Built: npm run chart:print (all 26 spots as 13x13 grids with raise/continue %), and the 6-max chart revised per user decisions Q-1 (openers keep 80-90% of their own range vs a re-raise, only premium 4-bets), Q-2 (printed grids, user signs off) and Q-3 (widen now, split spots later in TASK-7.21). Re-raise shares: UTG 0.60->0.887, HJ 0.54->0.858, CO 0.44->0.832, BTN 0.39->0.844, SB 0.23->0.882; BB re-raise unchanged. BB blind-defence inversions fixed (K9o/K8o/Q8o/J8o now firm calls; 46.3% continue); all 26 justifications made true for every route; HJ raise-and-calls text now says we close the action unless a limper after us is still to act and names its suited aces. BTN re-raise band edited [6,30]->[6,41] (D-3).
Verification: gate run 1 PASS (npm test 276 passed/2 skipped, lint, typecheck, playtest 0 invariant violations); review round 1 clean on code (15 chart + 7 formatter mutants caught, except the expected BB no-upper-bound case) and security. Judge, CI and user sign-off are pending.
Assumptions to review: A-1 to A-9 in doc (esp. A-1 SB rule, A-3 premium set, A-4 consistency rule, A-5 HJ wording). Review doit/TASK-7.19/chart-changes.md and chart-print.txt.
Risks/follow-ups: CO folds A9o/A8o (forced by locked TASK-9.1 test) while continuing KTo - revisit after TASK-7.21; BB re-raise text wording ('our raise is already in' wrong on cold route); fix doc-14 'HJ always closes' note; add --spot filter to chart:print; TASK-6.16 measure TAG aggression after widening (retune if outside 45-65%).
<!-- SECTION:FINAL_SUMMARY:END -->
