---
id: TASK-2.2
title: Choose how many players sit at the table
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T01:53:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-1.11
  - TASK-7.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-88
parent_task_id: TASK-2
priority: high
type: feature
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to choose a table of 2 to 10 players including me, so that I can practise heads-up, short-handed and full-ring play.

Game Config offers the players options 2, 3, 4, 5, 6, 7, 8, 9 and 10 (including the user), labelled 2 (heads-up), 6 (6-max) and 10 (full ring) as in the Config storyboard. Mapping to reference sizes: 2 -> heads-up; 3, 4, 5, 6, 7 -> 6-max; 8, 9, 10 -> full ring. Sizes 2, 6, 9, 10 are exact; for 3, 4, 5, 7 and 8 the screen states that advice will be approximate and names the reference size used. Start game seats the user plus (size - 1) bots; heads-up rules come from E01-S09, the heads-up and full-ring charts from E07-S05.

## Requirements covered
- REQ-005 (Must): Choose game type and table size — The Game Config screen shall let the user choose the game type (Cash game or Sit-and-go) and the number of players from 2 to 10 including the user.
- REQ-015 (Must): Heads-up blinds and order — While exactly two players are dealt in, the engine shall make the button post the small blind and act first preflop and last on the flop, turn and river.

Covers: REQ-005, REQ-015

Plan key: E02-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given Game Config, When the players options are listed, Then they are exactly the integers 2 to 10 [REQ-005.2]
- [x] #2 Given Game Config, When the user selects 3, 4, 5 or 7 players, Then the screen states that advice will be approximate and names 6-max as the reference size [REQ-005.3, REQ-005.4]
- [x] #3 Given Game Config, When the user selects 8 players, Then the screen states that advice will be approximate and names full ring as the reference size [REQ-005.3, REQ-005.4]
- [x] #4 Given Game Config, When the user selects 2, 6, 9 or 10 players, Then no approximate-advice notice is shown [REQ-005.3, REQ-005.4]
- [x] #5 Given each size from 2 to 10 selected, When the user chooses Start game, Then the table seats the user and exactly size minus 1 bots and the header shows that number of players [REQ-005.2]
- [x] #6 Given 2 players selected on Game Config, When the first hand of the started session is dealt, Then the button posts the small blind and the other player the big blind [REQ-015.1]
- [x] #7 Given the player-count selector, When the user picks a table size, Then it writes SessionConfig.players and seats, replaces the read-only 'Players at the table' row, and the heads-up and full-ring size labels are either reachable and tested or removed
- [x] #8 Given table sizes 2-5 and 7-10, When position names are shown, Then they are confirmed against the requirements' naming (TASK-3.3 A-2 rule: Button, Small blind, Big blind, Cutoff, Hijack, Under the gun, Under the gun +1, ...) with a test per size
- [x] #9 Given a player count other than 6 is selectable, When a hand with user decisions ends, Then gradeView works at that table size (no positionOf throw) and review tests cover 2 and 10 players
- [x] #10 Given TABLE_SIZE_NAMES, When table sizes are offered, Then every entry is used by the size choice or removed (no unused names)
- [x] #11 Given a 2-player table, When the seats are labelled, Then the button seat shows 'Small blind' (button) and the other seat 'Big blind', matching the engine's heads-up blinds (src/table/table-view.ts positionName)
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
1. configForPlayers(n): seating for 2–10 (user seat min(5,n), TAG bots in BOT_NAMES order, button after the user); n=6 equals defaults.
2. Game Config 'Players at the table' select (TABLE_SIZE_NAMES labels) + approximate-advice note for 3/4/5/7/8 with aria-describedby.
3. Heads-up position labels (button 'Small blind', other 'Big blind').
4. Review/grade at 2 and 10 players; position names per size.
5. Five user-approved locked-test count edits; e2e players-choice spec (Chromium/WebKit, axe).

Full spec: doit/TASK-2.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-2.1 follow-up (doc-23).

AC added from TASK-3.3 follow-up (doc-24).

AC added from TASK-9.1 follow-up (doc-26).

AC added from TASK-2.18 follow-up (doc-50, TASK-2.1 review NIT).

AC added from TASK-1.11 follow-up (heads-up position labels)

Build: players select (2–10) + approximate-advice note, configForPlayers seating, heads-up labels; Q-5 locked count edits only; e2e 146 pass ×2; playtests 2/6/10 clean; gate PASS.

Review R1: 0 blocking; Q-5 locked edits verified count/selection-only; MINOR copied axe helper (5 copies) — not tracked (test-harness, no failure path); 2 NITs.

Judge R1 PASS 17/17 (242 browser checks on a production build, 0 failures; 18/19 mutants). J-1-01 MEDIUM (You row seat untested) fixed in-story with an e2e assertion that fails under the mutant; gate PASS. J-1-02 LOW: TASK-2.1 integrity counts one fewer expect in e2e/home.spec.ts from TASK-1.52 (import-line removal; not this task). Follow-up: AC on TASK-3.16 (10-seat layout).

Locked test tests/ui/game-config-players.acceptance.test.tsx edited for TASK-2.5 (Q-2 routine).

Locked test e2e/players-choice.spec.ts edited for TASK-2.5 (Q-2 routine).

Locked test tests/ui/game-config-players.acceptance.test.tsx edited for TASK-2.8 Q-2 (auto-accepted; row parsing/counts only).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Game Config now offers 2 to 10 players (labels heads-up / 6-max / full ring); 3/4/5/7 and 8 show an approximate-advice note; Start game seats the user plus size-1 bots; heads-up seat labels are Small blind (button) / Big blind. Verified: 676 unit tests, 146 e2e (Chromium+WebKit) x2, playtest 0 violations at 2/6/10, lint/typecheck/coverage 97.51%; review R1 had no blocking findings. Assumptions to review: A-1..A-5 and auto-accepted Q-1..Q-4 (sizes other than 6 seat all-TAG bots until TASK-2.5). Five locked tests edited with user approval (Q-5, dropdown counts only). Risks/follow-ups: 10 seats may look crowded until TASK-3.16; confirm TASK-2.5 covers presets at any size.
<!-- SECTION:FINAL_SUMMARY:END -->
