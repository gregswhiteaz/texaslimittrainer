---
id: TASK-1.11
title: Play heads-up hands with heads-up blinds and order
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T04:18:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-57
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want two-player hands to follow heads-up casino rules, so that heads-up practice matches real casino rules.

While exactly two players are dealt in: the button posts the small blind and the other player the big blind; the button acts first preflop and last on flop, turn and river.

## Requirements covered
- REQ-015 (Must): Heads-up blinds and order — While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-015, REQ-062

Plan key: E01-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a heads-up $4/$8 hand, When blinds are posted, Then the button posts the $2 small blind and the other player posts the $4 big blind [REQ-015.1]
- [x] #2 Given a heads-up hand, When preflop betting begins, Then the button acts first [REQ-015.2]
- [x] #3 Given a heads-up hand, When betting begins on the flop, turn and river, Then the non-button player acts first on each street [REQ-015.3]
- [x] #4 Given `npm run playtest -- --hands 10000 --size 2 --seed 42`, When it runs, Then every hand is heads-up and the run reports zero invariant violations [REQ-062.1, REQ-015.1]
- [x] #5 Given npm run playtest -- --size 2, When it runs, Then it plays heads-up hands with heads-up blinds and order and reports 0 violations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. createHand: with exactly 2 seats the button posts the small blind and the other seat the big blind; accept 2–10 seats.
2. Existing actor order then gives button-first preflop and non-button-first postflop.
3. Playtest CLI --size accepts 2–10.
4. Acceptance tests: heads-up blinds/order; 10k-hand --size 2 run with 0 violations and per-hand blind/order checks; 6-max baseline byte-identical.

Full spec: doit/TASK-1.11/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.6 follow-up (doc-15): --size is limited to 3..10 until heads-up exists.

Autopilot: no asks; assumptions A-1..A-3 in spec.

Build: heads-up blinds (button posts SB with 2 seats), 2–10 seats in engine and playtest CLI; heads-up acceptance tests incl. all 10k --size 2 hands checked; 6-max baseline identical; gate PASS

Follow-ups (Step 6a): AC added to TASK-2.2 (heads-up position labels). Heads-up raise cap owned by TASK-1.12. Duplicate cli test checks not tracked.

Locked test tests/playtest/heads-up.acceptance.test.ts: heavy run moved to opt-in slow group for TASK-7.8 (D-7), smaller every-push version kept.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Heads-up hands now work: with 2 seats the button posts the small blind and acts first preflop, and the other player posts the big blind and acts first on later streets. `--size` is now 2..10. Verified by new acceptance tests, a 10,000-hand `--size 2` run (fold 8940, showdown 1060, 0 invariant violations), and a byte-identical 6-max baseline; lint, typecheck and 402 tests pass. Branch CI run 44869653305 (#109) succeeded on 8c1dbfb, Visual green. Review assumptions A-1..A-3 (CLI/engine messages, same stakes and stacks at size 2). Follow-ups: positionName label for the heads-up non-button seat (TASK-2.2); heads-up raise cap (TASK-1.12).
<!-- SECTION:FINAL_SUMMARY:END -->
