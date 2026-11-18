---
id: TASK-3.18
title: Play at Realistic bot pace
status: To Do
assignee: []
created_date: '2026-11-17T23:04:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.13
  - TASK-1.9
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bots to pause for a random, human-like time before acting, so that the table feels like a real game.

Realistic: each bot waits a random delay between 0.8 s and 3.0 s before acting (REQ-011.2); the delay is drawn independently for each bot action. The delay applies only before a bot's action: when the user is to act the action bar is enabled at once (REQ-024.4). Speed comes from the session configuration (choice E02-S11, Settings default E12). Builds on the pace mechanism of E03-S13.

## Requirements covered
- REQ-011 (Should): Speed choice — The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-011, REQ-024

Plan key: E03-S18 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Realistic speed in a timed session of 200 bot actions, When the gaps before each bot action are measured, Then every gap is between 0.8 s and 3.0 s [REQ-011.2]
- [ ] #2 Given Realistic speed and 200 measured bot-action gaps, When their distribution is checked, Then the gaps are not all equal, the shortest is under 1.2 s and the longest is over 2.6 s [REQ-011.2]
- [ ] #3 Given Realistic speed and a bot acts immediately before the user's turn, When the bot's action is displayed, Then the user's action bar is enabled within 100 ms with no 0.8-3.0 s delay [REQ-024.4]
- [ ] #4 Given Realistic speed and every other player still in the hand is all-in so only the user can act, When the previous action completes, Then the user's action bar is enabled within 100 ms with no bot delay [REQ-024.4]
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
