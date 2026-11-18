---
id: TASK-7.1
title: Compute a hand's equity against opponent hands
status: To Do
assignee: []
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-17T23:21:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want equity numbers that match exact poker maths, so that I can trust the numbers behind every recommendation.

Equity calculator on top of the E01 hand evaluator: hero's share of the pot (ties counted as split shares) for a hero hand, a board of 0, 3, 4 or 5 cards and one or more opponent hands or ranges. Must be within 1.5 percentage points of exhaustive enumeration for heads-up preflop matchups (e.g. AA vs KK 81.9%, AKs vs QQ 46.2%). For a given input it returns the same number every time; if sampling is used, the sampler is seeded from the input. Range-versus-range and multiway accuracy against an offline reference set is completed in E07-S06.

## Requirements covered
- REQ-034 (Must): Equity calculation accuracy — The equity calculator shall return each hand's equity against one or more ranges within 1.5 percentage points of the exact value.

Covers: REQ-034

## Notes
Bots (REQ-055.3, bot decision <= 100 ms) and hints (REQ-055.1, <= 1 s) depend on this speed; prefer exact enumeration where cheap and seeded sampling otherwise. Canonicalise inputs (sort cards/combos) before deriving the seed so equal inputs give equal outputs.

Plan key: E07-S02 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given AA vs KK and AKs vs QQ preflop, When equity is computed, Then the results are within 1.5 percentage points of 81.9% and 46.2% [REQ-034.1]
- [ ] #2 Given a stored set of at least 100 heads-up preflop matchups with exact enumeration values, When the equity test suite runs, Then every result is within 1.5 percentage points of its stored value [REQ-034.1]
- [ ] #3 Given a three-way preflop matchup AA vs KK vs QQ, When equity is computed, Then each hand's equity is within 1.5 percentage points of exhaustive enumeration [REQ-034.2]
- [ ] #4 Given the same hero hand, board and opponent ranges, When equity is computed twice in one process and once in a fresh process, Then all three results are identical to the last digit [REQ-034.3]
- [ ] #5 Given an equity input that uses sampling, When the sampler is created, Then its seed is derived only from the input, so no clock or global random source changes the result [REQ-034.3]
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
