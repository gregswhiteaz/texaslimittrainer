---
id: TASK-3.4
title: See who won each hand and get the next hand dealt automatically
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-24T16:41:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-0
dependencies:
  - TASK-3.3
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-25
parent_task_id: TASK-3
priority: high
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want to see the result of each hand before the next one is dealt, so that I know how every hand ended and keep practising without extra clicks.

When a hand ends the table shows each winner with the pot amount won and, when there was a showdown, the winning hand's name (e.g. "Pair of kings"). A pot won uncontested shows the winner and amount but no hand name. A split pot shows each winner with their share. While the Hand Review panel is not open (it does not exist until E09; later: the user folded preflop or auto-open is off), the next hand is dealt 1.5 s after the result is shown. E09 adds REQ-024.2 (wait for Deal next hand while the panel is open).

## Requirements covered
- REQ-019 (Must): Showdown and pot award — At showdown, the engine shall rank each eligible player's highest-ranking five-card hand from their two hole cards and the five board cards, award each pot to its highest-ranked eligible hand, and split tied pots equally.
- REQ-024 (Must): Between hands — When a hand ends, TLH Trainer shall show the result, and shall deal the next hand only after the user clicks Deal next hand if the Hand Review panel is open, or automatically after 1.5 seconds if it is not.

Covers: REQ-019, REQ-024

## Notes
E09 must stop the automatic deal while its panel is open (REQ-024.2) by gating the same next-hand timer.

Plan key: E03-S04 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a hand that reaches showdown where Ben wins $122 with a pair of kings, When the hand ends, Then the result shows "Ben", "$122" and "Pair of kings" [REQ-024.1, REQ-019.7]
- [x] #2 Given a hand in which every other player folds to Ava's bet, When the hand ends, Then the result shows Ava and the amount won, and no hand name and no hole cards of Ava [REQ-024.1]
- [x] #3 Given a showdown where two players tie with a straight for a $60 pot, When the hand ends, Then the result shows both winners with $30 each and "Straight" [REQ-024.1, REQ-019.7]
- [x] #4 Given the Hand Review panel is not open, When the result is shown, Then the next hand is dealt 1.5 s after the result appears (measured within 1.4-1.6 s) with no user input [REQ-024.3]
- [x] #5 Given a hand has ended and the next hand is dealt, When stacks carry over, Then the dealer button moves one seat, each seat starts with its final stack from the previous hand, and a seat below the engine's minimum stack is handled by a defined rule (rebuy prompt, bot replacement, or a relaxed createHand minimum) instead of a RangeError
- [x] #6 Given completedHand in src/table/session.ts, When the hand-over flow is extended, Then its unreachable fallbacks (the '?? 0' and the 'User seat is not dealt in' throw) are removed or covered by a test
- [x] #7 Given the next hand is dealt, When the header is shown, Then TableState.handNumber has increased by one (Hand #2, #3, ...), the pot line shows the decided value after the award, and the unreachable '?? 0' stack fallback in src/table/table-view.ts is removed or covered
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
1. src/engine/hand.ts: export minimumStack(stakes), used by validate (only engine change).
2. src/table/session.ts: TableState.button moves one seat clockwise each hand; nextHand(t) carries final stacks, increments handNumber and applies the TEMPORARY top-up to $160 for any seat below minimumStack (Q-4, code comment names the removal task); completedHand fallbacks become explicit throws.
3. src/table/hand-result.ts: handResultView from hand.result only — one line per winner summed per seat ('Ben wins $122 · Pair of kings'), no hand name when uncontested, split shares, winners' hole cards only (Q-2, Q-3); hand names per Q-1 from card ranks.
4. UI: 'Hand over' result box under the action bar; pot shows $0 after award; next hand dealt NEXT_HAND_DELAY_MS = 1500 after the result via a gate-able nextHandDelay/holdNextHand (for TASK-9.1); onHandComplete guarded by handNumber.
5. Cross-story test edits E1–E4 (spec §5, D-2): no assertion removed.
6. Tests: hand-name unit tests for every category, result view, carry-over/button/top-up, e2e 1.4–1.6 s auto-deal on the paused clock in Chromium + WebKit, axe.

