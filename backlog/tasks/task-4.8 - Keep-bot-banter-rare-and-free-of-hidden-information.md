---
id: TASK-4.8
title: Keep bot banter rare and free of hidden information
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-4.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: low
type: feature
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want bot banter that never gives away hidden information, so that banter adds flavour without distracting me or misleading my reads.

Each bot speaks at most once per 10 hands. Banter never reveals hidden cards or the bot's strategy: lines contain no card names, hand names or strategy statements, and which line is chosen (and whether a bot speaks) never depends on hidden cards. Builds on E04-S07.

## Requirements covered
- REQ-071 (Could): Bot banter — Where banter is turned on in Settings, a bot shall occasionally show a short, original speech-bubble line matching its style after table events, at most once per 10 hands per bot.

Covers: REQ-071

## Notes
The hand-name ban is for the line text; a bubble after a showdown loss must not echo the shown hand either.

Plan key: E04-S08 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 1,000-hand seeded 6-max session with banter on, When bubbles are counted per bot, Then no bot shows more than one bubble in any 10 consecutive hands [REQ-071.4]
- [ ] #2 Given a bot spoke in hand 40 and a trigger event for it occurs in hand 45, When hand 45 ends, Then that bot shows no bubble [REQ-071.4]
- [ ] #3 Given the banter line files, When the content check runs, Then no line contains a card rank with suit, a hand name (such as "pair", "flush", "straight") or a statement of what the bot holds or will do, and a violating line fails the check naming the line [REQ-071.6]
- [ ] #4 Given the same seed and table events in two runs where only the bots' hidden hole cards differ, When banter is chosen, Then the same bots speak in the same hands with the same lines [REQ-071.6]
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
