---
id: TASK-3.13
title: Play at Rapid bot pace
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T20:26:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-3.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want bots to act at Rapid pace, so that I can practise many hands per hour.

Moved to M2 by Q-99 so G-5 is testable early. Rapid: each bot action is displayed within 300 ms of the previous action. In M2 every session plays at Rapid (the speed choice is E02-S11, the Settings default E12, Realistic pace E03-S18, in-session change E03-S14, all M3). G-5 fit (REQ-024 fit criterion): at Rapid with the review panel not opening and the user folding every hand, 200 hands complete in under 60 minutes.

## Requirements covered
- REQ-011 (Should): Speed choice — The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-011, REQ-024

Plan key: E03-S13 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given Rapid speed in a timed 6-max session, When consecutive bot actions are measured, Then each bot action is displayed within 300 ms of the previous action [REQ-011.1]
- [ ] #2 Given Rapid speed at a 10-player table where the user folds preflop, When the remaining nine players' actions are measured, Then no bot action is displayed later than 300 ms after the previous action [REQ-011.1]
- [ ] #3 Given Rapid speed, the Hand Review panel not opening and a scripted user folding every hand, When an automated run plays 200 hands, Then they complete in under 60 minutes [REQ-024.6]
- [ ] #4 Given Rapid pace, When bots act in sequence, Then a test fails if any bot action is delayed by an artificial wait (e.g. 400 ms) rather than acting on the next scheduler tick
- [ ] #5 Given the pace check, When hands per hour are measured, Then the 1.5 s between-hands delay (fixed for every speed, TASK-3.4 D-6) is included
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Name the Rapid bot delay (RAPID_BOT_DELAY_MS = 0, botActionDelayMs) and use it in useTableSession (no timing change).
2. Every push: unit check (0 ms), paused-fake-clock e2e guard that fails on an artificial wait (self-test with a 400 ms wait), 200-hand model of scheduled waits (exactly 300,000 ms; worst case ≥200 hands/hour).
3. Opt-in (npm run e2e:slow): real-time 300 ms per bot action at 6-max and 10 players; 200 real hands under 60 minutes.
4. README pace note.

Full spec: doit/TASK-3.13/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.4 follow-up (doc-25).

Autopilot: no asks. Timing checks opt-in per the user's standing rule.
<!-- SECTION:NOTES:END -->
