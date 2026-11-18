---
id: TASK-1.16
title: Move the button and blinds past busted seats
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T17:24:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.11
  - TASK-1.9
  - TASK-1.10
  - TASK-1.14
  - TASK-1.15
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want positions to rotate after each hand to the next players who have chips, so that positions rotate correctly as players bust.

After each hand the button moves to the next seated player with chips and the next two such players post the blinds. Seats with no chips (busted in a sit-and-go) are skipped. No missed or dead blinds. When play becomes heads-up, heads-up rules apply from the next hand. A player who cannot cover a blind posts all their chips and is all-in. The playtest gains an interim `--game sng` mode: every seat starts with 1,500 chips (REQ-008.1) at fixed Level 1 limits 20/40 with blinds 10/20, busted seats are not refilled, and a new sit-and-go starts when one player holds all chips. E05 adds the rising level schedule to this same mode (it must not create a second sng mode). This story is the last of the M2 all-in rule stories (S12-S15 are its deps), so it also switches the cash playtest from the interim $160-per-hand reset to real stacks.

## Requirements covered
- REQ-018 (Must): All-in and side pots — When a player cannot match a bet, the engine shall let that player call all-in for the chips they have and shall create side pots so that each player can win only the amounts they matched.
- REQ-020 (Must): Button and blind movement — After each hand, the engine shall move the button to the next seated player who has chips, and the next two such players shall post the small and big blinds.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-018, REQ-020, REQ-056, REQ-062

## Notes
E05 adds the rising level schedule (REQ-008.2/008.3) to this playtest sng mode and owns sit-and-go coverage of the 1,000,000-hand run in M3.

Plan key: E01-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a 6-player hand ends with the button at seat 1 and all seats holding chips, When the next hand starts, Then the button is at seat 2 and seats 3 and 4 post the blinds [REQ-020.1]
- [ ] #2 Given seat 3 has no chips and the button is at seat 1, When the next hand starts, Then seat 3 is skipped: the button is at seat 2 and seats 4 and 5 post the blinds [REQ-020.1]
- [ ] #3 Given a player busted while due to post the big blind next hand, When the next hand starts, Then no player posts a missed or dead blind and only one small blind and one big blind are posted [REQ-020.2]
- [ ] #4 Given three players remain and one busts, When the next hand starts, Then the button posts the small blind and acts first preflop [REQ-020.3]
- [ ] #5 Given a player with $1 due to post the $2 small blind, When blinds are posted, Then that player posts $1 and is all-in [REQ-020.4]
- [ ] #6 Given `npm run playtest -- --hands 10000 --game sng --seed 42`, When it runs, Then every sit-and-go starts each seat with 1,500 chips at 20/40 limits, busted seats are never refilled and are skipped for button and blinds, a new sit-and-go starts when one player holds all chips, and zero invariant violations are reported [REQ-062.1, REQ-020.1]
- [ ] #7 Given `npm run playtest -- --hands 10000 --seed 42` (cash), When hands are played, Then every seat keeps its real stack between hands, only a busted seat is restored to the $160 buy-in, short-stack all-ins and side pots occur, and zero invariant violations are reported [REQ-056.1, REQ-018.5]
- [ ] #8 Given --game sng and --game cash with the same --seed, When both runs deal hand k, Then their replay codes differ in word 2 and are otherwise derived from seed and k
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
AC added from TASK-1.6 follow-up (doc-15): replay-code word 2 is reserved (0) for the game type.
<!-- SECTION:NOTES:END -->
