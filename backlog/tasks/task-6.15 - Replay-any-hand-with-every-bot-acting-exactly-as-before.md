---
id: TASK-6.15
title: Replay any hand with every bot acting exactly as before
status: To Do
assignee: []
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-22T18:28:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a replayed hand to reproduce every bot action exactly, so that I can revisit any hand and see the opponents play it the same way.

Replaying a hand with the same replay code and the same user actions reproduces every bot action, for every style, because each bot's randomness comes only from a generator seeded from the replay code and its seat (E06-S02). In the playtest seat 1 follows a scripted user policy and its recorded actions are fed back on replay.

## Requirements covered
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.

Covers: REQ-028

Plan key: E06-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 1,000 recorded hands from a 6-max TAG playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action matches in order and amount [REQ-028.2]
- [ ] #2 Given 1,000 recorded hands from a 6-max Mixed playtest in which seat 1 follows a scripted user policy, When each hand is replayed with its replay code and seat 1's recorded actions, Then every bot action of every style matches in order and amount [REQ-028.2]
- [ ] #3 Given a recorded hand, When it is replayed with the same replay code but a different user action at the first decision, Then the replay still deals the same cards and every bot decision point reached identically before that action matches the original [REQ-028.1, REQ-028.2]
- [ ] #4 Given a hand played in the app or replayed with --replay-code, When bots decide, Then they receive the same earlier-showdowns list they had when the hand was first played (the app session passes earlier showdowns like the playtest runner does since TASK-6.9)
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
AC added from TASK-6.9 follow-up (app session and replay pass no earlier showdowns)
<!-- SECTION:NOTES:END -->
