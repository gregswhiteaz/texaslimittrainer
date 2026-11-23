---
id: TASK-7.13
title: Adjust opponent ranges to their observed play after 30 hands
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T09:25:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.5
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the advice to read each opponent from the hands I have seen them play, so that I learn to adjust to loose and tight opponents.

From 30 observed hands of an opponent in the session, that opponent's preflop range width is scaled toward their observed stats by the formula in the range-model design document: width = d + (o - d) x min(n, 100) / 100, where d is the default range's width (% of starting hands), o is the observed PFR for raising ranges or the observed VPIP for calling and limping ranges, and n is the number of observed hands; the range is then the strongest width% of starting hands by the documented hand order, never narrower than the single strongest hand class (AA). Below 30 hands the default range is used. Recommendations state the basis per opponent: 'typical player' or 'based on N hands of this opponent'; the hint (E08) and review (E09) display it.

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.

Covers: REQ-035

## Notes
Observed stats are an explicit advice input (a snapshot per decision point), so hint and review for the same decision use the same snapshot (E07-S13). Preflop chart recommendations do not read opponent ranges; planned basis for preflop is 'typical player'.

Plan key: E07-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given an opponent with 29 observed hands, When their range is estimated, Then it equals the default range and the basis is 'typical player' [REQ-035.2, REQ-035.4]
- [ ] #2 Given two opponents with identical actions and 30 observed hands each, one with VPIP 20% and PFR 15% and one with VPIP 60% and PFR 10%, When their ranges are estimated, Then the preflop ranges differ and each width equals the documented formula's output [REQ-035.2, REQ-035.6]
- [ ] #3 Given an opponent with 40 observed hands, When a postflop recommendation is computed, Then its basis reads 'based on 40 hands of this opponent' [REQ-035.4]
- [ ] #4 Given a multiway pot with one opponent observed for 45 hands and one for 12, When a recommendation is computed, Then it returns the basis for each opponent: 'based on 45 hands of this opponent' and 'typical player' [REQ-035.4]
- [ ] #5 Given a default raising range of width 20.0% and an opponent with 30 observed hands, When the scaling formula is applied with observed PFR 0%, 20% and 100%, Then the widths are 14.0%, 20.0% and 44.0%; and with 100 observed hands and PFR 60%, Then the width is 60.0% [REQ-035.2, REQ-035.6]
- [ ] #6 Given a default raising range of width 20.0% and an opponent with 100 observed hands and PFR 0%, When the range is scaled, Then the scaled width is 0.0% and the range is the single strongest hand class AA (6 combos), never empty [REQ-035.6]
- [ ] #7 Given a recommendation whose range rests on observed opponent habits, When its explanation is generated, Then it names and defines the 'opponent type' concept using the authored definition in src/advice/explanations.ts
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
AC added from TASK-7.10 follow-up (opponent-type template).
<!-- SECTION:NOTES:END -->
