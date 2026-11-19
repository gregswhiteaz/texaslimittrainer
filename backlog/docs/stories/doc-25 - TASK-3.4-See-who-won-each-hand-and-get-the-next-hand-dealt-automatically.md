---
id: doc-25
title: 'TASK-3.4: See who won each hand and get the next hand dealt automatically'
type: other
created_date: '2026-11-19T00:58:00Z'
updated_date: '2026-11-19T00:58:00Z'
---
# TASK-3.4: See who won each hand and get the next hand dealt automatically

Status: Built, reviewed and gated; Judge and final CI run pending · Completed: pending (2026-11-18 build) · Epic: TASK-3 — Play hands at the table · Milestone: m-0 · Requirements: REQ-019.7, REQ-024.1, REQ-024.3 (REQ-007.1, REQ-007.4, REQ-020.1 touched by AC#5) · Branch: doit/TASK-3.4

## What was asked
When a hand ends, the table shows who won, how much, and (after a showdown) the winning hand's name. An uncontested pot shows the winner and amount only. A split pot shows each winner's share. With no input, the next hand is dealt 1.5 s later: stacks carry over, the button moves one seat, and the header counts up (Hand #2, #3 ...). This replaces TASK-3.1's "one hand per load". Seven ACs; AC#5 also requires a defined rule for a seat below the engine minimum stack, and AC#6/#7 require the unreachable `?? 0` / throw fallbacks in `completedHand` and `tableView` to be removed or covered. Spec: doit/TASK-3.4/spec.md.

Screenshots (1280x720, Chromium): doit/TASK-3.4/result-showdown.png and doit/TASK-3.4/result-uncontested.png.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | The 1.5 s timer calls `nextHand` and deals in one state update (`dealHand(nextHand(t), code)`); the replay code is drawn inside the timer callback. | yes | The deal lands exactly 1500 ms after the result; no empty between-hands table renders. | Two steps: nextHand, then a 0 ms deal step |
| A-2 | Button moves to the next higher seat number, wrapping. No seat is skipped (the Q-4 top-up keeps every seat at or above the minimum). | yes | AC#5 says "moves one seat"; skipping busted seats is TASK-1.16. | Skip seats below the minimum |
| A-3 | E09 seam: pure `nextHandDelay(table, hold)` plus `holdNextHand?: boolean` on `useTableSession` (default false). While true no timer is pending; when false a fresh 1.5 s timer starts. | yes | TASK-9.1 gates the same timer; a pure function is unit-testable (Vitest env is node, no hook harness). | A `dealNext()` callback now |
| A-4 | `onHandComplete` fires once per hand, keyed on `handNumber` instead of `replayCode`. | yes | Hands can share a code (the e2e stub returns the same words every draw). | Keep the replayCode key |
| A-5 | AC#6/#7 fallbacks become explicit throws with unit tests: `RangeError('Seat <n> is not dealt in')` in `completedHand`, `RangeError('Seat <n> has no stack')` in `tableView`. | yes | A silent 0 would be a wrong value; a throw states the invariant. | Non-null casts |
| A-6 | A winner's amount is the engine's award share, including the winner's own chips (Ava's uncontested $4 flop bet is inside "Ava wins $16"). | yes | Matches the storyboard; TASK-1.9 AC#5 changes uncalled bets later. | Show only opponents' chips |
| A-7 | Winners are listed in engine award order (clockwise from left of the button); a seat in several awards gets one summed line. | yes | Deterministic; per-pot lines are TASK-3.8. | Ascending seat order |
| A-8 | `minimumStack(stakes)` (8 x small bet + 8 x big bet) is exported from `src/engine/hand.ts` and used by `validate`. | yes | One shared number; no behaviour change. | Duplicate the formula |
| A-9 | The result block sits where "Hand over" was (after the action bar), colours `#F2F3F5`/`#A7AEB8` on `#1A1D22`, `1px solid #343A43` border, 10 px radius. | yes | Earlier e2e locators find it there; branded layout is TASK-3.16. | Put it on the felt (Review storyboard) |
| A-10 | Scripted result states for Vitest are built in `tests/support/table-scenarios.ts` with a fixed-deck helper; e2e expected values for the pinned words were checked by running the engine. | yes | Deterministic tests. | Compute expectations inside the e2e test |

## Clarifications and decisions
- **Q-1 Hand names (REQ-019.7).** User chose detail for pairs and sets: "Ace high", "Pair of kings", "Two pair, kings and nines", "Three of a kind, sevens", "Full house, kings over nines", "Four of a kind, sevens"; plain "Straight", "Flush", "Straight flush".
- **Q-2 Result display.** User chose a "Hand over" block with one line per winner ("Ben wins $122 · Pair of kings", "Ava wins $16" with no hand name); split pots show one line per winner with their share; the pot line stays "Pot $0" after the award.
- **Q-3 Hole cards.** Showdown winners' two cards only; a loser's cards are never shown.
- **Q-4 Seat below the engine minimum ($96 at $4/$8).** The user asked for clarification (told it is interim until all-ins exist, and that removal would be a Backlog AC with a test), then chose: **top every seat below the minimum back to $160, as an interim rule.** This is TEMPORARY. It bends REQ-007.4 (nothing is stored or reported yet). Commitments made to the user:
  1. The top-up in `nextHand` carries a code comment naming the task that removes it. Done: the comment starts `TEMPORARY (TASK-3.4 Q-4)` in `src/table/session.ts`.
  2. In Step 6a the orchestrator adds this AC to whichever of TASK-1.16 / TASK-3.11 lands last: "Given a seat below the old $96 minimum, When the next hand is dealt, Then its stack is not topped up — it plays its chips (or goes to Rebuy / bot replacement at $0) — and the interim top-up in nextHand is removed." Its test deals a hand after a seat ends at $95, asserts it starts with $95, and asserts `session.ts` no longer contains `TEMPORARY (TASK-3.4 Q-4)`. SPEC-10 and SPEC-11 of this story are updated at the same time. Status: pending, to be added in Step 6a.
- **D-2 Edits to earlier stories' locked tests (orchestrator, not asked).** E1–E4: E1 `e2e/table.spec.ts` (paused clock, 28 x 50 ms instead of a 3 s wait, because the auto-deal replaces TASK-3.1's "no new hand after 3 s"); E2 `e2e/table.spec.ts` (bots-finish test on a paused clock, `nextTurnPaused`); E3 `e2e/action-bar.spec.ts` (second context on its own paused clock); E4 `tests/support/table-scenarios.ts` (`button: 6` in `tableAt`, new required field). Decided on precedent (TASK-2.1 Q-3, TASK-3.2 Q-1, TASK-3.3 D-5). No assertion removed or weakened; the code reviewer verified this in round 1.
- **Builder choices.** Layout: the result is a compact one-row block with 30x42 shown cards so it fits 1280x720 without scrolling. `nextTurnPaused` in the e2e support gained a `'timeout'` return value; the reviewer judged this fine.

