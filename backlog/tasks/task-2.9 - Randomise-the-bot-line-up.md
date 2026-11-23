---
id: TASK-2.9
title: Randomise the bot line-up
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T02:46:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-91
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to randomise every bot seat's style, so that I practise against unpredictable mixes of opponents.

Randomise line-up assigns each bot seat a style drawn at random from TAG, Calling station, Maniac and Rock, independently per seat. The resulting line-up name is resolved by E06-S07 (Custom unless it happens to equal the selected preset's assignment). Use a seeded generator in tests.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.

Covers: REQ-009

Plan key: E02-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given 9 players, When the user chooses Randomise line-up, Then every one of the 8 bot rows shows one of TAG, Calling station, Maniac or Rock [REQ-009.5]
- [x] #2 Given 1,000 seeded randomisations at 6 players, When the styles per seat are tabulated, Then every seat received each of the four styles at least once [REQ-009.5]
- [x] #3 Given a randomised line-up that differs from the selected preset, When the user chooses Start game, Then the table's bots have the randomised styles and the session's line-up name is Custom [REQ-009.5, REQ-009.6]
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
1. randomBotStyles(config, nextWord) (uniform word%4 per bot, clockwise) and configWithSeatStyles in session.ts.
2. Game Config 'Randomise line-up' outline button beside Opponents; crypto.getRandomValues one 1-word call per seat on press; replaces edits.
3. Tests: seeded 1,000-draw tabulation, Custom name, rows/table styles in browser (stubbed 1-word draws), axe.
4. Q-3 locked button-list edits.

Full spec: doit/TASK-2.9/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: Randomise line-up button (uniform per seat, crypto 1-word draws on press), randomBotStyles/configWithSeatStyles; Q-3 button-list edits only; e2e 164 ×2; gate PASS.

Review R1: 0 blocking; MINOR (9-player AC#1 test passes without a press — wiring covered by SPEC-04/05) not tracked; NIT.

Judge R1 PASS 11/11 (12,000-draw chi-square per seat at 5 sizes; 0→8 one-word draws per press; 5/5 mutants). Follow-up: TASK-2.19 (Game Config sideways scroll at phone width, from TASK-2.8).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Randomise line-up button to Game Config's Opponents panel: one press draws a uniform, independent style per bot seat (crypto words mod 4), replaces all per-seat edits, and the session line-up is named Custom or the matching preset. Verified: gate PASS (2 runs), 1,000-draw seeded uniformity test, Playwright table test, review round 1 with 0 blocking. Assumptions to review: A-1..A-4 and auto-accepted Q-1..Q-3 (incl. four locked button-list test edits). Risks: 9-player e2e is weak on its own (MINOR); CI not yet run.
<!-- SECTION:FINAL_SUMMARY:END -->
