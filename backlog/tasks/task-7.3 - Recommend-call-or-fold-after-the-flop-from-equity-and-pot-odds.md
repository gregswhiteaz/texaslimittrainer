---
id: TASK-7.3
title: Recommend call or fold after the flop from equity and pot odds
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-23T16:05:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-7.1
  - TASK-7.2
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-17
parent_task_id: TASK-7
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want a call-or-fold recommendation after the flop that compares my equity with the pot odds, so that I learn when a call is worth its price.

Postflop method: compute hero's equity against the opponents and the required equity = call amount / pot after calling; recommend call over fold when equity >= required equity. Every postflop recommendation returns the action, equity %, required equity % and the id of the rule that fired. All postflop rules are written in one design document and every rule has a unit test. In this slice opponents' holdings are every unseen two-card combination; the action-based range model (E07-S07) and observed-stat scaling (E07-S09) narrow them later without changing this rule. Value bets (E07-S10) and implied odds (E07-S11) are later rules.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-033 (Must): Postflop recommendation method — For each postflop decision, the advice engine shall compute the hero's equity against each opponent's estimated range and the pot odds, and recommend fold, check, call, bet or raise by documented rules comparing those numbers.

Covers: REQ-025, REQ-033

## Notes
Depends on E07-S01 only for the shared advice API (PlayerView in, recommendation out). Fold is never recommended when check is free (REQ-017.1).

Plan key: E07-S03 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a flop decision facing a $4 bet with a pot of $20 including that bet (required equity 4 / 24 = 16.7%), When hero's equity equals the required equity, Then advice recommends call [REQ-033.1]
- [x] #2 Given the same decision, When hero's equity is 0.1 percentage points below the required equity, Then advice recommends fold [REQ-033.1]
- [x] #3 Given any postflop decision, When advice is requested, Then it returns the action, equity % and required equity % to one decimal place and the id of the rule that fired [REQ-033.5]
- [x] #4 Given a postflop decision with no bet to face, When no betting rule fires, Then advice recommends check, required equity is 0% and the rule id is returned [REQ-033.5]
- [x] #5 Given the postflop rules design document, When the test suite runs, Then a consistency test fails if any rule id in the document has no unit test or any rule id returned by the engine is missing from the document [REQ-033.4]
- [x] #6 Given a fixed postflop decision point, When the other players' hole cards and the undealt cards are changed, Then the recommendation and both equity numbers are identical [REQ-025.2]
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
1. src/advice/postflop.ts: recommendPostflop(view, {equity?}) — opponents = live unfolded seats with every unseen combo; pot = pots + current-street contributions; required equity = call / (pot + call); rules check-free, pot-odds-call, pot-odds-fold on one-decimal rounded % (ties call); exact legal move.
2. src/advice/recommend.ts: Recommendation union by basis; recommend(view) dispatches preflop/postflop by street.
3. docs/advice/postflop-rules.md: one heading per rule id; consistency test checks ids match code and tests.
4. Tests: acceptance AC#1-6 (incl. hidden-card invariance, determinism), unit tests per rule, latency (perf scale pattern).

Full spec: doit/TASK-7.3/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Build: src/advice/postflop.ts (recommendPostflop; check-free/pot-odds-call/pot-odds-fold on rounded %), src/advice/recommend.ts (Recommendation union + recommend by street), docs/advice/postflop-rules.md, acceptance/unit/perf tests; p95 HU 5.4 ms, 6-max 12.9 ms, 10-seat 71.4 ms; gate PASS. Builder interpretation: AC#3 property draws a postflop stop point 0..11 so call/fold spots are covered, not only the first (free-check) flop decision.

CI run 44376112966 (head b4840a5): success. Judge round 1: PASS 15/15; 160 real random hands (flop/turn/river, 3-10 seats, folds) all correct; brute-force exact oracle agrees; 3133 holdout checks, 0 failures; playtest 10,000 hands 0 violations. Follow-ups (Step 6a): created TASK-7.22 (toPct nudge, AC#3 reaches river); ACs added to TASK-7.17 (all-in/side-pot pot odds), TASK-6.1 (TAG via recommend), TASK-7.8 (value fields), TASK-7.5 (action ranges), TASK-7.18 (9-opponent latency), TASK-8.1 (off main thread).

Correction (from TASK-7.22, doc-54): A-4's example 0.1665 rounds the same without toPct's +1e-9 nudge; the inputs the nudge actually changes are 0.5005..0.5115 (now pinned by tests/advice/postflop-coverage.acceptance.test.ts).

Locked test tests/advice/postflop.acceptance.test.ts re-pinned for TASK-7.8 Q-3 (auto-accepted; value betting).

Locked test re-pinned by TASK-7.9 Q-3 (auto-accepted; assertion count kept).

Locked test re-pinned by TASK-7.10 Q-3 (explanation key; auto-accepted; count kept).

Locked test re-pinned by TASK-7.13 Q-4 (opponentBasis key; count kept).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added postflop advice: recommendPostflop(view) compares hero equity with pot odds (call / pot after calling) using rounded one-decimal percentages, ties call, with rules check-free, pot-odds-call and pot-odds-fold. Also added recommend(view), which dispatches by street (user decisions Q-1 and Q-2). Rules are documented in docs/advice/postflop-rules.md, which the user should review, and a test ties its rule ids to the engine and the unit tests. Verification so far: lint, typecheck and npm test pass (151 passed), coverage 100% lines, 2 review rounds (r1 MAJOR on the untested rounded comparison fixed, r2 clean). Judge, the 10,000-hand playtest and the final CI run are pending. Latency p95 at real targets is HU 5 ms (target 25), 6-max 13 ms (50) and 10-seat 71.5 ms (100), so headroom at 9 opponents is thin (TASK-7.18). Please review assumptions A-1..A-8 in the story doc. Open follow-ups: two MINOR test gaps (toPct nudge, AC#3 never reaches the river), TASK-7.17, TASK-6.1, TASK-7.8, TASK-7.5, TASK-7.18, and running advice off the main thread (E08, REQ-055.6).
<!-- SECTION:FINAL_SUMMARY:END -->
