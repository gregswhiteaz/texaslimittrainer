---
id: TASK-12.8
title: Turn bot banter off
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.1
  - TASK-4.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: low
type: feature
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to turn bot banter off, so that I can play without speech bubbles when I want to concentrate.

Settings toggle 'Bot banter', default on. When off, no bot shows a speech bubble (banter from E04-S07/S08). Saved at once, kept across launches; a mid-session change applies from the next table event. Banter choice uses its own seeded generator, so turning banter off never changes bot decisions.

## Requirements covered
- REQ-071 (Could): Bot banter — Where banter is turned on in Settings, a bot shall occasionally show a short, original speech-bubble line matching its style after table events, at most once per 10 hands per bot.

Covers: REQ-071

Plan key: E12-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the Settings screen is shown, Then it has a 'Bot banter' toggle that is on [REQ-071.5]
- [ ] #2 Given 'Bot banter' is off, When a 1,000-hand seeded 6-max Mixed session is played, Then zero speech bubbles are shown [REQ-071.5]
- [ ] #3 Given the same seed played once with banter on and once with banter off, When the two hand histories are compared, Then every bot action is identical [REQ-071.5]
- [ ] #4 Given 'Bot banter' was turned off, When the app is closed and relaunched, Then the toggle is still off [REQ-071.5]
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
