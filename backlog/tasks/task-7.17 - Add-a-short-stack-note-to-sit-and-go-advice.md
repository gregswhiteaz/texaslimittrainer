---
id: TASK-7.17
title: Add a short-stack note to sit-and-go advice
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T19:10:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-7.3
  - TASK-7.2
  - TASK-7.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: medium
type: feature
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a one-sentence short-stack note when my tournament stack is under 10 big bets, so that I remember that a short stack changes how many bets I can still make.

In a sit-and-go, when the user's stack is under 10 big bets of the current level, every hint and review entry adds one short-stack sentence (a field separate from the three-sentence explanation). Tournament-specific strategy (ICM, bubble play) is not applied: the recommendation itself is the cash-style one.

## Requirements covered
- REQ-041 (Should): Approximate and short-stack labels — Where the table size is not a reference size, every hint and review entry shall carry the label "approximate"; where the user's stack in a sit-and-go is below 10 big bets, advice shall add a one-sentence short-stack note.

Covers: REQ-041

## Notes
PlayerView must expose game type and the current level's big bet; E05 provides the SNG level schedule.

Plan key: E07-S17 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a sit-and-go decision with the user's stack at 9 big bets of the current level, When advice is requested, Then the result includes exactly one short-stack sentence [REQ-041.2]
- [ ] #2 Given a sit-and-go decision with the user's stack at 10 big bets of the current level, When advice is requested, Then no short-stack note is included [REQ-041.2]
- [ ] #3 Given a cash-game decision with the user's stack at 5 big bets, When advice is requested, Then no short-stack note is included [REQ-041.2]
- [ ] #4 Given identical sit-and-go and cash-game PlayerViews apart from game type, When advice is requested, Then the recommended action and numbers are identical [REQ-041.3]
- [ ] #5 Given a sit-and-go preflop decision with the user's stack at 9 big bets of the current level, When advice is requested, Then the chart recommendation includes exactly one short-stack sentence [REQ-041.2]
- [ ] #6 Given a sit-and-go decision at 9 big bets of the current level that the user answered, When the grade result for the review entry is produced, Then it carries the same short-stack sentence as the recommendation [REQ-041.2]
- [ ] #7 Given a preflop decision where the hero cannot afford a full call or raise, When recommendPreflop is asked, Then it returns a legal all-in action and does not throw
- [ ] #8 Given a postflop decision with a short all-in call or side pots, When recommendPostflop computes pot odds, Then the call amount and pot reflect only what the hero can win and must pay
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
AC added from TASK-7.2 follow-up (doc-14); depends on short all-ins from TASK-1.9.

AC added from TASK-7.3 follow-up (doc-17).
<!-- SECTION:NOTES:END -->