## What was built
Flow: hand ends -> `handResultView` builds the result -> `Table.tsx` shows the "Hand over" block -> `useTableSession` starts a 1500 ms timer (unless `holdNextHand`) -> `dealHand(nextHand(t), code)` deals the next hand with carried stacks, moved button and `handNumber + 1`.

- `src/table/hand-result.ts` (new) — headless `handName`, `handResultView`, `WinnerView`, `HandResultView`. Only winners' cards are exposed.
- `src/table/session.ts` — `TableState.button`, `NEXT_HAND_DELAY_MS = 1500`, `nextHandDelay`, `nextHand` (throws `'Not a next-hand step'` unless the hand is done; contains the TEMPORARY Q-4 top-up to $160), `dealtIn` helper (A-5).
- `src/table/table-view.ts` — dealer marker falls back to `table.button`; stack helper throws instead of `?? 0`.
- `src/engine/hand.ts` — exports `minimumStack` (no behaviour change).
- `src/ui/table/useTableSession.ts` — next-hand timer, `holdNextHand` option, `onHandComplete` keyed on `handNumber`.
- `src/ui/table/Table.tsx`, `src/ui/styles.css` — `HandResult` block and `.hand-result` styles.
- Tests: `tests/table/hand-result.test.ts`, `tests/table/next-hand.test.ts`, `tests/table/next-hand.acceptance.test.ts`, `tests/ui/hand-result.acceptance.test.tsx`, `e2e/next-hand.spec.ts` (Chromium + WebKit), plus D-2 edits and scenario states in `tests/support/table-scenarios.ts`.
- No new dependencies. Configuration: `NEXT_HAND_DELAY_MS = 1500`, `holdNextHand` default `false`.

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..03 | AC#1-3 showdown, uncontested, split | `tests/ui/hand-result.acceptance.test.tsx` | pass | gates/fix-3.json |
| SPEC-04, 07, 14 | live result, 1.5 s deal, no early deal, Leave during result | `e2e/next-hand.spec.ts` (Chromium + WebKit) | pass | build-log (80 e2e passed, run twice) |
| SPEC-05, 06 | hand names, result model, hidden info | `tests/table/hand-result.test.ts` | pass | review r2 |
| SPEC-08, 12, 15 | hold seam, A-5 throws, nextHand guard | `tests/table/next-hand.test.ts` | pass | gates |
| SPEC-09..11, 13 | carry-over, button, Q-4 rule, 60 hands, header/pot | `tests/table/next-hand.acceptance.test.ts` | pass | gates |
| SPEC-16 | earlier flows with E1-E4 | Playwright on table/action-bar/display/home/cards specs | pass | build-log |
| SPEC-17 | lint, typecheck, tests, coverage, boundary | `npm run lint && npm run typecheck && npm test` | pass | gates build-1, fix-2, fix-3 |
| SPEC-18 | playtest clean after refactor | `npm run playtest -- --hands 10000 --seed 42` | pass, 0 violations | build-log |
| SPEC-19 | CI green, docs published | CI run on branch | pending | — |
| SPEC-20 | no strategy content; TASK-7.11/13.4 not Done | Judge | pending | — |

