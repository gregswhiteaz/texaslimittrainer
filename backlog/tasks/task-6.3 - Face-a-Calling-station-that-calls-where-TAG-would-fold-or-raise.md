---
id: TASK-6.3
title: Face a Calling station that calls where TAG would fold or raise
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-27T23:25:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-74
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want Calling station opponents that call far too often, so that I learn to value-bet against loose-passive players and stop bluffing them.

Calling station (loose-passive) is built on the same advice evaluation as TAG with documented deviations stored in its own style data file: where the advice is fold or raise it calls more often than TAG. Deviation choices use the seeded generator from E06-S02. Target band (proved in E06-S09): VPIP 45-65%, PFR 3-10%, aggression 10-25%.

## Requirements covered
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.

Covers: REQ-026

## Notes
Legality matters for the last AC: folding when check is free is illegal in the engine (E01-S11).

Plan key: E06-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the Calling station style data file, When it is loaded, Then it holds the style's deviation parameters and a plain-English description of the style [REQ-026.3]
- [x] #2 Given 10,000 seeded decision points facing a bet where the advice is fold, When a Calling station and a TAG each act at the same points, Then the Calling station calls at more of them than TAG [REQ-026.2]
- [x] #3 Given 10,000 seeded decision points where the advice is raise, When a Calling station and a TAG each act at the same points, Then the Calling station calls at more of them than TAG [REQ-026.2]
- [x] #4 Given the Calling station file's call probability is changed and no code is changed, When the same 10,000 seeded decision points are replayed, Then its call rate changes [REQ-026.3]
- [x] #5 Given any Calling station decision with no bet to face, When it acts, Then it checks or bets and never folds [REQ-026.2]
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
1. Optional 'deviations' list in the style format (Q-1); tag.json unchanged.
2. calling-station.json (0.5 / 0.6 / 0.5 with justifications, Q-2) and decideCallingStation: one draw per deviating decision, none otherwise; never folds when check is free.
3. Worker routes 'Calling station' to decideCallingStation (Q-3).
4. Tests: AC#2/#3 vs TAG over 10,000 seeded points, AC#4 probability change via file only, AC#5; playtest byte-identical.

Full spec: doit/TASK-6.3/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot Q-1..Q-3 auto-accepted (qa.md). Scope concern: postflop advice never bets/raises → aggression bands (TASK-6.16/6.17) unreachable until advice bets postflop; follow-up at close.

Build: deviations in style format; calling-station.json + decideCallingStation; worker dispatch; examples A–C match; playtest byte-identical; 548 tests, e2e 130; gate PASS.

Follow-ups (Step 6a): TASK-6.16/6.17 now depend on TASK-7.8 (value betting) — aggression bands unreachable until then. Review MINOR (duplicate view collection in tests) is test plumbing, not tracked.

Judge R1 PASS 11/11 (own seeds: fold-call 0.488, raise-call 0.598; all-station playtest VPIP 51.5%, PFR 4.5%; 7/7 mutants). Postflop aggression 0% → TASK-7.8/6.17.

Locked test tests/bots/calling-station.acceptance.test.ts re-pinned for TASK-7.8 Q-3 (auto-accepted; value betting).

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).

Locked test re-pinned by TASK-7.40 (seeded examples shifted by the 6-max re-raise split); no assertion dropped.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the Calling station bot: optional `deviations` list in the style file format, calling-station.json (preflop fold->call 0.5, preflop raise->call 0.6, postflop fold->call 0.5; prototype VPIP 52-59%, PFR 4.9-6.8%), decideCallingStation with one seeded draw per deviating decision, and worker dispatch. Verified: npm test 548 passed, coverage 96.96%, lint/typecheck clean, e2e 130 passed, playtest baseline hash aacd5e94...e01 unchanged; review R1 0 blocking, security clean. Review assumptions A-1..A-7 and auto-accepted Q-1..Q-3 in the story doc. Risks: postflop advice never bets, so aggression is 0% for all bots until TASK-7.8 (TASK-6.16/6.17 depend on it); change size 840 lines vs 650 budget (tests).
<!-- SECTION:FINAL_SUMMARY:END -->
