---
id: TASK-12.6
title: Turn off automatic opening of the Hand Review panel
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-24T16:27:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-12.3
  - TASK-9.7
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-12
priority: medium
type: feature
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to stop the Hand Review panel opening after every hand, so that I can play hands back to back and review only when I choose.

Settings toggle 'Open the hand review panel after every hand', default on. Wires the setting that E09-S07 reads: when off, the panel does not open by itself and the grade summary badge appears instead (badge behaviour is E09-S07). Saved at once and kept across launches. A change made mid-session via the overlay applies from the next hand end.

## Requirements covered
- REQ-050 (Should): Settings options — The Settings screen shall offer default speed, auto-open Hand Review, show opponent styles and four-colour deck, and each change shall take effect immediately and persist across launches.

Covers: REQ-050

Plan key: E12-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a fresh install, When the Settings screen is shown, Then 'Open the hand review panel after every hand' is on [REQ-050.2]
- [ ] #2 Given the user turned auto-open off in Settings, When a hand in which the user made a decision other than folding preflop ends, Then the Hand Review panel does not open and the grade summary badge is shown [REQ-050.2]
- [ ] #3 Given auto-open is off, When the app is closed and relaunched, Then the toggle is still off [REQ-050.2]
- [ ] #4 Given auto-open is on and the overlay is opened during a hand, When the user turns it off, closes the overlay and the hand ends, Then the panel does not open for that hand [REQ-050.2, REQ-050.5]
- [ ] #5 Given auto-open is off and the user clicks the grade badge just as the next hand's auto-deal renders, When the next hand starts, Then no review from an earlier hand is held (a held review whose hand number differs from the table's is dropped) and the next hand is not stalled
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
AC added from TASK-9.7 follow-up (code review MINOR badge-click-races-auto-deal-render / judge J-1-02, doc-121): when the hand number changes, setReview(r => r && r.hand.handNumber !== table.handNumber ? null : r).
<!-- SECTION:NOTES:END -->
