---
id: TASK-8.4
title: See approximate and short-stack labels on the hint card
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-8.1
  - TASK-7.16
  - TASK-7.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-8
priority: medium
type: feature
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the hint card to tell me when its advice is approximate or affected by a short stack, so that I know how far to trust the hint at unusual table sizes and stack depths.

The advice result carries an optional approximate label (E07-S16: table sizes 3, 4, 5, 7 -> 'approximate (based on 6-max)', 8 -> 'approximate (based on full ring)') and an optional short-stack note (E07-S17: sit-and-go with the user's stack under 10 big bets of the current level), both as fields separate from the explanation. The hint card shows each when present. Sit-and-go tables arrive with E05; this story can be tested with a sit-and-go table-state fixture.

## Requirements covered
- REQ-041 (Should): Approximate and short-stack labels — Where the table size is not a reference size, every hint and review entry shall carry the label "approximate"; where the user's stack in a sit-and-go is below 10 big bets, advice shall add a one-sentence short-stack note.

Covers: REQ-041

Plan key: E08-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a decision at a table of 3, 4, 5 or 7 players, When the user opens Hint, Then the card shows "approximate (based on 6-max)" [REQ-041.1]
- [ ] #2 Given a decision at a table of 8 players, When the user opens Hint, Then the card shows "approximate (based on full ring)" [REQ-041.1]
- [ ] #3 Given a decision at a table of 2, 6, 9 or 10 players, When the user opens Hint, Then the card shows no approximate label [REQ-041.1]
- [ ] #4 Given a sit-and-go decision with the user's stack at 9 big bets of the current level, When the user opens Hint, Then the card shows exactly one short-stack sentence apart from the explanation; and at 10 big bets no short-stack sentence is shown [REQ-041.2]
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
