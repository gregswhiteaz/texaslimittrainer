---
id: TASK-1.15
title: Show and muck cards at showdown in casino order
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.8
  - TASK-1.10
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want showdown hands revealed in casino order with losing bots mucking, so that I see only the information a real table would show.

The last player to bet or raise on the river shows first; if nobody bet on the river, the first active player left of the button shows first. Each later bot shows only if its hand beats or ties the best hand shown so far; otherwise it mucks and its cards stay hidden (Q-33). Mucked cards never appear in later PlayerViews. With side pots, showdown is resolved pot by pot from the last side pot created to the main pot; for each pot a bot shows if it can win that pot, and mucking in one pot never forfeits another pot it can win (REQ-019.8).

## Requirements covered
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.

Covers: REQ-019, REQ-025

Plan key: E01-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given river betting where seat 5 made the last bet or raise, When showdown begins, Then seat 5 shows first [REQ-019.4]
- [ ] #2 Given a river checked through by all players, When showdown begins, Then the first active player left of the button shows first [REQ-019.4]
- [ ] #3 Given a bot later in showdown order whose hand beats or ties the best hand shown so far, When it is its turn, Then it shows its cards [REQ-019.5]
- [ ] #4 Given a bot later in showdown order whose hand loses to the best hand shown so far, When it is its turn, Then it mucks and its hole cards are absent from the hand result and from every later PlayerView [REQ-019.5, REQ-025.1]
- [ ] #5 Given a main pot and one side pot, When showdown is resolved, Then the side pot is resolved and awarded first and the main pot last, each only among its eligible players [REQ-019.8]
- [ ] #6 Given seat 3 (all-in, eligible only for the main pot) shows the best hand and seat 5's bot hand loses to seat 3 but beats every other side-pot contender, When showdown is resolved, Then seat 5 shows for and wins the side pot, mucks for the main pot, and seat 3 wins the main pot [REQ-019.8, REQ-019.5]
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
