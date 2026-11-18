---
id: TASK-4.7
title: Recognise each bot by an initials avatar badge
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.3
  - TASK-6.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: low
type: feature
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to see an avatar badge with each bot's initials on a seat colour, so that I can tell the bots apart at a glance.

Each bot seat shows an avatar badge drawn in code: the first two letters of the bot's display name (unique names from E06-S06) on a colour assigned to its seat. Badge text must meet 4.5:1 contrast against the badge colour. When a busted bot is replaced (E06-S08, REQ-007.5), the seat's badge shows the new bot's initials.

## Requirements covered
- REQ-070 (Could): Bot avatars — Each bot seat shall show an avatar badge drawn in code containing the bot's initials on a colour assigned to its seat.

Covers: REQ-070

## Notes
Seat colour palette should come from theme tokens; keep it seat-indexed so a replacement bot keeps the seat colour.

Plan key: E04-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-max table with bots named Ava, Ben, Cal, Dee and Eli, When the table is shown, Then their badges read "Av", "Be", "Ca", "De" and "El" [REQ-070.1]
- [ ] #2 Given every name in the bot name list, When its badge is rendered, Then the badge text equals the first two letters of the name [REQ-070.1]
- [ ] #3 Given tables of 2 to 10 seats, When each seat's badge colour and text colour are checked, Then the contrast ratio is at least 4.5:1 for every seat and axe reports no colour-contrast violation [REQ-070.2]
- [ ] #4 Given seat 3's bot Cal busts and is replaced by a new bot named Gus, When the next hand is dealt, Then seat 3's badge reads "Gu" [REQ-070.3]
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
