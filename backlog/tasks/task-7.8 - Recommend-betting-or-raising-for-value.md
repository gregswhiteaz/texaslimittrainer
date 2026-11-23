---
id: TASK-7.8
title: Recommend betting or raising for value
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T03:45:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a recommendation to bet or raise when my hand is ahead of the hands that would call, so that I learn to win more with strong hands.

Value rule: bet (no bet faced) or raise (facing a bet, street not capped) when equity against the range that would call exceeds 50%. The range that would call is derived from the opponent's current estimated range (E07-S07) with the same narrowing rule: the combos the opponent would continue with against the bet or raise, i.e. those kept by the call or raise rule (Strong, Pair and Draw; Air removed). With several opponents, equity is computed against each opponent's calling range. Returns equity against the calling range and the rule id. The rule and the worked example are added to the postflop design document with a unit test.

## Requirements covered
- REQ-033 (Must): Postflop recommendation method — For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.

Covers: REQ-033

## Notes
Equities in AC2/AC3 are exact flop enumerations, each combo weighted equally. Bluffing is not a recommendation rule in the requirements; 'bluff' appears only as an explanation concept.

Plan key: E07-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given an opponent whose estimated range is {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c and hero first to act, When the range that would call a bet is derived, Then it is the 6 combos {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} [REQ-033.2, REQ-033.6]
- [ ] #2 Given that decision with hero holding 8s8c, When advice is requested, Then equity against the calling range is 72.8% and advice recommends bet with the value-bet rule id [REQ-033.2]
- [ ] #3 Given that decision with hero holding AsKc, When advice is requested, Then equity against the calling range is 48.9% (60.7% against the whole range) and advice does not recommend a value bet [REQ-033.2]
- [ ] #4 Given a postflop decision with no bet faced, When equity against the range that would call a bet is 50.1%, Then advice recommends bet with the value-bet rule id [REQ-033.2]
- [ ] #5 Given the same decision, When equity against the range that would call is exactly 50.0%, Then advice does not recommend a value bet [REQ-033.2]
- [ ] #6 Given a postflop decision facing a bet on a street that is not capped, When equity against the range that would call a raise is 50.1%, Then advice recommends raise [REQ-033.2]
- [ ] #7 Given the same holding on a capped street, When advice is requested, Then it recommends call or fold by the pot-odds rule [REQ-033.1]
- [ ] #8 Given a value-bet or value-raise recommendation, When it is returned, Then it includes equity against the calling range %, required equity % and the rule id [REQ-033.5]
- [ ] #9 Given a value-bet spot, When recommendPostflop returns, Then the recommendation includes equityVsCallingRangePct and bet/raise outcomes alongside the existing fields, without breaking existing consumers
- [ ] #10 Given postflop free-check decisions depend on equity for value bets, When this story lands, Then the TAG bot's FREE_CHECK_EQUITY stand-in is removed or limited to spots where equity cannot change the move, with the playtest still under its time limits
- [ ] #11 Given a real postflop recommendation now carries equityVsCallingRangePct, When a user bets or raises against advice to check or call, Then gradeView grades it by aggression-margin and aggression-no-range no longer fires for real recommendations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The value rule is in the postflop design document and has a unit test [REQ-033.4]
- [ ] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [ ] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [ ] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [ ] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [ ] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [ ] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [ ] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [ ] #9 No new network requests beyond the app's own files [REQ-058.1]
- [ ] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [ ] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [ ] #12 Story documentation is written and published to Backlog.md
- [ ] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. callingRange (strong/pair/draw keep sets) + equity vs calling range; value-bet / value-raise rules at >50.0% (rounded tenths); capped street keeps pot-odds call/fold.
2. Recommendation gains equityVsCallingRangePct and bet/raise outcomes; grade uses aggression-margin for real recommendations.
3. Bots: recommend with BOT_EQUITY budget (500 trials); TAG FREE_CHECK_EQUITY shortcut removed/limited; 10k playtest ≤15 s.
4. Q-3 locked re-pins; record new playtest/million hashes and CI shard times.

Full spec: doit/TASK-7.8/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).

AC added from TASK-6.1 follow-up (doc-18).

AC added from TASK-7.4 follow-up (doc-19).
<!-- SECTION:NOTES:END -->