Full spec: doit/TASK-3.4/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.1 follow-up (doc-21).

AC added from TASK-3.3 follow-up (doc-24).

Cross-story change (orchestrator D-2 on precedent): exactly the edits E1–E4 listed in spec §5 (e2e/table.spec.ts showdown and fold tests, e2e/action-bar.spec.ts real-timer context, tests/support/table-scenarios.ts button). No other assertion may be removed or weakened. User Q-4: the short-stack top-up is TEMPORARY; its removal becomes a testable AC on TASK-1.16/TASK-3.11 in Step 6a.

Build: minimumStack export (only engine change); nextHand (carry stacks, button +1, handNumber +1, TEMPORARY top-up to $160 below minimum per Q-4); hand-result.ts (winner lines, hand names per Q-1, winners' cards only per Q-3); 'Hand over' result row, pot $0 (Q-2); 1.5 s auto-deal gate-able for TASK-9.1; E1–E4 test edits only; e2e 80 passed Chromium + WebKit; playtest 0 violations; gate PASS. Screenshots: doit/TASK-3.4/result-showdown.png, result-uncontested.png.

CI run 44433546149 (head 85b221c): success. Judge round 1: PASS 20/20, no blocking; 26 consecutive hands in the real app per browser matched a Node simulation (results, 1.4-1.6 s deals, button, Hand #, carry-over, top-up of the user to exactly $160 at hand 13); 30,000 random hands named correctly; 3,000 session hands' winner lines equal awards; only winners' cards ever shown. Follow-ups (Step 6a): created TASK-3.21 (remove the TEMPORARY top-up; depends on TASK-1.9/1.16/3.11, as promised to the user in Q-4; notes on TASK-1.16 and TASK-3.11) and TASK-3.22 (hand-result edge cases); ACs added to TASK-9.1, 6.8, 1.15, 1.9, 3.8, 3.9, 3.16, 3.13. Judge LOW J-1-01 (doc labels D-1/D-3..D-6) noted; D-6 is covered by the TASK-3.13 AC.

Locked e2e test unlocked for TASK-1.52 Q-2 (user-approved; clock-advance loop bound only).

Locked test edited for TASK-6.8 Q-4 (user-approved): bots are replaced, not topped up.

Locked test e2e/next-hand.spec.ts edited for TASK-2.5 (Q-2 routine + Q-3 user-approved).

Locked test tests/table/next-hand.acceptance.test.ts re-pinned for TASK-7.8 Q-3 (auto-accepted; value betting).

Locked test tests/table/next-hand.acceptance.test.ts unlocked for TASK-3.21 Q-2 (top-up removal re-pin, same expect count).

Locked e2e/next-hand.spec.ts unlocked for TASK-10.1 D-4 (Leave table ends the session; expectation replaced, not loosened).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Built: result block (winner, amount, hand name; uncontested and split pots), 1.5 s auto-deal of the next hand with carried stacks, moving button and Hand #n header, holdNextHand seam for E09, and A-5 throws replacing the unreachable fallbacks. Verified: lint, typecheck, npm test and 80 e2e (Chromium+WebKit) pass; 10000-hand playtest clean; review r1 MAJOR (full house with pair above trips untested) fixed in r2, security clean; Judge and final CI pending. Assumptions to review: A-1..A-10 in the story doc, plus D-2 edits E1-E4 to earlier tests. Risks: Q-4 top-up to $160 for seats below $96 is TEMPORARY until all-ins exist (REQ-007.4 bent); removal AC goes to TASK-1.16/TASK-3.11. Size 1152 lines/15 files vs 1150 (warn). Follow-ups: TASK-9.1, 6.8, 1.15, 1.9, 3.8, 3.9, 3.16, 3.13, plus two MINOR test gaps. Screenshots: doit/TASK-3.4/result-showdown.png, result-uncontested.png.
<!-- SECTION:FINAL_SUMMARY:END -->
