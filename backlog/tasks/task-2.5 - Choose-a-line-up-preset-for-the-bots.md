---
id: TASK-2.5
title: Choose a line-up preset for the bots
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T01:42:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.2
  - TASK-6.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-89
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to pick the Mixed, Tough or Soft line-up, so that I face the kind of opponents I want to practise against.

Game Config's Opponents section offers the presets Mixed, Tough and Soft (Mixed on first use) and lists one row per bot seat (players - 1 rows), in clockwise order starting with the first bot seat clockwise from the user, with the bot's display name and style, using the E06-S06 line-up module: Mixed cycles TAG, Calling station, Maniac, Rock over the bot seats; Tough is all TAG except one Maniac in the first bot seat clockwise from the user (heads-up: one TAG); Soft alternates Calling station and Rock (REQ-009.1, REQ-009.8). Names are unique within the table. Rows update when the players count changes. Start game resolves the line-up through E06-S07 and the table seats exactly the listed bots.

## Requirements covered
- REQ-009 (Must): Line-up presets and per-seat styles — The Game Config screen shall let the user choose a line-up preset (Mixed, Tough or Soft) and then change the style of any individual bot seat.
- REQ-012 (Could): Remember last configuration — When the Game Config screen opens, TLH Trainer shall pre-fill every field with the values used for the most recently started session.

Covers: REQ-009, REQ-012

Plan key: E02-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a fresh install, When Game Config opens, Then the Mixed preset is selected and the five bot rows, listed clockwise from the user, show TAG, Calling station, Maniac, Rock, TAG [REQ-012.2, REQ-009.1]
- [x] #2 Given 9 players and the Tough preset, When the bot rows are shown, Then there are 8 rows, the first bot seat clockwise from the user is the only Maniac and every other row is TAG [REQ-009.1, REQ-009.8]
- [x] #3 Given 6 players, When the user switches from 6 to 4 players with the Soft preset, Then 3 rows are shown styled Calling station, Rock, Calling station [REQ-009.1]
- [x] #4 Given 2 players and the Tough preset, When the bot row is shown, Then the single bot is TAG [REQ-009.7]
- [x] #5 Given any preset at 10 players, When the bot rows are shown, Then no two rows share a display name [REQ-009.4]
- [x] #6 Given the Soft preset at 6 players, When the user chooses Start game, Then the table's bots have the names and styles listed on Game Config and the session's line-up name is Soft [REQ-009.1, REQ-009.6]
- [x] #7 Given Game Config at any table size from 2 to 10, When Start game builds the session with lineUpSessionConfig, Then the button passed is a seat at that table (1..players) so Start game never throws — e.g. heads-up with the default button 6
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
1. configForLineUp(config, players, preset) in session.ts: seatLineUp names/styles clockwise from the user, configForPlayers button, lineUpSessionConfig name.
2. Game Config 'Line-up' radio group (Mixed/Tough/Soft, Mixed first) above the bot rows; rows rebuild on players/preset change.
3. Start game seats exactly the listed bots with the resolved line-up name; DEFAULT_SESSION_CONFIG stays all-TAG.
4. Approved locked-test edits: Q-2 routine (names/labels), Q-3 user-approved (action-bar re-pin; next-hand/review expected values).
5. Run e2e:slow first; e2e Chromium/WebKit with axe.

Full spec: doit/TASK-2.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.7 follow-up (lineUpSessionConfig rejects an invalid button, A-4)

Build: Line-up radio group (Mixed/Tough/Soft), configForLineUp clockwise seating, Start game seats listed bots; locked edits Q-2 (routine), Q-3 (user), Q-4/Q-5 (auto-accepted); slow e2e 200-hand passes; e2e 150 ×2; playtests clean; gate PASS.

Review R1: 0 blocking; all 11 locked edits keep their expect counts; MINOR copied axe helper (6th copy) not tracked (test-harness, no failure path); NIT isPreset.

Judge R1 PASS 15/15, no findings (all 27 preset×size rows in Chromium/WebKit; 7,322 model checks; 4/4 mutants). Pre-existing integrity ERRORs on TASK-2.1/3.1/3.2 owners exist at base too (from earlier approved unlocks), not this task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Game Config now has a Line-up radio group (Mixed/Tough/Soft, Mixed on first use). Bot rows come from seatLineUp via new configForLineUp/botsClockwise in session.ts, listed clockwise from the user, and Start game seats exactly those bots with the preset as line-up name. DEFAULT_SESSION_CONFIG stays all-TAG (D-1). Verified: npm test 686 passed, lint/typecheck clean, e2e x2 150 passed (Chromium+WebKit), slow 200-hand rapid-pace passed (6.2 min), playtests mixed/tough/soft 10k hands 0 violations; judge pending. Review: 0 blocking. Review assumptions A-1..A-5 and the locked-test edits: Q-3 (user-approved: action-bar re-pinned, next-hand/review expected values e.g. "Cal wins $50"), Q-4 radio counts/selectors, Q-5 rapid-pace foldElseCheck fix (auto-accepted). Follow-ups already owned by TASK-2.8, 2.9, 2.10.
<!-- SECTION:FINAL_SUMMARY:END -->
