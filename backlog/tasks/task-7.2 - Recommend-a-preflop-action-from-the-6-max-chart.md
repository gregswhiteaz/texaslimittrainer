---
id: TASK-7.2
title: Recommend a preflop action from the 6-max chart
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T15:24:00Z'
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
- [ ] #1 Given the 6-max chart data, When the chart validator runs, Then each of the 26 applicable (position, situation) pairs listed in the context assigns an action to all 169 starting-hand classes, and a missing pair fails validation naming it [REQ-032.2]
- [ ] #2 Given a chart cell with no action, an action other than fold, call or raise, or more than one acceptable alternative, or a 6-max chart file without a plain-English justification, When the chart validator runs, Then validation fails naming the position, situation and hand class of the bad cell, or the chart missing its justification [REQ-032.3, REQ-032.4]
- [ ] #3 Given one chart cell is changed in the data file and no code is changed, When advice is requested for that position, situation and hand class, Then the recommendation follows the edited cell [REQ-032.5]
- [ ] #4 Given a 6-max PlayerView at a preflop decision, When advice is requested, Then it returns the cell's action, its borderline flag, its acceptable alternative (or none) and the position and situation used [REQ-032.3]
- [ ] #5 Given a fixed preflop decision point, When the other players' hole cards and the undealt cards are changed, Then the recommendation is identical [REQ-025.2]
- [ ] #6 Given code that passes the full game state instead of a PlayerView to the advice API, When `npm run typecheck` runs, Then it reports a type error [REQ-025.2]
- [ ] #7 Given a 6-max preflop decision facing a fourth bet (a re-raise of a re-raise), When advice is requested, Then it uses the facing-a-re-raise chart cell for the hand class, and a raise recommendation becomes call because the street is capped [REQ-032.6]
- [ ] #8 Given a 6-max big blind with no raise in front of it (one or more limpers) holding a hand class whose facing-limpers cell is call, When advice is requested, Then it returns check, because no bet is facing the big blind [REQ-032.3]
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Chart ranges and justification text are original, written for this project [REQ-061.2]
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
<!-- SECTION:NOTES:END -->
