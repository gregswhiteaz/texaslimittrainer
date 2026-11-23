---
id: TASK-7.2
title: Recommend a preflop action from the 6-max chart
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T16:14:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-1.5
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-14
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a preflop recommendation for my hand taken from an authored 6-max chart, so that I learn which starting hands to play from each position.

Every preflop recommendation comes from authored chart data files loaded by the advice engine (not hard-coded logic). A chart gives, per position and preflop situation, the action for each of the 169 starting-hand classes. Situations per position: unopened pot, facing one or more limpers, facing a raise, facing a raise and calls, facing a re-raise, blind defence. Each cell: one action (fold, call, raise), a borderline flag, zero or one acceptable alternative action. Each chart file carries a plain-English justification of its ranges, written for this project. The advice API accepts only a PlayerView (E01-S06), so hints and grades see only the acting player's view. This slice delivers the 6-max chart; heads-up and full ring follow in E07-S05. The TAG bot (E06) is built on this API. Applicable 6-max (position, situation) pairs (26): unopened pot - UTG, HJ, CO, BTN, SB; facing one or more limpers - HJ, CO, BTN, SB, BB; facing a raise - UTG, HJ, CO, BTN; facing a raise and calls - UTG, HJ, CO, BTN; facing a re-raise - all six; blind defence - SB, BB. The blinds facing a raise (with or without callers) use blind defence.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-032 (Must): Preflop charts — The advice engine shall take every preflop recommendation from authored charts that give, for each reference size, position and preflop situation, the action for each of the 169 starting-hand classes.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-025, REQ-032, REQ-061

## Notes
Recommendations are always legal for the view: a 'call' cell with nothing to call becomes check (AC8); facing a fourth bet the street is capped (one bet plus three raises, REQ-016.3), so a raise cell becomes call (AC7, REQ-032.6). Heads-up and full-ring fourth-bet checks are in E07-S05.

Plan key: E07-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the 6-max chart data, When the chart validator runs, Then each of the 26 applicable (position, situation) pairs listed in the context assigns an action to all 169 starting-hand classes, and a missing pair fails validation naming it [REQ-032.2]
- [x] #2 Given a chart cell with no action, an action other than fold, call or raise, or more than one acceptable alternative, or a 6-max chart file without a plain-English justification, When the chart validator runs, Then validation fails naming the position, situation and hand class of the bad cell, or the chart missing its justification [REQ-032.3, REQ-032.4]
- [x] #3 Given one chart cell is changed in the data file and no code is changed, When advice is requested for that position, situation and hand class, Then the recommendation follows the edited cell [REQ-032.5]
- [x] #4 Given a 6-max PlayerView at a preflop decision, When advice is requested, Then it returns the cell's action, its borderline flag, its acceptable alternative (or none) and the position and situation used [REQ-032.3]
- [x] #5 Given a fixed preflop decision point, When the other players' hole cards and the undealt cards are changed, Then the recommendation is identical [REQ-025.2]
- [x] #6 Given code that passes the full game state instead of a PlayerView to the advice API, When `npm run typecheck` runs, Then it reports a type error [REQ-025.2]
- [x] #7 Given a 6-max preflop decision facing a fourth bet (a re-raise of a re-raise), When advice is requested, Then it uses the facing-a-re-raise chart cell for the hand class, and a raise recommendation becomes call because the street is capped [REQ-032.6]
- [x] #8 Given a 6-max big blind with no raise in front of it (one or more limpers) holding a hand class whose facing-limpers cell is call, When advice is requested, Then it returns check, because no bet is facing the big blind [REQ-032.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Chart ranges and justification text are original, written for this project [REQ-061.2]
- [x] #2 Every acceptance criterion has at least one automated test (unit, property or Playwright) that passes
- [x] #3 `npm run lint`, `npm run typecheck` and `npm test` pass with zero errors [REQ-059.1, REQ-059.4]
- [x] #4 The golden-spot suite passes 100% (applies from the story that creates the suite, E07-S14, onward) [REQ-039.4]
- [x] #5 Coverage thresholds hold: >= 90% engine/bots/advice/statistics, >= 70% overall [REQ-059.3]
- [x] #6 Engine, bots, advice and statistics code imports no UI or browser-only code [REQ-059.2]
- [x] #7 Stories that touch the engine, bots or advice: a 10,000-hand playtest reports zero invariant violations (applies once the playtest runner exists, E01-S07, onward) [REQ-056.1]
- [x] #8 Stories that add or change a screen: Playwright test of the screen flow in Chromium and WebKit, and axe reports zero serious or critical violations (axe tooling is provisioned in the toolchain story E01-S01) [REQ-057.1]
- [x] #9 No new network requests beyond the app's own files [REQ-058.1]
- [x] #10 Strategy-content stories: text is original and every chart, range or golden spot carries its justification [REQ-061.2]
- [x] #11 CI workflow is green on the story's branch (applies once the CI story E01-S02 is done; E01-S01 instead passes the same checks locally) [REQ-064.2]
- [x] #12 Story documentation is written and published to Backlog.md
- [x] #13 Stories that add a screen or dialog: once the offline service worker exists (E13-S07), the screen works with the network disabled
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/advice/hand-class.ts: 169 hand classes (AKs/AKo/22), grid order, combo counts.
2. src/advice/preflop-chart.ts: parse + validate tlh-preflop-chart v1 (13x13 token grids R/C/F, * borderline, /X alternative); 26 required 6-max spots; justification word counts; ChartValidationError with problems[].
3. src/advice/charts/six-max.json: original TAG chart per the approved authoring guide; static import, parsed once (SIX_MAX_CHART).
4. src/advice/preflop.ts: recommendPreflop(view, {chart?}) — position from button rotation, situation from preflop actions, cell lookup, legalisation (call->check when nothing owed, raise->call when capped betCount>=4 or no raise legal), exact move.
5. Tests: validator cases, edited-cell data test, hidden-card invariance, sandboxed typecheck (HandState rejected), cap and BB-check cases, chart content rules with per-spot percentages.

