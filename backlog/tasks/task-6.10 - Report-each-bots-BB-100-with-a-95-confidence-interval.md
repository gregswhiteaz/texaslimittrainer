---
id: TASK-6.10
title: Report each bot's BB/100 with a 95% confidence interval
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T18:56:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each bot's win rate reported in BB/100 with its 95% confidence interval, so that claims that a bot is beatable or strong rest on real results, not a lucky run.

BB/100 = big bets won per 100 hands (big bet = 2 x small bet, $8 at $4/$8). 95% confidence interval = mean per-hand result +/- 1.96 x standard error, scaled to BB/100. Each bot is reported separately with its name, style and hands played; a bot that busted and its replacement (E06-S08) are separate bots.

## Requirements covered
- REQ-030 (Should): TAG bot strength — In headless playtests of 100,000 hands, a TAG bot seated with five bots of any single weaker style shall win at a positive rate.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-030, REQ-062

Plan key: E06-S10 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Given any playtest run, When it reports, Then it prints for each bot its name, style, hands played, BB/100 and the lower and upper bounds of its 95% confidence interval [REQ-062.3, REQ-030.4]
- [ ] #2 Given a bot that won $80 over 100 hands at $4/$8, When its win rate is computed, Then it is 10.00 BB/100 [REQ-062.3]
- [ ] #3 Given a fixed list of per-hand results, When the 95% confidence interval is computed, Then its bounds equal mean +/- 1.96 x sample standard deviation / sqrt(n), in BB/100, to 0.01 [REQ-030.4]
- [ ] #4 Given a seat whose bot busted and was replaced during the run, When the report is printed, Then the departed bot and its replacement appear as separate rows with their own hands played [REQ-062.3]
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/playtest/winrate.ts: per-bot running stats (Welford), BB/100 and 95% CI (sample SD, 1.96·SD/√n), formatting.
2. cli.ts: Bot results block between header and 'Hands played:' in every mode; bots keyed by seat+name+style (replacements separate); default seats 'Seat N'; line-up seat 1 'User'.
3. Acceptance + unit tests; new default baseline SHA recorded; old SHA recovered with grep -v '^Bot'.

Full spec: doit/TASK-6.10/spec.md
<!-- SECTION:PLAN:END -->
