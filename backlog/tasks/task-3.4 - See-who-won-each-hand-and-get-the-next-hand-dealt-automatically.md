---
id: TASK-3.4
title: See who won each hand and get the next hand dealt automatically
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-19T00:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see the result of each hand before the next one is dealt, so that I know how every hand ended and keep practising without extra clicks.

When a hand ends the table shows each winner with the pot amount won and, when there was a showdown, the winning hand's name (e.g. "Pair of kings"). A pot won uncontested shows the winner and amount but no hand name. A split pot shows each winner with their share. While the Hand Review panel is not open (it does not exist until E09; later: the user folded preflop or auto-open is off), the next hand is dealt 1.5 s after the result is shown. E09 adds REQ-024.2 (wait for Deal next hand while the panel is open).

## Requirements covered
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-019, REQ-024

## Notes
E09 must stop the automatic deal while its panel is open (REQ-024.2) by gating the same next-hand timer.

Plan key: E03-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a hand that reaches showdown where Ben wins $122 with a pair of kings, When the hand ends, Then the result shows "Ben", "$122" and "Pair of kings" [REQ-024.1, REQ-019.7]
- [ ] #2 Given a hand in which every other player folds to Ava's bet, When the hand ends, Then the result shows Ava and the amount won, and no hand name and no hole cards of Ava [REQ-024.1]
- [ ] #3 Given a showdown where two players tie with a straight for a $60 pot, When the hand ends, Then the result shows both winners with $30 each and "Straight" [REQ-024.1, REQ-019.7]
- [ ] #4 Given the Hand Review panel is not open, When the result is shown, Then the next hand is dealt 1.5 s after the result appears (measured within 1.4-1.6 s) with no user input [REQ-024.3]
- [ ] #5 Given a hand has ended and the next hand is dealt, When stacks carry over, Then the dealer button moves one seat, each seat starts with its final stack from the previous hand, and a seat below the engine's minimum stack is handled by a defined rule (rebuy prompt, bot replacement, or a relaxed createHand minimum) instead of a RangeError
- [ ] #6 Given completedHand in src/table/session.ts, When the hand-over flow is extended, Then its unreachable fallbacks (the '?? 0' and the 'User seat is not dealt in' throw) are removed or covered by a test
- [ ] #7 Given the next hand is dealt, When the header is shown, Then TableState.handNumber has increased by one (Hand #2, #3, ...), the pot line shows the decided value after the award, and the unreachable '?? 0' stack fallback in src/table/table-view.ts is removed or covered
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
AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.3 follow-up (doc-24).
<!-- SECTION:NOTES:END -->
