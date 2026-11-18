---
id: TASK-1.5
title: Give each deciding seat only its own view of the hand
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want opponents to decide using only what they could see at the table, so that bots never cheat by seeing my cards or the next card.

The engine passes any deciding code (bots, playtest seat policies, later the advice engine) a PlayerView: own hole cards, the board, all actions and stacks, the legal actions with exact amounts, and cards shown at earlier showdowns; never other players' hole cards or undealt cards. Separation is type-level: decision APIs accept only PlayerView.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.

Covers: REQ-025

## Notes
Hints and grades using the user's view (REQ-025.2/025.3) are E07.

Plan key: E01-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand in progress, When the engine asks a seat to act, Then it passes a PlayerView with that seat's hole cards, the board, all actions, all stacks and cards shown at earlier showdowns, and no other player's hole cards or undealt cards [REQ-025.1]
- [ ] #2 Given a fixed decision point, When the other players' hole cards and the undealt deck are changed, Then the PlayerView is deep-equal to the original and a seeded seat policy returns the same action [REQ-025.1]
- [ ] #3 Given decision code that is passed the full game state instead of a PlayerView, When `npm run typecheck` runs, Then it reports a type error [REQ-025.1]
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
