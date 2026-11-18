---
id: TASK-5.10
title: Prove the sit-and-go structure over the 1,000,000-hand invariant run
status: To Do
assignee: []
created_date: '2026-11-17T23:04:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.4
  - TASK-5.2
  - TASK-6.9
  - TASK-1.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
parent_task_id: TASK-5
priority: high
type: feature
ordinal: 144000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the 1,000,000-hand invariant run to cover real sit-and-gos with every line-up and table size, so that I can trust tournament play as much as cash play.

E01-S17 and E06-S11 prove the engine over 1,000,000 hands for cash games at M2. This story extends the same nightly/on-demand run to sit-and-gos with the real structure (1,500 starting chips, the E05-S02 level schedule, empty seats never refilled per E05-S04): Mixed, Tough and Soft line-ups at every table size 2-10. The run prints hand counts per game type, line-up and size; any invariant violation (REQ-056.1) fails it and prints the replay code.

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.

Covers: REQ-008, REQ-056

## Notes
Reuse the E01-S17 CI job; only the game-type mix and sng structure change.

Plan key: E05-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given the nightly or on-demand 1,000,000-hand run, When it completes, Then it has played sit-and-go hands with Mixed, Tough and Soft line-ups at every table size from 2 to 10 alongside the cash hands, prints the hand count per game type, line-up and size, reports zero invariant violations and exits 0 [REQ-056.2]
- [ ] #2 Given the sit-and-go part of that run, When its sit-and-gos are checked, Then each started with 1,500 chips per player, used the level for its hand number, never seated a bot after its first hand and ended when one player held all the chips [REQ-056.2, REQ-008.1, REQ-008.3, REQ-008.4]
- [ ] #3 Given an invariant violation is injected into a sit-and-go hand of the run, When the run reaches it, Then the run fails and prints the replay code and action history of that hand [REQ-056.2]
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
