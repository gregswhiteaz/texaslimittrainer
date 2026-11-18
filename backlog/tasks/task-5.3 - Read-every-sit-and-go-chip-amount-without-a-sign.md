---
id: TASK-5.3
title: Read every sit-and-go chip amount without a $ sign
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.1
  - TASK-4.1
  - TASK-4.5
  - TASK-8.1
  - TASK-9.3
  - TASK-5.7
  - TASK-10.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want sit-and-go chip amounts shown as plain numbers, so that tournament chips are never mistaken for cash.

In a sit-and-go every chip amount is a plain number with a thousands separator and no $ sign: seat stacks and street amounts, last action, pot and side pots, header limits, action bar (already done in E03-S06), action log (E04-S01), bet chips in front of seats (E04-S04), hint card (E08-S01) and Hand Review entries (E09-S02) including pot-odds wording. Cash games keep the $ formatting. Use one formatter keyed on game type.

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.

Covers: REQ-008

## Notes
Chip formatting helper from E03-S06 should become the single game-type-aware formatter.

Plan key: E05-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a sit-and-go flop where bot Ben has 1,460 chips and bet 40, When the Table is shown, Then Ben's seat shows '1,460', '40' and last action 'Bet 40' and the pot shows a plain number, with no $ sign [REQ-008.7]
- [ ] #2 Given a sit-and-go hand, When the action log is read, Then blinds, bets, calls and raises read as plain numbers such as 'posts small blind 10' and 'bets 40' with no $ sign [REQ-008.7]
- [ ] #3 Given a sit-and-go hand with bets on the current street, When the bet chips in front of seats are shown, Then their amounts are plain numbers with no $ sign [REQ-008.7]
- [ ] #4 Given a sit-and-go decision, When the hint card and the Hand Review entry for it are shown, Then every amount in them, including the pot-odds wording, is a plain number with no $ sign [REQ-008.7]
- [ ] #5 Given a seeded 50-hand sit-and-go, When the text of the Table, hint card, Hand Review panel and Session Report is collected after every action, Then no '$' character appears anywhere [REQ-008.7]
- [ ] #6 Given a $4/$8 cash game, When the same table elements are shown, Then amounts keep the $ sign, such as '$146' and 'Bet $4' [REQ-008.7]
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
