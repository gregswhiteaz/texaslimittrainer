---
id: TASK-12.7
title: Switch to a four-colour deck
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-18T20:51:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.3
  - TASK-3.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to switch the cards to a four-colour deck, so that I can tell suits apart at a glance when reading flushes.

Settings 'Deck colours': Two-colour (default) or Four-colour (storyboard shows it as a choice between the two). Four-colour: clubs green, diamonds blue, hearts red, spades black; two-colour: hearts and diamonds red, spades and clubs black. E03-S05 already renders both modes; this story wires the setting to every place cards are drawn (table and Hand Review panel). Saved at once, kept across launches; a mid-session change applies from the next screen update.

## Requirements covered
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.

Covers: REQ-050

Plan key: E12-S06 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the Settings screen is shown, Then the four-colour deck is off (Two-colour selected) [REQ-050.4]
- [ ] #2 Given the user turned the four-colour deck on, When the table and the Hand Review panel show a club and a diamond, Then the club is green and the diamond is blue [REQ-050.4]
- [ ] #3 Given the four-colour deck is on, When the app is closed and relaunched, Then the setting is still on and cards are drawn in four colours [REQ-050.4]
- [ ] #4 Given the four-colour deck is off and the overlay is opened during a hand, When the user turns it on and closes the overlay, Then the user's hole cards and board are redrawn in four colours in the same hand [REQ-050.4, REQ-050.5]
- [ ] #5 Given the Deck colours setting is changed, When cards render anywhere in the app, Then DeckColoursContext at the app root provides the saved choice to every PlayingCard
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.5 follow-up (doc-20).
<!-- SECTION:NOTES:END -->
