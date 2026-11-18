---
id: TASK-6.14
title: Keep each bot's style fixed whatever the user does
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-6.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: medium
type: feature
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bots whose style parameters never change in response to my play, so that I can practise exploiting a predictable opponent.

Style parameters are loaded from the style data files at session start and are immutable for the session. No bot code path reads the user's actions or statistics to change parameters. Fit: two playtests with different user strategies and the same seeds give each bot identical parameters.

## Requirements covered
- REQ-029 (Should): Fixed styles (no adaptation) — A bot shall keep the same style parameters for the whole session regardless of how the user plays.

Covers: REQ-029

## Notes
Suggested mechanism: freeze style parameters at session start. REQ-029.2 (bots use the typical-player basis only) is enforced from M2 in E06-S02.

Plan key: E06-S13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given two 6-max Mixed playtests with the same seed where seat 1 always calls in one and always folds or checks in the other, When every hand ends, Then each bot's style parameters are identical in both runs and equal to its style file [REQ-029.1]
- [ ] #2 Given a bot decision point (view, replay code and seat) evaluated at hand 1 of a session, When the same decision point is evaluated after 5,000 hands in which the user raised at every opportunity, Then the bot's action is identical [REQ-029.1]
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
