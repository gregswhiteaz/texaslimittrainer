---
id: TASK-6.25
title: >-
  Keep every bot style inside its band in the Mixed line-up now that bots read
  opponents' actions
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-25T00:07:00Z'
updated_date: '2026-11-25T05:56:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.32
parent_task_id: TASK-6
priority: high
ordinal: 239000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up from TASK-7.32 (user Q-2). Once bots use action-based ranges and fold to bets, Maniacs stop busting and take over replaced seats in the Mixed line-up, pushing other styles out of their REQ-027 bands (seed 42, 10k hands: TAG PFR 12.0 / Aggression 34.8; Rock VPIP 7.6 / Aggression 31.8). Until this lands, the opt-in slow tests/bots/style-bands.acceptance.test.ts and the manual style-bands.yml workflow are expected to fail.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Mixed line-up with bots on action ranges, When the opt-in style-bands check runs (TLH_SLOW_TESTS=1), Then every style's VPIP, PFR and Aggression fall inside their REQ-027 bands
- [x] #2 Given the fix, When the manual style-bands.yml workflow is dispatched, Then it passes
- [x] #3 Given the Mixed line-up with bots on action ranges, When tests/playtest/check-styles.acceptance.test.ts's slow 100,000-hand Mixed check runs (seeds 42, 7, 1234), Then it passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. A busted bot is replaced by a new bot of the same style (presets and Custom); amend REQ-007.5, retire REQ-007.7/007.8; delete the random style draw
2. Maniac retune: postflop call->raise 0.2, new postflop fold->call 0.8
3. Rock retune: value bar 75 -> 80, wider ranges after a raise
4. Re-pin locked bot/replacement tests one-for-one; new fast mixed-composition acceptance test
5. Slow style-bands and check-styles 100k Mixed checks pass on seeds 42/7/1234; all-TAG playtest output unchanged

Full spec: doit/TASK-6.25/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.32 build: check-styles slow Mixed check also fails until this lands (TAG PFR 10.3 / Agg 31.3, Rock VPIP 6.7 at seed 42).

Build: replacement keeps the busted bot's style (REQ-007.5 amended, 007.7/007.8 retired, changelog 1.11; random draw deleted); Maniac call->raise 0.2 + fold->call 0.8; Rock value bar 80 + wider ranges after a raise; locked re-pins one-for-one (qa.md); check-styles fast timeout 30s->60s (Block 1). Slow group 95/95 incl. style-bands 3 seeds and check-styles 100k; all-TAG output hash unchanged; gate PASS.

Judge r1 PASS 7/7: CLI 100k Mixed --check-styles passed on seeds 42/7/1234 (style multiset constant, every style in band); slow style-bands + check-styles 15/15; all-TAG hash unchanged; live app: busted TAG and Calling station replaced by same style. CI 45552117336 green.
<!-- SECTION:NOTES:END -->
