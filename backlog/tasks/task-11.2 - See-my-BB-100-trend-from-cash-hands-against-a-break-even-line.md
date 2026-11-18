---
id: TASK-11.2
title: See my BB/100 trend from cash hands against a break-even line
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-11.1
  - TASK-10.1
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my big bets won per 100 hands over time against break-even, so that I can see whether my results are improving (G-3).

Second chart 'Big bets won per 100 hands' (Stats storyboard). Uses cash-game hands only, whatever the game-type filter; sit-and-go hands never enter it. Each hand's net result in big bets = (chips won - chips put in) / big bet of that hand's stake; group value = sum of net big bets / hands in the group x 100, same definition as the report's BB/100 (E10-S01). Per-500 grouping counts cash hands only and plots only complete 500-cash-hand groups (REQ-048.11); with 1 to 499 cash hands in the filter it shows 'Play <n> more cash hands to see your first trend point.' (n = 500 - cash hands; singular 'Play 1 more cash hand ...', REQ-048.13, REQ-048.14). When the filter contains no cash-game hands (e.g. game type Sit-and-go, or only sit-and-go hands stored) the BB/100 chart shows 'No cash-game hands yet.' (REQ-048.12). A dashed line marks 0 (break-even, G-3).

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

## Notes
Rebuys are not results: compute per-hand net, not stack deltas across a rebuy.

Plan key: E11-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given 2,000 seeded cash hands at mixed stakes, When the BB/100 chart is shown per 500 hands, Then it plots 4 points each equal to the BB/100 recomputed from the stored hand records of that group [REQ-048.4]
- [ ] #2 Given 1,000 cash hands and 500 sit-and-go hands with game type All, When the BB/100 chart is shown per 500 hands, Then it plots 2 points computed from the cash hands only [REQ-048.4]
- [ ] #3 Given the BB/100 chart has points, When it is shown, Then a dashed break-even line is drawn at 0 BB/100 [REQ-048.4]
- [ ] #4 Given a cash session's stored report, When the per-session BB/100 point for that session is plotted, Then it equals the report's BB/100 [REQ-048.4, REQ-048.1]
- [ ] #5 Given 600 stored sit-and-go hands and no cash hands, When the Statistics screen is shown with game type All and with game type Sit-and-go, Then in both cases the BB/100 chart shows 'No cash-game hands yet.' instead of points [REQ-048.12, REQ-048.4]
- [ ] #6 Given 800 hands in the filter of which 300 are cash hands, When the BB/100 chart is shown per 500 hands, Then it plots no point and shows 'Play 200 more cash hands to see your first trend point.' while the Major-error chart plots 1 point [REQ-048.13, REQ-048.11, REQ-048.4]
- [ ] #7 Given 499 cash hands in the filter, When the BB/100 chart is shown, Then it shows 'Play 1 more cash hand to see your first trend point.' [REQ-048.13, REQ-048.14]
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
