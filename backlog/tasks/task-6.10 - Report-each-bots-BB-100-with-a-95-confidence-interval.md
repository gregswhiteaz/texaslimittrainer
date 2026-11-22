---
id: TASK-6.10
title: Report each bot's BB/100 with a 95% confidence interval
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T19:21:00Z'
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
  - doc-84
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 500
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
- [x] #1 Given any playtest run, When it reports, Then it prints for each bot its name, style, hands played, BB/100 and the lower and upper bounds of its 95% confidence interval [REQ-062.3, REQ-030.4]
- [x] #2 Given a bot that won $80 over 100 hands at $4/$8, When its win rate is computed, Then it is 10.00 BB/100 [REQ-062.3]
- [x] #3 Given a fixed list of per-hand results, When the 95% confidence interval is computed, Then its bounds equal mean +/- 1.96 x sample standard deviation / sqrt(n), in BB/100, to 0.01 [REQ-030.4]
- [x] #4 Given a seat whose bot busted and was replaced during the run, When the report is printed, Then the departed bot and its replacement appear as separate rows with their own hands played [REQ-062.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #2 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #3 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #4 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #5 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #6 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #7 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #8 No new network requests beyond the app's own files [REQ-058.1]
- [x] #9 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #10 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #11 Story documentation is written and published to Backlog.md
- [x] #12 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/playtest/winrate.ts: per-bot running stats (Welford), BB/100 and 95% CI (sample SD, 1.96·SD/√n), formatting.
2. cli.ts: Bot results block between header and 'Hands played:' in every mode; bots keyed by seat+name+style (replacements separate); default seats 'Seat N'; line-up seat 1 'User'.
3. Acceptance + unit tests; new default baseline SHA recorded; old SHA recovered with grep -v '^Bot'.

Full spec: doit/TASK-6.10/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: winrate.ts (Welford, BB/100, 95% CI), Bot results block before 'Hands played:'; new default SHA 442dbf55…08fbc (old aacd5e94…e01 with grep -v '^Bot'); million runs PASS; gate PASS.

Review R1: 0 blocking; MINOR #1 (violating completed hand counted) fixed with a unit test; MINOR #2 (replacement-name reuse after restart can merge rows) documented; security MINOR (rows grow with busts) accepted per A-5. SHAs unchanged. gate PASS.

Judge R1 PASS 13/13 (own two-pass recompute of every row across 7 run modes; 8/8 mutants; 1105 holdout checks). Follow-ups: AC on TASK-6.12 (pool win rates across shards); VPIP/PFR TASK-6.11; app UI BB/100 TASK-11.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added per-bot BB/100 with 95% CI rows (src/playtest/winrate.ts, wired into playtest run mode) printed before 'Hands played:'; busted bots and replacements get separate rows. Verified: npm test 629 passed, lint/typecheck clean, old output SHA unchanged when Bot lines are filtered; default-run SHA is now 442dbf55bd32d87a5e367d3c5b9be28ec9303c57174783eae5947134aa408fbc. Review: R1 MINOR fixed (violating hands skipped). Assumptions to review: Q-1 format/placement, Q-2 Seat N/Random/User labels, A-1..A-6; restart can merge same-name bots in failing runs only. Follow-ups: VPIP/PFR (TASK-6.11), TAG-beats-others (TASK-6.12), cross-shard pooling (unowned), app-UI BB/100 (TASK-11).
<!-- SECTION:FINAL_SUMMARY:END -->
