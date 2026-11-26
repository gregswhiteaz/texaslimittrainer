---
id: TASK-6.1
title: Face TAG bots that act from the advice engine
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-26T00:07:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-7.2
  - TASK-7.3
  - TASK-1.6
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-18
parent_task_id: TASK-6
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want TAG opponents that choose their actions from the advice engine's evaluation of their own view, so that I practise against sound, consistent fixed-limit play from the first hand.

Thinnest bot slice for the walking skeleton. A bot is a decision function: PlayerView (E01-S06) in, one legal action out. The TAG bot asks the advice engine for its recommendation (6-max preflop chart, E07-S01; postflop call/fold from equity and pot odds, E07-S03) and plays it. Advice recommendations are always legal (a raise on a capped street becomes call; a call with nothing to call becomes check). In this slice TAG always plays the main recommendation; the mixing rule (REQ-028) that sometimes picks the chart's acceptable alternative arrives in E06-S02. The playtest CLI (E01-S07) seats TAG bots in every seat instead of the seeded random-legal-move policy, and the Table screen (E03) seats them opposite the user.

## Requirements covered
- REQ-025 (Must): No hidden-information leakage — The engine shall give each bot, the advice engine and the grader only the information the acting player could see at that moment: their own hole cards, the board, all actions and stacks, and cards shown at earlier showdowns.
- REQ-026 (Must): Bots built on the advice engine — Each bot shall choose its action from the advice engine's evaluation of its own view of the game, modified by its style's documented parameters.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.

Covers: REQ-025, REQ-026, REQ-056

## Notes
Suggested API: decide(view: PlayerView, style: StyleParams, rng: SeededRng) -> Action in src/bots. The bot calls the same advice API as hints, never a separate strategy. E03 seats these bots at the default 6-max $4/$8 table.

Plan key: E06-S01 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a TAG bot at a 6-max preflop decision, When it acts, Then its action is the 6-max chart recommendation for its hand class, position and situation [REQ-026.1]
- [x] #2 Given a TAG bot at a postflop decision facing a bet, When the advice engine recommends call, Then the bot calls, and When it recommends fold, Then the bot folds [REQ-026.1]
- [x] #3 Given a TAG bot at a postflop decision with no bet to face, When the advice engine recommends check, Then the bot checks [REQ-026.1]
- [x] #4 Given a fixed TAG decision point, When the other players' hole cards and the undealt cards are changed, Then the TAG bot's action is identical [REQ-025.1]
- [x] #5 Given `npm run playtest -- --hands 10000 --seed 42`, When it runs, Then every seat is a TAG bot acting from the advice engine, every bot action is in the legal set, zero invariant violations are reported and it exits 0 [REQ-026.1, REQ-056.1]
- [x] #6 Given a TAG bot seat in the playtest, When it decides, Then it acts through recommend(view) on every street and returns the recommendation's move
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
1. src/bots/tag.ts: decideTag(view, options?) and tagPolicy (SeatPolicy) playing recommend(view).move on every street; postflop with nothing owed uses FREE_CHECK_EQUITY stand-in (Q-2); imports only engine/advice types (headless, PlayerView only).
2. src/playtest/runner.ts: defaultPolicyFactory(size) — TAG in every seat at size 6, seeded random-move elsewhere until TASK-7.6 (Q-1); makePolicy seam still overrides; doc comments updated.
3. Node type-stripping fixes: src/advice/equity.ts parameter property, src/advice/preflop.ts JSON import attribute (A-4).
4. Tests: acceptance AC#1-6 (legal moves, determinism, free-check equality vs real equity, default playtest seats are TAG, CLI byte-identical to in-process TAG seam), unit tests, boundary source check.

Full spec: doit/TASK-6.1/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-7.3 follow-up (doc-17).

Build: src/bots/tag.ts (decideTag/tagPolicy via recommend; FREE_CHECK_EQUITY stand-in on free postflop checks), runner defaultPolicyFactory (TAG at size 6, random elsewhere), A-4 type-stripping fixes in equity.ts/preflop.ts; playtest 10,000 hands 0.6 s, 0 violations; gate PASS.

CI run 44381664524 (head e7cd337): success first push incl. Playtest (all-TAG at 6). Judge round 1: PASS 13/13; 250 preflop + 89 facing-bet + 91 free-check decisions equal recommend(view).move; 480 re-deals never changed TAG's action; other sizes byte-identical to base; A-4 fixes behaviour-neutral (797 advice outputs hash-identical). Follow-ups (Step 6a): created TASK-1.28 (type-stripping load test); ACs added to TASK-6.9 (betting line-up at 6 players), TASK-7.8 (remove FREE_CHECK_EQUITY), TASK-7.6 (TAG at all sizes), TASK-6.21 (lint rule replaces SPEC-09 scan, covers export-from/side-effect/dynamic imports). Skipped: NIT redundant type annotation.

Locked test tests/bots/tag.acceptance.test.ts re-pinned for TASK-7.8 Q-3 (auto-accepted; value betting).

Locked test tests/bots/tag-playtest.acceptance.test.ts: heavy run moved to opt-in slow group for TASK-7.8 (D-7), smaller every-push version kept.

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).

Locked test(s) unlocked for TASK-7.18 Q-3: one vi.setConfig({ testTimeout: 30_000 }) line added after the global testTimeout was removed; no assertion touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the TAG bot (src/bots/tag.ts): plays recommend(view).move; free postflop checks skip equity via a zero-equity stand-in (user Q-2: 10,000 hands ~94 s -> 0.6 s). Playtest default seats TAG at 6 players, seeded random-move at other sizes until TASK-7.6 (user Q-1). Also fixed two Node type-stripping blockers (equity.ts parameter property, preflop.ts JSON import attribute) that stopped the playtest loading advice at all.
Verification: npm test 161 passed/1 skipped, coverage 100% lines, lint and typecheck clean; playtest 10,000 hands seed 42 exit 0, 0 violations, 0.6 s. Review r1: no blocking findings, 4 mutants killed. Judge and CI pending.
Review assumptions A-1..A-7 (doc). Risks: all-TAG 6-max never bets postflop until TASK-7.8; size 647 vs 600 budget (warn); SPEC-09 import scan has gaps until TASK-6.21 lint rule.
<!-- SECTION:FINAL_SUMMARY:END -->
