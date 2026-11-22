---
id: TASK-7.5
title: Estimate each opponent's range from their actions in the hand
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-22T21:18:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-7.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-86
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want postflop advice that weighs my hand against what each opponent's actions suggest they hold, so that the advice reads opponents the way a real player would.

Range model: each opponent's range starts from authored default ranges per (reference size, position, preflop action sequence) and is narrowed by that opponent's later actions in the hand by the documented narrowing rule. Default ranges are data with a justification. Narrowing rule (range-model design document): on each postflop street every combo in the range is classified on the board at that street as Strong (two pair or better using at least one hole card), Pair (exactly one pair using at least one hole card, including a pocket pair), Draw (no pair, with four cards to a flush or an open-ended straight draw) or Air (anything else). When the opponent bets, keep Strong, Pair and Draw; checks, keep Pair, Draw and Air; calls a bet, keep Pair and Draw; raises, keep Strong and Draw. Narrowing applies street by street to the range left by the previous street. The model never reads a bot's style label or internal parameters: advice inputs are the PlayerView plus observed opponent statistics only. Replaces the 'every unseen combination' holdings used by E07-S03. The range that would call (value-bet rule) is E07-S10; observed-stat scaling is E07-S09. Worked fixture used by the ACs (also in the design document): range {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c classifies as Strong {KhKd, 8h7h}, Pair {AhKh, 9h9d}, Draw {6h5h, Th9h}, Air {QhJh, Ac2c}.

## Requirements covered
- REQ-035 (Must): Opponent range model — The advice engine shall estimate each opponent's range from that opponent's actions in the hand, starting from documented default ranges per action and adjusting toward the opponent's observed session statistics once 30 or more hands of that opponent have been observed.
- REQ-061 (Should): Legal and content — TLH Trainer shall use play money only and shall contain only strategy text and data written for this project.

Covers: REQ-035, REQ-061

## Notes
Cards are written rank+suit (Kh = king of hearts). Classes and per-action keep-sets are REQ-035.5.

Plan key: E07-S07 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given the default range data, When the range validator runs, Then every (reference size, position, preflop action sequence) has a range and a plain-English justification, and a missing range or justification fails validation [REQ-035.1]
- [x] #2 Given a 6-max opponent in the CO who open-raised preflop and has not yet acted on the flop, When postflop advice is computed with fewer than 30 observed hands of that opponent, Then equity is computed against exactly the authored default range for (6-max, CO, open-raise) [REQ-035.1]
- [x] #3 Given an opponent whose range is {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} on flop Ks 8d 7c, When the opponent bets the flop, Then the narrowed range is the 6 combos {KhKd, 8h7h, AhKh, 9h9d, 6h5h, Th9h} (Air removed) [REQ-035.1, REQ-035.5]
- [x] #4 Given the same range and flop, When the opponent checks the flop, Then the narrowed range is the 6 combos {AhKh, 9h9d, 6h5h, Th9h, QhJh, Ac2c} (Strong removed) [REQ-035.1, REQ-035.5]
- [x] #5 Given the same range and flop, When the opponent calls a flop bet, Then the narrowed range is the 4 combos {AhKh, 9h9d, 6h5h, Th9h}; and When the opponent instead raises a flop bet, Then it is the 4 combos {KhKd, 8h7h, 6h5h, Th9h} [REQ-035.1, REQ-035.5]
- [x] #6 Given the same range, When the opponent checks the flop Ks 8d 7c and then calls a bet on the turn 2d, Then the narrowed range is the 5 combos {AhKh, 9h9d, 6h5h, Th9h, Ac2c} (Ac2c now a Pair, QhJh still Air) [REQ-035.1, REQ-035.5]
- [x] #7 Given two opponents with identical positions, actions and observed statistics but different bot styles, When their ranges are estimated, Then the ranges are identical [REQ-035.3]
- [x] #8 Given code that passes a bot's style label or style parameters into the advice engine, When `npm run typecheck` runs, Then it reports a type error [REQ-035.3]
- [x] #9 Given action-based opponent ranges, When postflop advice is computed, Then it uses them in place of every-unseen-combo ranges (via the equity option or a range input) and the rules doc is updated
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Default ranges and their justification text are original, written for this project [REQ-061.2]
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
1. src/advice/ranges.ts + ranges/six-max.json: 36 authored 6-max default ranges (position × line) with justifications; validator.
2. Classifier (Strong/Pair/Draw/Air) and street-by-street narrowing by the most aggressive action; estimateOpponentRanges(view).
3. Option opponentRanges 'unseen'|'actions'; user hint + review grades use ACTION_RANGE_ADVICE; bots unchanged (playtest SHA unchanged).
4. AC#8: ExactOptions type ban on extra keys (style) into recommend/recommendPostflop/gradeView; bots pass adviceOptions(...).
5. docs/advice/range-model.md + rules doc update; fixture tests AC#3–#6; perf within existing targets.

Full spec: doit/TASK-7.5/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).

Build: 36 authored 6-max ranges + validator, classifier/narrowing, user-only ACTION_RANGE_ADVICE (hint + review), ExactOptions type ban, range-model doc; bots unchanged (SHA 442dbf55…08fbc); e2e 142 pass; gate PASS. Recorded spec-text deviations: ACTION_RANGE_ADVICE typed PostflopOptions; ExactOptions written in lint-friendly equivalent form.

Review R1: MAJOR (ExactOptions bypass via bot-key-only variables) fixed with O & Allowed & never-extras; 2 MINOR test gaps fixed. R2: 0 findings (9/9 expected type errors; bots unchanged).

Judge R1 PASS 16/16 (75,750 classifier pairs 0 mismatches; 14 extra type-ban cases; bots byte-identical vs base for mixed/tough/soft/sng; 12/12 mutants; 130+ hands played in the browser). J-1-01 LOW: Table.tsx using userReviewEntries is not guarded by a UI test — not tracked. Follow-up: TASK-7.25 (switch bots; needs user approval).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Action-range model for opponents: 36 authored 6-max ranges (position x preflop line), Strong/Pair/Draw/Air narrowing per street, equity against those ranges for the user's hints and review grades (docs/advice/range-model.md). Bots and default advice stay on every-unseen-combo (Q-1 A), so locked tests and playtest SHA are unchanged; a compile-time guard bars bot style/params from advice (review R1 MAJOR bypass fixed; R2 0 findings). Gates 3/3 PASS. Review assumptions Q-1..Q-3, A-1..A-8 in doc-86. Follow-ups: switch bots to action ranges (breaks TASK-7.3 AC#1, TASK-6.3 Example B, likely TASK-9.1; needs user approval); heads-up/full-ring ranges TASK-7.6; observed-stat scaling TASK-7.13.
<!-- SECTION:FINAL_SUMMARY:END -->
