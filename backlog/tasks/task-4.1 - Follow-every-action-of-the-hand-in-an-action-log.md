---
id: TASK-4.1
title: Follow every action of the hand in an action log
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: medium
type: feature
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to read every action of the current hand in order in an action log, so that I can follow who bet what even when bots act at Rapid speed.

Action log panel on the Table screen (storyboard Table, right-hand panel). Lists every action of the current hand in order: each entry names the player, the action and the amount (e.g. "Ben bets $4", "Ava posts small blind $2", "You raise to $8"; folds and checks have no amount). Street changes appear as their own entries with the new board cards and the pot (e.g. "Flop: K♠ 9♦ 4♣ (pot $26)", likewise Turn and River). The log is cleared when a new hand starts. Entries are built from the same engine events that drive the table (E03-S03), so they show only public information. Collapse/expand and its persistence are E04-S02.

## Requirements covered
- REQ-023 (Should): Action log — The Table screen shall show an action log listing every action of the current hand in order, which the user can collapse and expand.

Covers: REQ-023

## Notes
Keep entry formatting in a pure function over engine events so it can be unit tested headlessly. Money formatting follows E03-S16 ($1,240); in a sit-and-go (E05) amounts are chip numbers without $, like the action bar. No-leak note (not a REQ-023 check): entries are built only from public engine events, so folded or mucked hole cards (REQ-019.5, owned by E01-S15) never appear in the log; keep a regression test for this in the formatter's unit tests.

Plan key: E04-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the scripted 6-max $4/$8 hand #133 of the Table storyboard up to Ben's flop bet, When the action log is read, Then its entries in order are "Ava posts small blind $2", "Ben posts big blind $4", "Cal folds", "Dee folds", "You raise to $8", "Eli calls $8", "Ava folds", "Ben calls $4", "Flop: K♠ 9♦ 4♣ (pot $26)", "Ben bets $4" [REQ-023.1, REQ-023.2]
- [ ] #2 Given a scripted hand containing a check, a bet, a call, a raise, a fold and a call all-in, When each action is taken, Then a log entry naming that player and that action is appended, and every bet, call, raise and all-in entry shows its exact dollar amount [REQ-023.1]
- [ ] #3 Given a scripted hand that reaches the river, When the flop, turn and river are dealt, Then the log shows a Flop entry with the 3 flop cards, a Turn entry with the turn card and a River entry with the river card, each with the pot total at that moment, placed between the last action of the previous street and the first action of the new street [REQ-023.2]
- [ ] #4 Given 1,000 seeded table hands at Rapid speed, When each hand ends, Then the log entries equal the engine's action history for that hand in order and amount, with one street entry per dealt street [REQ-023.1, REQ-023.2]
- [ ] #5 Given the log holds the entries of hand 133, When hand 134 starts, Then the log holds no entry from hand 133 and its first entries are hand 134's blind posts [REQ-023.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #8 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #11 Story documentation is written and published to Backlog.md
- [ ] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
