---
id: doc-63
title: 'TASK-1.16: Move the button and blinds past busted seats'
type: other
created_date: '2026-11-21T09:25:00Z'
updated_date: '2026-11-21T09:25:00Z'
---
# TASK-1.16: Move the button and blinds past busted seats

Status: Done (pending judge) · Completed: 2026-11-21 · Epic: TASK-1 — Prove the game headlessly · Milestone: m-1 · Requirements: REQ-018.5, REQ-020.1–020.4, REQ-056.1, REQ-062.1, REQ-008.1, REQ-013.3 · Branch: doit/TASK-1.16

## What was asked
Between hands the button moves to the next seat with chips, and the next two such seats post the blinds. Busted seats are skipped and nobody posts a missed or dead blind. A player who can't cover a blind posts everything and is all-in. The playtest stops resetting every stack to $160: stacks carry over (cash rebuys a $0 seat for $160), and a new `--game sng` mode starts at 1,500 chips, 20/40, with no refills. Spec: doit/TASK-1.16/spec.md.

## Assumptions made without asking — please review
| ID | Assumption | Reversible? | Why | To reverse |
|---|---|---|---|---|
| A-1 | Cash rebuy happens between hands; a $0 seat gets $160 and is dealt in normally (no waiting for the big blind). | yes | Bots always rebuy (REQ-007.5); no missed-blind concept (REQ-020.2). | Make a rebought seat wait for the big blind |
| A-2 | First hand of every table has the button at seat 1 (run start, each new sit-and-go, after a violation). | yes | Matches old hand 1; simple and deterministic. | Carry the rotation into the new sit-and-go |
| A-3 | After a hand with any violation the table restarts: all seats at the starting stack, button 1, no cross-hand check next hand. | yes | An abandoned hand has no settled stacks; carrying them would give false chip violations. | Stop the run at the first violation |
| A-4 | sng chip amounts print with `$` in the playtest (only the Table line says "chips"). | yes | REQ-008.7 is app UI (TASK-5.3); one formatter keeps the CLI change small. | Drop `$` in sng output |
| A-5 | Default policy per hand: TAG when exactly 6 seats are dealt in, seeded random-move otherwise. | yes | The 6-max chart throws unless exactly 6 are dealt in; sng busts reduce the count. | Random policy for all of sng |
| A-6 | `checkDeal` problems are counted like action violations, reported as `First violation: hand N, at the deal`; such a hand isn't played. | yes | Hands finished at the deal have no actions, so they would never be checked. | Report as part of action 1 |
| A-7 | Replay/Options lines add `--stacks` only if some seat differs from the starting stack, and `--game sng` only for sng. | yes | Keeps the locked Replay line unchanged for buy-in hands. | Always print both |
| A-8 | `nextButton` lives in `src/engine/hand.ts`; only the runner calls it for now. | yes | The session keeps its own rotation until TASK-3.21/TASK-5.2. | New `src/engine/table.ts` |

## Clarifications and decisions
All answers were auto-accepted (autopilot, recommended options), recorded in doit/TASK-1.16/qa.md.
- **Q-1 (D-1, D-2, D-3) all-in blind rules.**
  - Short big blind: the record keeps `amount` = full blind and `added` = chips posted. `currentBet` stays at the full big blind, so others call the full blind and the excess becomes a side pot or is returned.
  - If nobody is left to bet against at the deal, `createHand` returns a completed hand (no actions).
  - Mid-round, if exactly one seat is not all-in and it has the largest street contribution, the round ends, so the big blind gets no option. This also avoids a TAG crash on a nonexistent "BB unopened" chart spot.
- **Q-2 (D-6) CLI text.** `--game <cash|sng>` (both modes), `--stacks` (replay only), new USAGE/Table lines, `First violation: hand N, at the deal`, blinds print the chips actually posted.
- **Q-3 (D-5) replay-code word 2.** Cash 0 (existing codes still replay), sng 1.
- **Q-4 (D-4) locked-test edits E1–E6 and the $1 floor.**
  - E1 TASK-1.31 chip-safety:131 and E2 TASK-1.21 input-hardening:89: "at least 5" becomes "at least 1".
  - E3 TASK-1.6 playtest.acceptance:72 and E4 TASK-1.11 heads-up.acceptance:27: new cash Table line.
  - E5 TASK-1.6 runner.acceptance:28-40: hand 1 at 160, later hands equal the previous final stacks with $0 → $160 (stricter).
  - E6 TASK-1.6 runner.acceptance:91-95: add `--stacks` to the hand-4 replay args.
  - Nothing removed or loosened.
