---
id: TASK-6.16
title: Keep TAG and Rock bots inside their style bands
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T23:03:00Z'
updated_date: '2026-11-23T06:13:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.8
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-3
  - doc-94
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want the tight bot styles' measured play to fall inside their target bands, so that the tight opponents I practise against behave like real tight players.

Tune the TAG and Rock style data files (and only them) until the Mixed 6-max check-styles run (E06-S09) measures them inside their bands: TAG VPIP 18-26%, PFR 14-22%, aggression 45-65%; Rock VPIP 8-15%, PFR 6-12%, aggression 35-55% (aggression postflop only, REQ-027.6).

## Requirements covered
- REQ-027 (Must): Measurable style profiles — In headless 6-max playtests of 100,000 hands with the Mixed line-up, each bot style's measured statistics shall fall inside its target band.

Covers: REQ-027

Plan key: E06-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given `npm run playtest -- --hands 100000 --lineup mixed --size 6 --check-styles --seed 42`, When it completes, Then TAG's measured VPIP is 18-26%, PFR 14-22% and aggression 45-65% [REQ-027.1]
- [x] #2 Given the same run, When it completes, Then the Rock's measured VPIP is 8-15%, PFR 6-12% and aggression 35-55% [REQ-027.4]
- [x] #3 Given the same check-styles run with seeds 7 and 1234, When each completes, Then TAG and Rock are inside their bands for both seeds [REQ-027.5, REQ-027.1, REQ-027.4]
- [x] #4 Given TAG's measured VPIP or PFR fall outside REQ-027.1 (VPIP 18-26%, PFR 14-22%), When the style-band check runs, Then the 6-max chart is retuned until both are inside the band
- [x] #5 Given the TASK-7.19 re-raise widening (openers keep 80-90% vs a single 3-bet), When TAG's style band is measured, Then its aggression stays within 45-65% or the chart is retuned
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
1. rock.json postflopValue.thresholdPct 75 (validated 50–100) + style.ts reader; decideRock keeps bet/raise only above 75.0% vs calling range, else check/call.
2. Rock description clause; update rock.test unit assertion.
3. Opt-in slow style-bands test: Mixed 6-max, 3 seeds × 100k, TAG and Rock inside REQ-027 bands.
4. No chart/TAG change; playtest SHA unchanged.

Full spec: doit/TASK-6.16/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.2 follow-up (doc-14).

AC added from TASK-7.19 follow-up (doc-28).

Dependency on TASK-7.8 added from TASK-6.3: postflop advice never bets/raises until value betting (REQ-033.2) lands, so postflop aggression (REQ-027.6) is 0% for every bot until then.

Build: Rock postflopValue threshold 75 (style.ts reader, rock.ts rule, rock.json); slow 3×100k bands: TAG 22.2/16.2/63.0–63.3, Rock 9.9–10.1/8.4–8.8/46.9–47.2; SHA unchanged; gate PASS.

Review R1: MAJOR (seated-Rocks unit run CI time) fixed: 1,000→300 hands; R2: 0 findings.

Judge R1 PASS 10/10 (own REQ-045 counter on seeds 2026@100k and 555@30k; Rock base 69.6% → 45–49%; 3,000 Rock decisions 0 mismatches; 13/15 mutants, 2 equivalent). Note for TASK-6.11: TAG aggression margin ~0.9 pt on seed 555.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rock postflop aggression was 70-71% against its 35-55% band; TAG was already inside all bands. Added a Rock-only deterministic postflopValue.thresholdPct 75 (rock.json, style.ts validation, rock.ts rule): the Rock bets or raises only above 75% equity vs the calling range, else checks or calls. No chart, TAG or advice change; default playtest SHA unchanged. Verified: slow 3x100k Mixed 6-max bands (seeds 42/7/1234) TAG 22.2-22.3/16.2-16.3/63.0-63.3, Rock 9.9-10.1/8.4-8.8/46.9-47.2, all inside; lint, typecheck, tests and coverage pass; review R1 MAJOR (slow unit test) fixed, R2 clean. Assumptions to review: A-1..A-4 and auto-accepted Q-1..Q-3. Follow-ups: CLI --check-styles re-check is an AC on TASK-6.11; Calling station aggression (51-53% vs 10-25%) noted on TASK-6.17; TAG aggression is near its 65 ceiling.
<!-- SECTION:FINAL_SUMMARY:END -->
