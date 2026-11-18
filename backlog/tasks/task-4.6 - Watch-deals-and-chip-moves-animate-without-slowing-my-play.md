---
id: TASK-4.6
title: Watch deals and chip moves animate without slowing my play
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-4.5
  - TASK-3.13
  - TASK-3.18
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-4
priority: medium
type: feature
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a player, I want to see table changes animate within my speed setting's time limit, so that the table feels alive while I still play 200+ hands an hour.

Animated events: dealing cards (hole cards and board), bet chips to the pot at street end, pot to the winner at hand end (state changes from E04-S04). Each animation lasts at most 250 ms at Rapid and at most 600 ms at Realistic (speed from the session, E03-S13/E03-S14). With the operating system's reduce-motion setting on, changes appear without animation. Animations never delay the action bar becoming enabled by more than the animation's own duration. Protects G-5.

## Requirements covered
- REQ-011 (Should): Speed choice — The Game Config screen shall let the user choose Rapid or Realistic speed, defaulting to the speed set in Settings.
- REQ-069 (Should): Speed-aware animation — TLH Trainer shall animate dealing, chips to the pot and the pot to the winner for at most 250 ms per animation at Rapid speed and at most 600 ms at Realistic speed, and shall show no motion when the operating system's reduce-motion setting is on.

Covers: REQ-011, REQ-069

## Notes
Use the Web Animations API or CSS transitions with durations taken from a single speed-to-duration map; read prefers-reduced-motion with matchMedia and react to changes.

Plan key: E04-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given reduce-motion is off, When cards are dealt, bet chips move to the pot at the end of a street and the pot moves to the winner, Then each of the three events runs an animation [REQ-069.1]
- [ ] #2 Given Rapid speed, When each animation of dealing, chips to the pot and pot to the winner is timed in Chromium and WebKit, Then each lasts at most 250 ms [REQ-069.2]
- [ ] #3 Given Realistic speed, When each animation of dealing, chips to the pot and pot to the winner is timed in Chromium and WebKit, Then each lasts at most 600 ms [REQ-069.2]
- [ ] #4 Given the speed is changed from Rapid to Realistic during a session, When the next deal is animated, Then it uses the Realistic limit of at most 600 ms [REQ-069.2]
- [ ] #5 Given the browser emulates prefers-reduced-motion: reduce, When a hand is dealt, a street ends and the hand ends, Then no CSS transition or animation runs and each change is shown in its final state in the next frame [REQ-069.3]
- [ ] #6 Given Rapid speed and the user is first to act on the flop, When the flop is dealt, Then the action bar is enabled no more than 250 ms after the flop deal starts; and at Realistic no more than 600 ms after [REQ-069.4]
- [ ] #7 Given an animation is running when the user's turn begins, When the bar becomes enabled, Then the delay caused by the animation is at most that animation's measured duration [REQ-069.4]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 With animations on at Rapid, E03-S13's bot-pacing check still passes: each bot action is displayed within 300 ms of the previous action [REQ-011.1]
- [ ] #2 With animations on at Rapid, the Hand Review panel not opening and the user folding every hand, 200 hands complete in under 60 minutes (REQ-024 fit criterion)
- [ ] #3 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #4 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #5 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #6 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #7 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #8 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #9 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #10 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #11 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #12 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #13 Story documentation is written and published to Backlog.md
- [ ] #14 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->
