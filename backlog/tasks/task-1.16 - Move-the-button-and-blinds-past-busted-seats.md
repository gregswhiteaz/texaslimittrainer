---
id: TASK-1.16
title: Move the button and blinds past busted seats
status: Done
assignee:
  - '@claude'
created_date: '2026-11-17T22:46:00Z'
updated_date: '2026-11-25T01:04:00Z'
labels:
  - dream-limit-holdem-trainer
milestone: m-1
dependencies:
  - TASK-1.11
  - TASK-1.9
  - TASK-1.10
  - TASK-1.14
  - TASK-1.15
references:
  - dreams/limit-holdem-trainer/requirements.md
documentation:
  - doc-1
  - doc-2
  - doc-63
parent_task_id: TASK-1
priority: high
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
As a learner, I want positions to rotate after each hand to the next players who have chips, so that positions rotate correctly as players bust.

After each hand the button moves to the next seated player with chips and the next two such players post the blinds. Seats with no chips (busted in a sit-and-go) are skipped. No missed or dead blinds. When play becomes heads-up, heads-up rules apply from the next hand. A player who cannot cover a blind posts all their chips and is all-in. The playtest gains an interim `--game sng` mode: every seat starts with 1,500 chips (REQ-008.1) at fixed Level 1 limits 20/40 with blinds 10/20, busted seats are not refilled, and a new sit-and-go starts when one player holds all chips. E05 adds the rising level schedule to this same mode (it must not create a second sng mode). This story is the last of the M2 all-in rule stories (S12-S15 are its deps), so it also switches the cash playtest from the interim $160-per-hand reset to real stacks.

## Requirements covered
- REQ-018 (Must): All-in and side pots — When a player cannot match a bet, the engine shall let that player call all-in for the chips they have and shall create side pots so that each player can win only the amounts they matched.
- REQ-020 (Must): Button and blind movement — After each hand, the engine shall move the button to the next seated player who has chips, and the next two such players shall post the small and big blinds.
- REQ-056 (Must): Reliability and invariants — The engine shall complete 1,000,000 headless hands across all table sizes, game types and line-ups with zero invariant violations, and the app shall recover from an unexpected error without losing completed hands.
- REQ-062 (Must): Headless playtest CLI — The project shall provide a command-line playtest runner that plays seeded bot-only hands with the production engine, checks invariants after every action and reports results.

Covers: REQ-018, REQ-020, REQ-056, REQ-062

## Notes
E05 adds the rising level schedule (REQ-008.2/008.3) to this playtest sng mode and owns sit-and-go coverage of the 1,000,000-hand run in M3.

Plan key: E01-S16 · Dream: limit-holdem-trainer
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Given a 6-player hand ends with the button at seat 1 and all seats holding chips, When the next hand starts, Then the button is at seat 2 and seats 3 and 4 post the blinds [REQ-020.1]
- [x] #2 Given seat 3 has no chips and the button is at seat 1, When the next hand starts, Then seat 3 is skipped: the button is at seat 2 and seats 4 and 5 post the blinds [REQ-020.1]
- [x] #3 Given a player busted while due to post the big blind next hand, When the next hand starts, Then no player posts a missed or dead blind and only one small blind and one big blind are posted [REQ-020.2]
- [x] #4 Given three players remain and one busts, When the next hand starts, Then the button posts the small blind and acts first preflop [REQ-020.3]
- [x] #5 Given a player with $1 due to post the $2 small blind, When blinds are posted, Then that player posts $1 and is all-in [REQ-020.4]
- [x] #6 Given `npm run playtest -- --hands 10000 --game sng --seed 42`, When it runs, Then every sit-and-go starts each seat with 1,500 chips at 20/40 limits, busted seats are never refilled and are skipped for button and blinds, a new sit-and-go starts when one player holds all chips, and zero invariant violations are reported [REQ-062.1, REQ-020.1]
- [x] #7 Given `npm run playtest -- --hands 10000 --seed 42` (cash), When hands are played, Then every seat keeps its real stack between hands, only a busted seat is restored to the $160 buy-in, short-stack all-ins and side pots occur, and zero invariant violations are reported [REQ-056.1, REQ-018.5]
- [x] #8 Given --game sng and --game cash with the same --seed, When both runs deal hand k, Then their replay codes differ in word 2 and are otherwise derived from seed and k
- [x] #9 Given consecutive playtest hands, When the next hand starts, Then each seat's starting stack equals its final stack from the previous hand (cross-hand chip check)
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
1. Engine: nextButton skipping busted seats; heads-up transition; all-in blinds (floor 1, short BB keeps full blind level — Q-1); deal-out when nobody can bet; no BB option vs all-ins.
2. Playtest cash: stacks carry between hands, busted seats rebuy ; cross-hand chip check.
3. Playtest --game sng: 1,500 chips at 20/40, no refills, restart when one player has all chips; replay word 2 = 1 (Q-3).
4. CLI flags/text per Q-2; deal-time violations reported 'at the deal'.
5. Locked-test edits E1–E6 (Q-4); new deterministic cash and sng baselines recorded.