- **Q-5 (mid-build deviation) E7, locked bet-cap test, TASK-1.12.**
  - With carried stacks, random play makes short all-in raises under half a bet. REQ-016.5 says they don't count toward the cap, but `betsPerStreet` counted every raise record: 7 over-count streets, with engine and checker reporting 0 violations.
  - Fix: `betsPerStreet` now counts only REQ-016.5 counted bets (the big blind, or a bet/raise adding at least half a unit over the street's last counted level), computed in the test itself.
  - Line 233 now reads `violation?.violations`, needed because D-7 makes `firstViolation.violation` nullable.
  - Reviewer judged it not loosened in substance: it still fails on a real 5th counted bet, and the optional chain can't hide a null.
  - The same fix brief also changed `tests/table/next-hand.test.ts` (floor case stack 4 → 0).
- **Q-6 (mid-build deviation) SPEC-10.** Seed 42 over 10,000 sng hands completes only 1 sit-and-go (hand 5716). The next one is still running heads-up at hand 10,000 (6,597 heads-up hands). Threshold became ≥ 1 completed sit-and-go AND the next hand starts fresh (every seat 1,500, button 1). Seed and hand count unchanged.
- Other decisions: D-4 stack floor $1, busted seats are left out of `HandConfig.seats` by the caller; D-7 `PlayedHand.dealViolations`, `HandRecord.game`/`size`, `firstViolation: PlayedHand | null`; D-8 carry rule (final stack carries, cash $0 → $160, sng $0 sits out, one seat with chips starts a new sit-and-go, `nextButton(next, final.button)`).

## What was built

### Button and blind rules (W1–W4)
- `nextButton(stacks, previous)` returns the first seat clockwise after `previous` with chips (wrapping; `previous` may be busted). It throws `RangeError('Need at least 2 seats with chips')` if fewer than 2 seats have chips.
- W1: 6 seats at $160, button 1. After a fold-out the button moves to 2, seat 3 posts SB 2 and seat 4 posts BB 4, and seat 5 acts.
- W2: seat 3 busted, so the next hand has seats [1,2,4,5,6], button 2, SB seat 4, BB seat 5, and seat 6 acts.
- W3: if the seat due to post the big blind has busted, only two blind records exist (SB 2, BB 4), contributions total 6, and there is no dead or missed blind.
- W4: 3 players down to 2, so the button posts the small blind and acts first.

### All-in blinds (W5–W10, D-1..D-3)
- A blind posts `min(blind, stack)` and the player is all-in if the stack hits 0. The record is `{amount: blind size, added: posted}`.
- W5: seat 2 with $1 posts $1 of the $2 small blind and is all-in. If everyone else folds, seat 3 gets $3 back and the pot is $2.
- W6: seat 3 with $3 posts $3 of the $4 big blind. Others still call 4 and seat 2 gets $1 back; the pot is $6 with eligible [2,3].
- W7: heads-up with SB at $1: the hand completes at the deal (nobody to bet against), the board is dealt out, 0 player actions.
- W8: heads-up with BB at $3: seat 1 must act, calls 2, returned $1. With BB at $1: complete at the deal.
- W9: both blinds all-in: the button acts; if it folds, seat 3 gets $2 back.
- W10 (D-3): a mid-round caller goes all-in for $3, the rest fold, and the hand completes without the big blind acting (returned $1, pot $8).
- `createHand`'s stack floor is now $1: `Stack at seat N must be an integer of at least 1`.

### Cash / sng playtest rules (D-8)
- Cash: 6 seats at $160, stakes $2/$4/$4/$8, stacks carry over, a $0 seat rebuys for $160 (A-1).
- sng: 1,500 chips each at 20/40 (blinds 10/20), no refills, busted seats sit out, and a new sit-and-go starts when one seat has all the chips. It stays at Level 1.
- Replay-code word 2: cash 0, sng 1. `handReplayCode(42,1,'sng')` = `000000000000002a0000000100000001`.
- Each deal is checked by `checkDeal`: `checkState`, the C5 returned-chips rule if the hand finished at the deal, and a cross-hand check that each seat starts with its previous final stack.

### Files
- `src/engine/hand.ts`: floor, all-in blinds, `bettingOver`, `nextButton`.
- `src/engine/invariants.ts`: `checkDeal`.
- `src/playtest/runner.ts`: `GameType`, `GAMES`, `SNG_STAKES`, `SNG_STARTING_CHIPS`, `HandSetup`, carry/rebuy/restart, word 2, deal check, per-hand policy.
- `src/playtest/cli.ts`: `--game`, `--stacks`, new USAGE, Table, Options and Replay lines, blind text, deal block.
- Tests: new `tests/engine/{button-blinds.acceptance,all-in-blinds,check-deal}.test.ts` and `tests/playtest/games.acceptance.test.ts`. Updated `cli.test.ts`, `runner.test.ts`, `hand.test.ts`, `tests/table/next-hand.test.ts`. Locked-test edits E1–E6, plus E7 in `bet-cap.acceptance.test.ts`.

### New baselines (seed 42, 10,000 hands; byte-identical across two runs each)
Cash — `npm run playtest -- --hands 10000 --seed 42` (0.79 s). The old baseline was Ended by fold 5470, Ended at showdown 4530, Player actions 88831, Streets capped 244. It changed on purpose.
```
TLH Trainer playtest
Options: --hands 10000 --seed 42 --size 6
Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160
Hands played: 10000
Ended by fold: 5461
Ended at showdown: 4539
Player actions: 88746
Streets capped at 4 bets: 242
Largest pot: $70
First replay code: 000000000000002a0000000000000001
Last replay code: 000000000000002a0000000000002710
Invariant violations: 0
```
sng — `npm run playtest -- --hands 10000 --seed 42 --game sng` (0.50 s)
```
TLH Trainer playtest
Options: --hands 10000 --seed 42 --size 6 --game sng
Table: 6 players, sit-and-go 20/40 (blinds 10/20), 1500 chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips
Hands played: 10000
Ended by fold: 8061
Ended at showdown: 1939
Player actions: 57692
Streets capped at 4 bets: 870
Largest pot: $880
First replay code: 000000000000002a0000000100000001
Last replay code: 000000000000002a0000000100002710
Invariant violations: 0
```
Seed-42 cash probe (before final build): 13 rebuys, 24 all-in hands, 5 side-pot hands.

### Not changed, and N/A DoD items
- **TASK-3.21 note:** `src/table/session.ts` is untouched. Its TEMPORARY top-up to the $160 buy-in stays, and TASK-3.21 still owns removing it (it also needs rebuy in the app). The session never deals a stack below $96, so the new $1 floor changes nothing there.
- DoD#3 N/A: no golden-spot suite yet. DoD#7 N/A: no screen changes. DoD#8 N/A: headless code, no network. DoD#9 N/A: no strategy content. DoD#12 N/A: no service worker yet.
- Not done, by design: the rising sng level schedule (TASK-5.4), sng finishing positions, and CI workflow changes (CI keeps running the cash 10,000-hand playtest).

## How it was verified
| SPEC item | Covers | Verification | Result | Evidence |
|---|---|---|---|---|
| SPEC-01..07 | AC#1–5 | `tests/engine/button-blinds.acceptance.test.ts` | pass | gates/fix-3.json |
| SPEC-08, 09 | lone player, floor, nextButton, small-stack grid | `tests/engine/all-in-blinds.test.ts` | pass | gates/fix-3.json |
| SPEC-10..13 | AC#6–9 | `tests/playtest/games.acceptance.test.ts` (SPEC-10 per Q-6) | pass | gates/fix-3.json |
| SPEC-14 | checkDeal | `tests/engine/check-deal.test.ts` (C5 case added in R2) | pass | review round 2 mutant |
| SPEC-15 | CLI, runner | `cli.test.ts`, `runner.test.ts` | pass | gates/fix-3.json |
| SPEC-16 | locked-test edits | E1–E6 as approved, plus E7 (Q-5) | pass | review round 2 |
| SPEC-17 | lint, typecheck, test, both 10k runs | see below | pass | gates, build-log.md |
| SPEC-18 | this doc | manual | pending | `backlog doc list --plain` |

- Gates: build-1, fix-2 and fix-3 all PASS.
- `npm run lint` and `npm run typecheck` exit 0.
- `npm test`: 130 files, 465 passed, 6 skipped. Coverage 97.38% lines, thresholds hold.
- Both 10,000-hand playtests exit 0 with 0 violations and are byte-identical on rerun.
- Reviewer fuzz: 20,000 small-stack engine hands (2–10 seats, random policies) had clean checkDeal/checkStep, conserved chips, and no seat asked to act with nobody to bet against. 12,000 runner hands (cash and sng, 3 seeds) had 0 violations and replayed bit-identically, including via CLI `--stacks`.
- 9 reviewer mutants were caught: D-2, D-3, the nextButton chip filter, the cross-hand seat union, the rebuy expectation, deal-violation counting, blind text, per-hand policy and `previous`. In round 2 the two new mutants (C5 rule, restart condition) were caught.
- Judge: see doit/TASK-1.16/judge/.

## Review
- Round 1 code review had one MAJOR: checkDeal's C5 returned-chips rule had no test that only it could satisfy (the existing `wrongReturn` case was also caught by conservation). It also had one MINOR: the restart-after-violation test always restarted via `result === null`. Both were fixed test-only in round 2 (`phantomReturn` case; the test now flags the hand-completing action) and both mutants fail the tests.
- Security: clean in both rounds. Notes: `--game` is an exact enum; `--stacks` uses an anchored regex with length, per-value and total bounds; error messages don't echo input; no new dependencies, network or randomness.
- Round 2 had no findings.

### Non-blocking review notes (deliberately not fixed)
- No MINOR/NIT findings remain open.
- Size overrun, recorded by the reviewer: 1,304 lines in 18 files against a budget of 1,250 lines and 16 files. The extra files are the approved `next-hand.test.ts` floor change and E7.
- The old `cli.test.ts` source-text check (violationBlock typed ViolatingHand, no `=== null`) was replaced under D-7 by a behaviour test asserting the exact deal-violation lines.

## How to try it
```
npm run playtest -- --hands 10000 --seed 42
npm run playtest -- --hands 10000 --seed 42 --game sng
npm run playtest -- --replay-code 000000000000002a0000000100000001 --size 6 --game sng
npm run playtest -- --replay-code <code> --size 3 --button 2 --game sng --stacks 0,2900,100
npm test
```

## Run metrics
Questions asked 6 (Q-1..Q-4 up front, Q-5 and Q-6 mid-build; all auto-accepted) · assumptions logged 8 (A-1..A-8; state.json counter shows 0) · review rounds 2 · judge rounds 0 at doc time · gate runs 3 · escalations 0 · changed lines 1,325 in 18 files (gate fix-3).

## Known limitations and follow-ups
- [trainer] TASK-3.21: remove the session's TEMPORARY $160 top-up and add rebuy in the app. It can then use `nextButton` and the $1 floor, and the session's own rotation goes away. (Existing task.)
- [trainer] TASK-5.4: extend the sng mode with the rising level schedule (REQ-008.2/008.3). Same mode, no second one. (Existing task.)
- [trainer] TASK-5.x: sng finishing positions, the user busting, and chips shown without `$` (REQ-008.7).
- [trainer] Seed 42 completes only 1 sit-and-go in 10,000 hands (6,597 hands heads-up with random policy). Pin multi-sit-and-go restart coverage with another seed or smaller `--size`, e.g. in `games.acceptance.test.ts` AC#6 (owner: TASK-1.16 follow-up or TASK-5.4).
- Not tracked (infra, below the value bar): CI still runs only the cash 10,000-hand playtest. The sng run is covered by vitest. No real failure caused or expected.

## Lessons for the factory (proposals — not applied)
- The spec's SPEC-10 threshold ("at least 2 completed sit-and-gos at seed 42") was assumed without a probe, and it stopped the build (Q-6). Proposal: the spec stage should run a throwaway probe for any "count must be > N at seed S" assertion before approval.
- The locked bet-cap test counted every raise (Q-5). Proposal: when a spec changes a global input (stacks carry over), the spec stage should grep locked tests that depend on the old behaviour (e.g. `betsPerStreet`, nullable `firstViolation`) and list them as edits up front, not as mid-build E7.
- The build stopped twice (blocked.json) for these two spec gaps and needed a fix brief. Both were avoidable with the proposals above.
- The state.json `assumptions` counter was 0 although 8 assumptions exist in the spec. Proposal: count the spec's Assumptions table at spec approval.
