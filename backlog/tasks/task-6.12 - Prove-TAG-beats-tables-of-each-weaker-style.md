---
id: TASK-6.12
title: Prove TAG beats tables of each weaker style
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T19:15:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-2
dependencies:
  - TASK-6.10
  - TASK-6.17
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want TAG bots proven to win against tables of any single weaker style, so that beating the bots means something because the TAG strategy behind them is sound.

Three 100,000-hand 6-max harness runs, one TAG against five bots of one weaker style each. These are not presets, so the playtest `--lineup` option also accepts an explicit comma-separated style per seat using the tokens tag, calling-station, maniac and rock (glossary: TAG, Calling station, Maniac, Rock); an unknown token or a seat count that does not match `--size` is rejected. Pass = TAG's lower 95% confidence bound (E06-S10) above 0 BB/100. If a run fails, tune TAG or the advice rules, keeping E06-S16/S17 bands and the golden spots green.

## Requirements covered
- REQ-030 (Should): TAG bot strength — In headless playtests of 100,000 hands, a TAG bot seated with five bots of any single weaker style shall win at a positive rate.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-030, REQ-062

Plan key: E06-S12 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given `npm run playtest -- --hands 100000 --size 6 --seed 42 --lineup tag,calling-station,calling-station,calling-station,calling-station,calling-station`, When it completes, Then TAG's BB/100 lower 95% bound is above 0 [REQ-030.1]
- [ ] #2 Given the same run with five Maniacs (`--lineup tag,maniac,maniac,maniac,maniac,maniac`), When it completes, Then TAG's BB/100 lower 95% bound is above 0 [REQ-030.2]
- [ ] #3 Given the same run with five Rocks (`--lineup tag,rock,rock,rock,rock,rock`), When it completes, Then TAG's BB/100 lower 95% bound is above 0 [REQ-030.3]
- [ ] #4 Given `--lineup` with a per-seat list containing a token other than tag, calling-station, maniac or rock, or with a seat count different from `--size`, When the playtest starts, Then it prints the accepted tokens and the expected seat count and exits non-zero without playing [REQ-062.1]
- [ ] #5 Given a TAG-strength run large enough to need the million tool's shards, When the combined report is printed, Then each style's BB/100 and 95% CI are pooled across shards (not only printed per shard)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The three strength runs are part of the nightly / on-demand CI job and their results are recorded in the story notes [REQ-030.1, REQ-030.2, REQ-030.3]
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.10 follow-up (cross-shard pooling of win rates)
<!-- SECTION:NOTES:END -->
