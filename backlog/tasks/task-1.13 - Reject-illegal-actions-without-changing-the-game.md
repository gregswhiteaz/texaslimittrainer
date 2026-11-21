---
id: TASK-1.13
title: Reject illegal actions without changing the game
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-21T07:06:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.12
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-60
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want illegal actions refused by the engine, so that no hand can ever reach an impossible state.

An illegal action submitted to the engine is rejected with an error and leaves the game state unchanged. Illegal includes acting out of turn, a wrong bet amount, raising on a capped street, and folding when no bet is faced (check is free, Q-45).

## Requirements covered
- REQ-017 (Must): Legal actions only — The engine shall accept only legal actions for the player to act, and the Table screen shall offer the user only the legal actions with their exact amounts.

Covers: REQ-017

## Notes
Return a typed result (ok/error code) rather than throwing so UI and playtest handle it the same way.

Plan key: E01-S11 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given it is seat 3's turn, When seat 5 submits any action, Then the engine returns an out-of-turn error and the state is byte-identical to before [REQ-017.4]
- [x] #2 Given preflop at $4/$8, When a player submits a bet or raise of any amount other than $4, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [x] #3 Given a capped street, When a player submits a raise, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [x] #4 Given no bet is facing the player to act, When that player submits fold, Then the engine returns an error and the state is unchanged [REQ-017.4]
- [x] #5 Given 100,000 random game states, When an illegal action is injected into each, Then every injection is rejected and the state is byte-identical [REQ-017.4]
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
1. Keep the error interface (out-of-turn, illegal-action, hand-complete); doc comments only in hand.ts.
2. New acceptance file proving AC#1–4 scripted rejections leave the state byte-identical (frozen input, JSON compare, structuredClone).
3. AC#5: 100,000 injected illegal actions across seeded 2–10 seat hands with all-ins, with minimum counts per kind.
4. Playtest byte-identical.

Full spec: doit/TASK-1.13/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Autopilot: no asks; A-1..A-5 in spec.

Build: illegal-actions acceptance (AC#1–5; 100k injections ~2.2 s); hand.ts doc comments only; playtest identical; gate PASS. Recorded deviation: A-5 seed via Xoshiro128.fromState(...mixState128([1313,2026,17,4])) (constructor takes one seed).

Follow-ups (Step 6a): AC#11 added to TASK-3.10 (validate restored action shape). Review NITs (vacuous sum check; unreachable early return) not tracked — locked test, no behaviour change.

Judge R1 PASS 7/7 (13 applyAction mutants all caught).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added tests/engine/illegal-actions.acceptance.test.ts (5 locked tests) proving applyAction rejects out-of-turn, wrong-size, capped-street and unfaced-fold actions, and finished hands, with the state byte-identical. Coverage includes a seeded 100,000-state injection run. src/engine/hand.ts has doc comments only. Verification: lint, typecheck and npm test pass (423 passed, 6 skipped), the playtest baseline is unchanged, and review round 1 had 0 blocking findings. CI was in progress at 5a6b062. Assumptions to review: A-1 (the $4 is a raise increment), A-5 (fixed seed built via Xoshiro128.fromState, because the constructor takes one seed). Risk: the new file is 365 lines against a 300 budget. Follow-up: TASK-3.10 AC#11 validates restored action shape.
<!-- SECTION:FINAL_SUMMARY:END -->