Full spec: doit/TASK-7.2/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: hand-class.ts, preflop-chart.ts (tlh-preflop-chart v1 parser/validator), preflop.ts (recommendPreflop with legalisation and move), charts/six-max.json (original TAG chart, 26 spots, all within §5 bands); acceptance/unit/content tests; advice 100% lines; gate PASS.

CI run 44345626992 (head 5f18b57): success. Judge round 1: PASS 17/17; 136,890 engine decisions matched an independent oracle; mutation probes caught. Follow-ups (Step 6a): created TASK-7.19 (user chart review + revisions incl. J-1-01..03, K9o, HJ text, print script), TASK-7.20 (validator edge cases), TASK-7.21 (spike: split spots, Q-4), TASK-8.5 (position/situation labels); ACs added to TASK-6.16 (retune vs REQ-027.1), TASK-1.12 (cap agreement), TASK-7.17 (short-stack preflop). Skipped: start<=0 equivalent mutant (no behaviour change).

Correction (TASK-7.19, 2026-11-19): the doc-14 review note that HJ always closes the action in raise-and-calls is wrong. A player who limped after HJ may still be to act (e.g. UTG folds, HJ limps, CO limps, SB raises, BB calls). The chart text now says this.

Locked test edited for TASK-7.6 Q-6 (user-approved): sandbox file list gains heads-up.json and full-ring.json.

Locked test sandbox list extended by TASK-7.10 block 1 (auto-accepted; no assertion change).

Locked test re-pinned by TASK-7.13 block 1 (auto-accepted; no assertion dropped).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added recommendPreflop(view): a legal preflop action (with borderline flag, alternative and exact move) read from an authored, validated 6-max chart (26 spots x 169 hand classes, JSON, static import). It takes only a PlayerView, so hidden cards cannot affect it. Raises on a capped street become call, and call or fold with nothing to call becomes check. Chart is original TAG content by Claude (Q-1), to be reviewed by the user; widths per spot are in the story doc.
Verification: lint, typecheck and tests pass (110 passed, 1 skipped, advice 100% lines); 2 gate runs PASS. Review r1 had one MAJOR (HJ raise-and-calls justification and grid built on an impossible premise), fixed (width 10.7% -> 14.3%); r2 clean. Judge and final CI pending.
Review: assumptions A-1..A-12 in the story doc, and the chart grids in src/advice/charts/six-max.json.
Follow-ups: raiser-position/re-raise split spike (Q-4), chart retune after TASK-6.16, display labels, chart print script, cap-rule check with TASK-1.12, short stacks (TASK-1.9/7.17), plus minor chart/test/wording notes.
<!-- SECTION:FINAL_SUMMARY:END -->
