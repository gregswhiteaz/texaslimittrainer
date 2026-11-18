---
id: TASK-7.9
title: Count implied odds for drawing hands
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want drawing hands judged with implied odds that name the outs counted, so that I learn when chasing a draw pays off later in the hand.

Implied-odds rule (postflop design document): applies only when hero holds a draw (a flush draw counts 9 outs, an open-ended straight draw 8 outs, outs that also improve an opponent's likely better hand are not removed in this rule) and at least one card is still to come. Required equity with implied odds = call amount / (pot after calling + one big bet for each opponent still in the hand), the extra big bet standing for what hero expects to win on a later street when the draw hits. If equity is below the plain required equity (REQ-033.1) but at least the implied required equity, advice recommends call with the implied-odds rule id and lists the outs; otherwise the pot-odds result stands. Rule precedence: value bet/raise (E07-S10), then pot-odds call, then implied-odds call, then fold (or check when free). Worked example at $4/$8 (AC1): hero Ah5h, opponent range {KsQd}, board Kh 8h 7c 2d; 9 heart outs of 44 unseen cards give equity 20.5%.

## Requirements covered
- REQ-033 (Must): Postflop recommendation method — For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.

Covers: REQ-033

## Notes
Equity in AC1/AC3 is exact enumeration over the 44 unseen river cards: only the 9 remaining hearts win for hero.

Plan key: E07-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given a $4/$8 turn decision, board Kh 8h 7c 2d, hero Ah5h, one opponent with range {KsQd} betting $8 into a pot of $28 including that bet, When advice is requested, Then equity is 20.5% (9 outs of 44), required equity is 22.2% (8/36), implied required equity is 18.2% (8/44), and advice recommends call with the implied-odds rule id listing the 9 heart outs [REQ-033.3, REQ-033.7]
- [ ] #2 Given the same turn decision with injected equity exactly equal to 8/44 and with equity 0.1 points below 8/44, When advice is requested, Then it recommends call and fold respectively [REQ-033.3, REQ-033.7]
- [ ] #3 Given the same cards but a pot of $12 including the $8 bet (required 40.0%, implied required 8/28 = 28.6%), When advice is requested, Then it recommends fold with equity 20.5% and lists the 9 outs considered [REQ-033.3, REQ-033.7]
- [ ] #4 Given a turn decision with two opponents still in the hand, a call of $8 and a pot of $36 including the bet, When the implied required equity is computed, Then it is 8 / (44 + 16) = 13.3% [REQ-033.3, REQ-033.7]
- [ ] #5 Given a river decision with a missed draw, When advice is requested, Then implied odds are not applied and no outs are listed [REQ-033.3, REQ-033.7]
- [ ] #6 Given an implied-odds recommendation, When it is returned, Then it includes equity %, required equity %, the rule id and the outs [REQ-033.5]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The implied-odds rule is in the postflop design document and has a unit test [REQ-033.4]
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