Full spec: doit/TASK-1.16/spec.md
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC added from TASK-1.6 follow-up (doc-15): replay-code word 2 is reserved (0) for the game type.

AC added from TASK-1.8 follow-up (doc-16).

TASK-3.4 Q-4 interim top-up to $160 must be removed once this and the other all-in/rebuy stories land: tracked as TASK-3.21.

Autopilot Q-1..Q-4 auto-accepted (qa.md); unlocks under TASK-1.31, 1.21, 1.6, 1.11.

Build: button/blinds skip busted seats, all-in blinds, deal-out/no-BB-option vs all-ins, checkDeal cross-hand check, cash carry-over + rebuy, --game sng, replay word 2; E1–E7 locked edits (E7 via Q-5); SPEC-10 threshold per Q-6; new baselines cash 5461/4539/88746/242/$70/0 and sng 8061/1939/57692/870/$880/0; gate PASS. Recorded deviations Q-5, Q-6. Unlocked cli.test source-text check replaced by a behaviour test.

Review R1: MAJOR (C5 in checkDeal untested) + MINOR (restart trigger) fixed test-only; mutants caught; gate PASS.

Follow-ups (Step 6a): AC added to TASK-5.4 (multi-restart sng coverage). Session top-up removal stays TASK-3.21; sng levels TASK-5.4; finishing positions/user bust/chip display stay in TASK-5.x (existing). CI sng playtest: infra, not tracked.

Judge R1 PASS 18/18; deviations Q-5/Q-6 accepted on substance; 15/15 mutants caught. J-1-01 LOW (playtest Largest pot counts returned chips — deliberate since TASK-1.9 SPEC-14) not tracked.

Locked test tests/playtest/games.acceptance.test.ts: heavy run moved to opt-in slow group for TASK-7.8 (D-7), smaller every-push version kept.

Locked test(s) unlocked for TASK-7.32 Q-1 (user-approved advice/bot fix; expected values re-pinned one-for-one).

TASK-7.32: tests/playtest/games.acceptance.test.ts AC#6 in-process sit-and-go input seed changed 42 → 7 (with bots on action ranges, seed 42 no longer finishes a sit-and-go within 10,000 hands; seed 7 finishes at hand 5,732). Stated behaviour unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Button and blinds now skip busted seats (nextButton), blinds are all-in capable (short blind posts all it has; others call the full blind; hands with nobody to bet against are dealt out at the deal; stack floor is $1). The playtest carries stacks: cash rebuys a $0 seat for $160, new --game sng (1,500 chips, 20/40, no refills, new sit-and-go when one player holds all chips); replay-code word 2 = 0 cash / 1 sng; checkDeal verifies each seat starts with its previous final stack.
Verification: lint, typecheck and npm test pass (130 files, 465 passed, 97.38% lines); gates build-1/fix-2/fix-3 PASS; cash and sng 10,000-hand seed-42 playtests exit 0 with 0 violations and are byte-identical on rerun (new baselines are in the doc). Review: 1 MAJOR (C5 test gap) + 1 MINOR fixed test-only in round 2 with mutants caught; security clean; reviewer fuzz of 20k engine hands and 12k replays was clean.
Review assumptions A-1..A-8 and auto-accepted Q-1..Q-4, plus mid-build deviations Q-5 (E7: bet-cap test counts only REQ-016.5 counted bets) and Q-6 (SPEC-10 needs at least 1 completed sit-and-go plus a fresh restart; seed 42 completes only 1).
Risks/follow-ups: TASK-3.21 still owns removing the session's $160 top-up (session.ts untouched); TASK-5.4 extends sng levels; size was 1,325 lines in 18 files against a budget of 1,250 and 16.
<!-- SECTION:FINAL_SUMMARY:END -->
