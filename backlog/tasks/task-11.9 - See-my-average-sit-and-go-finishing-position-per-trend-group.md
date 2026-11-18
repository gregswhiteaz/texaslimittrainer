---
id: TASK-11.9
title: See my average sit-and-go finishing position per trend group
status: To Do
assignee: []
created_date: '2026-11-17T22:47:00Z'
updated_date: '2026-11-17T23:22:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-11.5
  - TASK-11.4
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-11
priority: high
type: feature
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see my average sit-and-go finishing position and how many sit-and-gos each trend group holds, so that I can track tournament results alongside cash results.

Sit-and-go play exists from E05 (M3), so this Must clause lands in M3. A sit-and-go result belongs to the trend group that contains its last hand. Per group the screen shows the average finishing position of ended sit-and-gos (one decimal) and their count. Hidden when the game-type filter is Cash; groups with no ended sit-and-go show no average.

## Requirements covered
- REQ-048 (Must): Statistics screen trends — The Statistics screen shall chart the user's Major errors per 100 hands and BB/100 over all stored hands, grouped per 500 hands by default and switchable to per session or per day, filtered by table size and game type.

Covers: REQ-048

## Notes
Finishing position and starting player count come from the session record stored by E05-S05 (same wave, so no dependency edge); tests seed ended sit-and-go session records as fixtures.

Plan key: E11-S05 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given seeded ended sit-and-go session records finishing 2nd, 4th and 2nd whose last hands fall in hands 501-1,000, When the per-500 grouping is shown, Then that group shows average finishing position 2.7 and 3 sit-and-gos [REQ-048.5]
- [ ] #2 Given grouping per session, When an ended sit-and-go that finished 3rd of 6 is shown, Then its group shows average finishing position 3.0 and 1 sit-and-go [REQ-048.5]
- [ ] #3 Given the game type filter is Cash, When the Statistics screen is shown, Then no sit-and-go results are shown [REQ-048.5, REQ-048.2]
- [ ] #4 Given a seeded data set of 3,000 hands with 12 ended sit-and-gos, When each grouping is shown, Then every average finishing position and count equals the value recomputed from the stored session records [REQ-048.5]
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