Locked acceptance tests (hashes in state.json): `e2e/next-hand.spec.ts`, `tests/table/next-hand.acceptance.test.ts`, `tests/ui/hand-result.acceptance.test.tsx`. Gates: three runs, all PASS (scope-lines check warns). Judge rounds: 0 so far (pending).

## Review
- Round 1, code reviewer: one MAJOR. SPEC-05 never tested a full house whose pair ranks above its trips (e.g. 555KK), so two mutants (`withAtLeast(2)[1]` giving "fives over fives", and `find(rank => rank < trips)` giving "fives over undefined") survived. Fix: two examples added in `tests/table/hand-result.test.ts` (`5h 5s` + `5c Kd Kh 2c 3d`, and + `5c Kd Kh Qc Qd`, both "Full house, fives over kings"). Round 2: both mutants killed; no assertions removed.
- Security: clean in both rounds.

### Non-blocking review notes (deliberately not fixed)
- MINOR `tests/table/hand-result.test.ts:27`: the only high-card example lists its top card first, so a mutant naming the first card instead of the highest rank would pass. Suggested example: `['9c 2d', 'Ks Jd 6c 4h 3s', 'King high']`.
- MINOR `src/table/hand-result.ts:83`: the `RangeError('Seat <n> is not at the table')` throw is unreachable and untested (uncovered in gate fix-3).
- NIT: the `endedBy === 'showdown'` check is redundant but clarifying.

## How to try it
- `npm run dev`, start a table, play or fold a hand: the result block appears, and Hand #2 is dealt 1.5 s later.
- `npm test`, `npm run e2e`, `npm run playtest -- --hands 10000 --seed 42`.

## Run metrics
Questions asked 4 (Q-1..Q-4) · assumptions 10 · review rounds 2 · judge rounds 0 (pending) · gate runs 3 · escalations 0 · changed 1152 lines in 15 files (budget 1150 / 15: lines warn, files pass).

## Known limitations and follow-ups
Each line is for the orchestrator to turn into a task or AC (Step 6a).
- The Q-4 top-up to $160 is TEMPORARY until all-ins exist. TASK-1.16 or TASK-3.11 (whichever lands last): add the exact AC quoted under Q-4 above, with its test; remove the top-up and update SPEC-10/SPEC-11.
- TASK-9.1: pass `holdNextHand` from the Hand Review panel to `useTableSession`; add `dealNext()` for Deal next hand running `dealHand(nextHand(t), newCode())`; keep the hold after Close (REQ-043.10).
- TASK-6.8: replace a $0 bot in `nextHand` with a new bot (preset style, unique name, $160) instead of the interim top-up.
- TASK-1.15: when casino show/muck order lands, extend `handResultView` to list shown losing hands in showdown order, winners first.
- TASK-1.9: after uncalled bets are returned, recheck that "wins $X" uses the award amount (A-6) and update SPEC-02's $16 if it changes.
- TASK-3.8: split the result into one line per pot using `result.awards`.
- TASK-3.9: add a test that `onHandComplete` fires exactly once per hand, including two hands with the same replay code (A-4).
- TASK-3.16: place the result on the felt as in the Review storyboard; move the duplicated e2e helpers (`installPausedClock`, `runFor1000`, `axeWithPausedClock`, `nextTurnPaused`, `countReplayDraws`) into `e2e/support/`.
- TASK-3.13: assert the 200-hands-per-hour pace with the 1.5 s between-hands delay included.
- TASK-3.4 (this story's MINORs, owner: TASK-3.4 or a test-hardening task): add the `King high` example with the top card not first; cover or remove the unreachable `Seat <n> is not at the table` throw at `hand-result.ts:83`.

## Lessons for the factory (proposals — not applied)
- The review r1 MAJOR was a missing test example for a rule clause the spec stated (pair above trips). Proposal: the spec template's hand-name/enumeration SPEC items should require at least one example per ordering case of a rule clause, so the test author lists them up front.
- Size landed at 1152 lines vs a 1150 budget (warn). Proposal: when a story edits earlier tests (D-2) and adds e2e, budget lines with a margin for fix rounds.
