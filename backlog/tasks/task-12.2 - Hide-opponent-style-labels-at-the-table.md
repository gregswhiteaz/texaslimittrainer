---
id: TASK-12.2
title: Hide opponent style labels at the table
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-12.1
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: high
type: feature
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to turn off the opponent style labels at the table, so that I can practise reading opponents from their play instead of their label.

Settings toggle 'Show opponent styles at the table', default on. When off, the style label (e.g. 'Calling station') is not shown on any bot seat at the table (seat fields from E03-S03); names, stacks and everything else stay. The value is saved to the settings store at once and kept across launches. A change made mid-session (via the Settings overlay, E12-S03) applies from the next screen update. Style labels outside the table (Game Config line-up, Session Report, Statistics) are not affected by this toggle.

## Requirements covered
- REQ-021 (Must): Table display — The Table screen shall show, for every seat, the player name, style label (unless hidden in Settings), stack, chips put in on the current street, last action and whether the player still holds cards, together with the board, the pot total, the dealer button and which player is to act.
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.

Covers: REQ-021, REQ-050

## Notes
If the opponent-stats hover panel (E03-S15) shows a style label, it follows this toggle too.

Plan key: E12-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the Settings screen is shown, Then 'Show opponent styles at the table' is on [REQ-050.3]
- [ ] #2 Given 'Show opponent styles' is off and a 6-max table with bots Ben (Calling station) and Ava (TAG), When the table is shown, Then no seat shows a style label and Ben's seat still shows his name and stack [REQ-021.2, REQ-050.3]
- [ ] #3 Given 'Show opponent styles' is on, When the table is shown, Then every bot seat shows its style label [REQ-050.3]
- [ ] #4 Given the user turned 'Show opponent styles' off, When the app is closed, relaunched and a table is opened, Then the toggle is still off and no style labels are shown [REQ-050.3, REQ-021.2]
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
