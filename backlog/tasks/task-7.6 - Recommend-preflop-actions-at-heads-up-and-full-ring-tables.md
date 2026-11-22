---
id: TASK-7.6
title: Recommend preflop actions at heads-up and full-ring tables
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T23:01:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-87
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want preflop recommendations tuned to the table size I play, from heads-up to full ring, so that the advice fits the table size I am practising.

Adds the heads-up (2) and full-ring (9-10) charts with the same situations, cell format and justification rules as the 6-max chart (E07-S01). Table sizes map to reference sizes: 2 -> heads-up; 3, 4, 5, 6, 7 -> 6-max; 8, 9, 10 -> full ring. The approximate label for mapped sizes is E07-S16. Position mapping: a seat uses the reference chart's position that is the same number of seats before the button (BTN, SB and BB keep their names); seats earlier than the reference chart's earliest position use that earliest position (UTG).

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-032 (Must): Preflop charts — The advice engine shall take every preflop recommendation from authored charts that give, for each reference size, position and preflop situation, the action for each of the 169 starting-hand classes.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-005, REQ-032, REQ-061

Plan key: E07-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the chart data, When the chart validator runs, Then charts exist for heads-up, 6-max and full ring and a missing chart fails validation [REQ-032.1]
- [x] #2 Given the heads-up and full-ring charts, When the chart validator runs, Then every position at those sizes in each situation that applies to it (unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise, blind defence) assigns an action to all 169 hand classes [REQ-032.2]
- [x] #3 Given the heads-up or full-ring chart file without a plain-English justification, When the chart validator runs, Then validation fails naming the chart [REQ-032.4]
- [x] #4 Given a preflop PlayerView at each table size from 2 to 10, When advice is requested, Then the chart used is heads-up for 2, 6-max for 3 to 7 and full ring for 8 to 10 [REQ-005.4, REQ-032.1]
- [x] #5 Given a heads-up preflop PlayerView on the button, When advice is requested, Then the recommendation comes from the heads-up chart cell for that hand class and situation [REQ-032.1]
- [x] #6 Given a heads-up preflop decision where the big blind faces a fourth bet (button raised, big blind re-raised, button re-raised) with a hand class whose heads-up big-blind facing-a-re-raise cell is raise, When advice is requested, Then it uses that heads-up cell and returns call because the street is capped [REQ-032.6]
- [x] #7 Given a full-ring preflop decision where UTG faces a fourth bet (UTG raised, CO re-raised, BB re-raised), When advice is requested for a hand class whose full-ring UTG facing-a-re-raise cell is raise and for one whose cell is fold, Then it uses those full-ring cells and returns call and fold respectively [REQ-032.6]
- [x] #8 Given preflop decisions at the first seat to act, When advice is requested, Then 4-handed uses the 6-max CO cell, 5-handed the 6-max HJ cell, both of the two earliest 7-handed seats the 6-max UTG cell, and 8-handed the full-ring cell of the position 5 seats before the button [REQ-005.4]
- [x] #9 Given charts for table sizes 2-10, When the playtest's defaultPolicyFactory seats bots, Then TAG sits in every seat at every supported size and the random-move fallback is removed
- [x] #10 Given 10-seat preflop charts exist, When TASK-3.13's e2e/rapid-pace.spec.ts 10-player check (SPEC-05) runs with the real TAG bots instead of its test-only policy, Then every bot action after the user's preflop fold shows within 300 ms
- [x] #11 Given a playtest with --lineup at 2 to 10 seats, When it runs after full-ring and heads-up advice exist, Then every line-up seat plays its own style in every hand (the TASK-6.6 random-move fallback for non-6-seat hands and its Line-up note are removed) and zero invariant violations are reported
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Chart ranges and justification text are original, written for this project [REQ-061.2]
- [x] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #9 No new network requests beyond the app's own files [REQ-058.1]
- [x] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #12 Story documentation is written and published to Backlog.md
- [x] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Authored heads-up (6 spots) and full-ring (41 spots, 9 positions) charts with justifications; validator covers all three sizes.
2. referenceSizeOf + seat→position mapping for 2–10 dealt-in seats (A-1); advice picks heads-up / 6-max / full ring.
3. Remove random-move fallbacks (default playtest and --lineup) and the Line-up note; Rock maps its 6-max range by seat.
4. AC#10: pace harness uses the real advice worker (locked rapid-pace spec untouched).
5. Approved TASK-6.6 locked-test edits (Q-4); measure playtest:million --lineups (Q-5).

Full spec: doit/TASK-7.6/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.1 follow-up (doc-18).

AC added from TASK-3.13 (10-player pace proven with a test-only policy until 10-seat charts exist)

AC added from TASK-6.6 Q-1

Build blocked on TASK-7.2's AC#6 sandbox file list; user approved adding the two chart paths (Q-6).

Build: heads-up (6 spots) + full-ring (41 spots, 9 positions) authored charts; seat→chart mapping 2–10; random fallbacks and Line-up note removed; Rock maps its 6-max range; pace harness uses real advice worker; user-approved locked edits Q-4 (TASK-6.6), Q-6 (TASK-7.2), Q-7 (TASK-6.10); default label TAG at every size (winrate.ts, outside spec file list — Q-7). million --lineups 50.5 s local; --hands 900 hash now fee5dbb1…; 6-max default SHA unchanged; gate PASS.

Review R1: 0 blocking; locked edits Q-4/Q-6/Q-7 verified exact; MINOR A-3 fallback too broad → fixing in-story; SPEC-09 5.8 s vs 5 s target accepted (sweep group, no coverage).

Judge R1 PASS 16/16 (28,150 seat-mapping cases 0 mismatches; 2,712 styled actions match decideStyle; 36 size×line-up playtests clean; million --lineups 52 s; 11/11 mutants). J-1-01 MEDIUM: all-sizes AC#11 test 40 s under local coverage vs 60 s timeout → raised to the repo 120 s acceptance timeout (gate PASS). Follow-ups: TASK-7.26 (HU/full-ring default ranges), TASK-7.27 (chart:print sizes).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added authored heads-up (6 spots) and full-ring (41 spots, 9 positions) preflop charts; every table size 2-10 now maps to a chart and seat position, the playtest random fallback is removed (default TAG everywhere, --lineup styles in every hand), and the pace e2e uses the real advice worker. Verified: lint/typecheck/npm test clean (680 tests, 0 failed), e2e 142 passed, 10-player pace passed, playtests 0 violations, million --lineups 50.5 s wall (no perf follow-up); review R1 0 blocking (MINOR A-3 fallback fixed); CI #196 green. Review: Claude-authored charts need USER review (Q-1..Q-3 auto-accepted), assumptions A-1..A-6 (Rock uses 6-max range at other sizes), user-approved locked-test edits Q-4/Q-6/Q-7. Follow-ups: heads-up/full-ring default opponent ranges; chart:print size argument; million --hands 900 hash now fee5dbb1.
<!-- SECTION:FINAL_SUMMARY:END -->
