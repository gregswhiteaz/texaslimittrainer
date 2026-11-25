---
id: TASK-6.11
title: Report each bot style's VPIP, PFR and aggression against its band
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T05:07:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-6.6
  - TASK-7.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-102
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want each bot style's measured play checked against its target band, so that the opponents I practise against stay recognisable as the strategy code changes.

Adds `--check-styles` to the playtest CLI (REQ-062.1). Over the run, each style's VPIP, PFR and aggression are computed with the shared style-stat functions (E07-S08); aggression uses the REQ-045.3 definition, flop, turn and river actions only. Bands (inclusive): TAG VPIP 18-26%, PFR 14-22%, aggression 45-65%; Calling station 45-65%, 3-10%, 10-25%; Maniac 50-75%, 35-60%, 65-85%; Rock 8-15%, 6-12%, 35-55%. This story builds the reporting and the pass/fail check; tuning the style files into the bands is E06-S16 (TAG, Rock) and E06-S17 (Calling station, Maniac). The run also reports action counts for each spot type a style marks as mixed (REQ-028.3).

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.
- REQ-028 (Must): Reproducible mixed decisions — Where a bot's style gives more than one action a non-zero probability, the bot shall pick among them using a random generator derived from the hand's replay code, so that replaying a hand reproduces every bot decision.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-027, REQ-028, REQ-062

Plan key: E06-S09 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given any playtest run, When it reports, Then it prints each style's VPIP, PFR and aggression to one decimal place, computed with the shared style-stat functions [REQ-062.3, REQ-027.5]
- [x] #2 Given a test style file that moves one style's stat outside its band, When the playtest runs with `--check-styles`, Then it prints the style, stat, measured value and band and exits non-zero; a value exactly on a band edge passes [REQ-027.5, REQ-062.1]
- [x] #3 Given a style whose actions in a run are 2 preflop raises, 3 postflop bets, 1 postflop raise and 4 postflop calls, When its aggression is reported, Then it is 50.0% because preflop actions are excluded [REQ-027.6]
- [x] #4 Given a run with `--check-styles`, When it reports, Then it lists the action counts for every spot type each style marks as mixed and exits non-zero if any of those spot types used only one action [REQ-028.3]
- [x] #5 Given a test style file whose measured stats are all inside its bands, When the playtest runs with `--check-styles`, Then it prints each stat with its band and exits 0 [REQ-027.5]
- [x] #6 Given aggression is measured per style, When the report runs, Then it is measured after TASK-7.8 (postflop value betting) in mixed line-ups — a lone Maniac among TAGs reads 100% today because no bot bets postflop (TASK-6.4 finding)
- [x] #7 Given the Rock seated with a Maniac at the table, When its VPIP and PFR are reported, Then they are re-measured against the 8–15% / 6–12% band (TASK-6.5 prototype: 9.9% / 8.3%, close to the floors)
- [x] #8 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` with seeds 42, 7 and 1234, When it completes, Then TAG and Rock lines report inside their bands (TASK-6.16 tuned the Rock's postflop value bar to 75%)
- [x] #9 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles` with seeds 42, 7 and 1234, When it completes, Then all four styles (TAG, Rock, Calling station, Maniac) report inside their bands and the command exits 0 (TASK-6.17 tuning)
- [x] #10 Given the 100k --check-styles run, When CI is set up, Then it runs in a nightly or on-demand workflow (deferred DoD#1 of TASK-6.17)
- [x] #11 Given --check-styles, When it measures VPIP, PFR and aggression, Then it uses styleStats/styleCounts from src/stats/style-stats.ts (TASK-7.12), not a separate counter
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
1. src/playtest/style-check.ts: STYLE_BANDS, per-style counting via shared style-stats, mixed-spot recorder (only with --check-styles).
2. CLI: style block before Bot results on every run; --check-styles adds bands, mixed spots, pass/fail, exit 1.
3. Opt-in slow 3×100k CLI test; dispatch-only style-bands.yml + test (no schedule/push).
4. Record new default/million hashes; cli.test re-pins; docs.

Full spec: doit/TASK-6.11/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-6.4 follow-up

AC added from TASK-6.5 follow-up

From TASK-6.9: compose style-band checks with checkStep via composeChecks (src/playtest/runner.ts), not a new runner parameter.

AC added from TASK-6.16 Q-1 (CLI band check deferred here)

From TASK-6.16 judge: TAG aggression measured 64.1% on seed 555 (30k) vs 65 ceiling — watch the margin in the --check-styles re-check.

ACs added from TASK-6.17 Q-1/Q-2

AC added from TASK-7.12 follow-up.

Build: style stats block on every playtest; --check-styles (bands, mixed spots, exit 1); dispatch-only style-bands.yml; slow 3×100k all four styles pass; new 10k SHA 1eb65ef2cbd611efa25a131801e52f97546fdeb40fea3efc841db8cf861238a5; million 900 8cd39126ace1472977cf969244ba979f97f0586669efa613594d533ca64b59c4; gate PASS.

Review R1: 2 MAJOR fixed (every-push runs cut to 300 hands with slow twins at original counts; git-show-main check replaced by 7 CI-robust assertions). Recorded spec amendment (build-log). R2: 0 blocking.

Judge R1 PASS 14/14 (own counter matched CLI stats on 8 setups; edge/just-outside band cases; 3×100k slow pass; 21/23 mutants, 2 LOW test gaps). Follow-up spike: TAG aggression headroom. Workflow style-bands.yml not yet dispatched (user choice; costs minutes).

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).

TASK-6.25: check-styles fast test FAST_TIMEOUT_MS raised 30s -> 60s (same-style replacement makes Soft runs ~1.4x slower); no assertion changed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added --check-styles and a per-style VPIP/PFR/aggression block to every playtest run (src/playtest/style-check.ts, cli.ts), plus a dispatch-only style-bands.yml workflow (never scheduled, no minutes unless run). Values use the shared style-stat functions and the inclusive REQ-027 bands; mixed spots report recommended/alternative counts; a failed check exits 1. Verified: slow 100k x seeds 42/7/1234 pass all four styles; npm test 947 passed, coverage 97.3%; default 10k output SHA now 1eb65ef2..., million 900 now 8cd39126.... Review R1 had 2 MAJOR (every-push speed, vacuous git-main check), fixed; R2 had 0 blocking. Review the 10 assumptions in the story doc. Risks: TAG aggression is 63.5-63.7% against a 65% ceiling, and short runs (2k hands) can fail --check-styles. The workflow has not been run on GitHub yet.
<!-- SECTION:FINAL_SUMMARY:END -->
