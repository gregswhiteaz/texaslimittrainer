---
id: TASK-5.4
title: Raise the sit-and-go limits every 10 hands on the published schedule
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T09:25:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-5.1
  - TASK-7.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-5
priority: medium
type: feature
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the limits to rise every 10 hands on a fixed schedule, so that the pressure grows as in a real sit-and-go and the game reaches an end.

Schedule (small bet/big bet; blinds = half small bet / small bet): L1 20/40 (10/20), L2 30/60 (15/30), L3 40/80 (20/40), L4 60/120 (30/60), L5 100/200 (50/100), L6 150/300 (75/150), L7 200/400 (100/200), L8 300/600 (150/300), L9 400/800 (200/400), L10 600/1,200 (300/600). Level L covers hands 10L-9 to 10L; from hand 91 onward the limits stay at L10. Only dealt hands that completed count (a hand abandoned by closing the app is not counted, REQ-004.6). The level is part of the PlayerView (bet sizes, short-stack note via E07-S17) and is stored as the 'stake or level' of each hand record (REQ-052.2) and in the session state (E03-S11).

## Requirements covered
- REQ-008 (Should): Sit-and-go structure — In a sit-and-go, every player shall start with 1,500 chips, the limits shall rise every 10 hands following the published schedule, and the sit-and-go shall end when one player holds all chips.
- REQ-041 (Should): Approximate and short-stack labels — Where the table size is not a reference size, every hint and review entry shall carry the label "approximate"; where the user's stack in a sit-and-go is below 10 big bets, advice shall add a one-sentence short-stack note.

Covers: REQ-008, REQ-041

## Notes
Keep the schedule as data shipped with the app. Banter (E04-S07) must judge 'pot of 10 big bets or more' with the current level's big bet.

Plan key: E05-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a seeded sit-and-go that lasts 100 hands, When the hands are dealt, Then hands 1-10, 11-20, 21-30, 31-40, 41-50, 51-60, 61-70, 71-80, 81-90 and 91-100 use limits 20/40, 30/60, 40/80, 60/120, 100/200, 150/300, 200/400, 300/600, 400/800 and 600/1,200 respectively with blinds of half the small bet and the small bet [REQ-008.2, REQ-008.3]
- [ ] #2 Given hand 10 at level 1 has completed, When hand 11 is dealt, Then its blinds are 15 and 30 and a bet on the turn is 60 [REQ-008.3]
- [ ] #3 Given a sit-and-go reaches hands 101 and 150, When they are dealt, Then both use limits 600/1,200 with blinds 300 and 600 [REQ-008.2]
- [ ] #4 Given a sit-and-go hand at level 3, When its stored hand record is read, Then its stake-or-level field holds level 3 with limits 40/80 [REQ-008.2]
- [ ] #5 Given a sit-and-go at level 3 where the user has 790 chips (under 10 big bets of 80), When advice is requested for the user's decision, Then it includes the short-stack note; and Given the same stack of 790 at level 2 (big bet 60), Then no short-stack note is included [REQ-041.2]
- [ ] #6 Given `npm run playtest -- --game sng --size 9 --hands 10000 --seed 7`, When it runs, Then every hand's blinds and bet sizes match the level for its hand number and zero invariant violations are reported [REQ-008.2, REQ-008.3]
- [ ] #7 Given the sit-and-go playtest, When it runs, Then a test pins coverage of more than one completed sit-and-go (another seed or smaller --size), since seed 42 at 10,000 hands completes only one (TASK-1.16 Q-6)
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
AC added from TASK-1.16 follow-up (multi-restart sng coverage)
<!-- SECTION:NOTES:END -->
