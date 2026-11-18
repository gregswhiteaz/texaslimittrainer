---
id: TASK-7.3
title: Recommend call or fold after the flop from equity and pot odds
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-18T18:53:00Z'
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
- [ ] #1 Given a flop decision facing a $4 bet with a pot of $20 including that bet (required equity 4 / 24 = 16.7%), When hero's equity equals the required equity, Then advice recommends call [REQ-033.1]
- [ ] #2 Given the same decision, When hero's equity is 0.1 percentage points below the required equity, Then advice recommends fold [REQ-033.1]
- [ ] #3 Given any postflop decision, When advice is requested, Then it returns the action, equity % and required equity % to one decimal place and the id of the rule that fired [REQ-033.5]
- [ ] #4 Given a postflop decision with no bet to face, When no betting rule fires, Then advice recommends check, required equity is 0% and the rule id is returned [REQ-033.5]
- [ ] #5 Given the postflop rules design document, When the test suite runs, Then a consistency test fails if any rule id in the document has no unit test or any rule id returned by the engine is missing from the document [REQ-033.4]
- [ ] #6 Given a fixed postflop decision point, When the other players' hole cards and the undealt cards are changed, Then the recommendation and both equity numbers are identical [REQ-025.2]
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
1. src/advice/postflop.ts: recommendPostflop(view, {equity?}) — opponents = live unfolded seats with every unseen combo; pot = pots + current-street contributions; required equity = call / (pot + call); rules check-free, pot-odds-call, pot-odds-fold on one-decimal rounded % (ties call); exact legal move.
2. src/advice/recommend.ts: Recommendation union by basis; recommend(view) dispatches preflop/postflop by street.
3. docs/advice/postflop-rules.md: one heading per rule id; consistency test checks ids match code and tests.
4. Tests: acceptance AC#1-6 (incl. hidden-card invariance, determinism), unit tests per rule, latency (perf scale pattern).

Full spec: doit/TASK-7.3/spec.md
<!-- SECTION:PLAN:END -->
