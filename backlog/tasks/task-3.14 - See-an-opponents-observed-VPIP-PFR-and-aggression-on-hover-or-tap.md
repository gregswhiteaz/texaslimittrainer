---
id: TASK-3.14
title: See an opponent's observed VPIP, PFR and aggression on hover or tap
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T17:47:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-3.3
  - TASK-3.9
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: medium
type: feature
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see a bot's observed style stats by hovering over or tapping its seat, so that I learn to read opponents from their numbers.

Stats panel per bot seat with VPIP %, PFR % and aggression % observed in the current session and "over N hands", computed with the shared style-stat functions (E07-S08) from this session's hand records (aggression is postflop-only, REQ-045.3). Below 10 observed hands each value shows "—" with the hand count. A replacement bot (E06-S08) starts from zero: stats are keyed by bot id, not seat. The panel closes when the pointer leaves the seat or the user taps elsewhere.

## Requirements covered
- REQ-031 (Should): Opponent stats on hover or tap — When the user hovers over or taps a bot's seat, the Table screen shall show that bot's VPIP, PFR and aggression as observed this session and the number of hands they are based on.

Covers: REQ-031

Plan key: E03-S15 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a scripted 20-hand session, When the user hovers over a bot's seat, Then the panel shows VPIP %, PFR % and aggression % equal to the values recomputed from the session's hand records and "over 20 hands" [REQ-031.1]
- [ ] #2 Given a bot observed for 9 hands, When the user taps its seat, Then each value shows "—" and the panel shows "over 9 hands" [REQ-031.2]
- [ ] #3 Given a bot observed for exactly 10 hands, When the user hovers over its seat, Then each value is shown as a percentage [REQ-031.2]
- [ ] #4 Given seat 3's bot busted after 25 hands and was replaced, When the user hovers over seat 3 in the next hand, Then the seat shows the new bot's name and $160 and the panel shows "—" values "over 0 hands" [REQ-031.3]
- [ ] #5 Given the stats panel is open from hovering, When the pointer leaves the seat, Then the panel closes [REQ-031.4]
- [ ] #6 Given the stats panel is open from tapping, When the user taps elsewhere on the screen, Then the panel closes [REQ-031.4]
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
From TASK-6.8 (D-7): bot identity is the never-reused display name (Ava…Ivy, then Jay…Zed, 'Jay 2'…); SessionSeat has no id field — add one only if this story needs more than the name.
<!-- SECTION:NOTES:END -->
