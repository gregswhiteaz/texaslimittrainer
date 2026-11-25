---
id: TASK-6.25
title: >-
  Keep every bot style inside its band in the Mixed line-up now that bots read
  opponents' actions
status: Done
assignee:
  - '@claude'
created_date: '2026-11-25T00:07:00Z'
updated_date: '2026-11-25T05:57:00Z'
labels:
  - dream-limit-holdem-trainer
  - follow-up
milestone: m-1
dependencies:
  - TASK-7.32
documentation:
  - doc-130
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

Follow-ups: TASK-6.26 (tidy dead Replay option, comments, justifications, test loop); TASK-6.12 note (Maniac +12 BB/100, TAG PFR margin 0.6).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replacement bots now keep the busted bot's style (app and playtest), stopping the Maniac takeover of Mixed seats; Maniac (call-to-raise 0.2, new fold-to-call 0.8) and Rock (value bar 80, wider ranges after a raise) retuned. Unchanged REQ-027 bands pass at 100,000 hands on seeds 42, 7, 1234 (workflow commands exit 0, slow tests pass); npm test 1310 passed, Playwright 304 passed, all-TAG output unchanged. Judge PASS 7/7. Review: Q-1 reverses your earlier Q-113 (random replacement style), Q-2 Maniac/Rock retune, check-styles fast timeout 30s to 60s, locked re-pins, A-1..A-7. Risks: Maniac still wins about +12 BB/100 (TASK-6.12); TAG PFR only 0.6 above its floor; dead replacedStylesOption in cli.ts. Doc: doc-130
<!-- SECTION:FINAL_SUMMARY:END -->
