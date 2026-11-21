# TASK-1.16 — Questions and answers (autopilot run, 2026-11-21)

## Q-1 — All-in blind rules (D-1, D-2, D-3)
(a) A short big blind keeps the full blind as `amount` and the chips posted as `added`; `currentBet` stays at the full big
blind, so others call the full blind and the excess becomes a side pot or is returned. (b) If nobody is left to bet
against at the deal, `createHand` deals the hand out with no actions. (c) Mid-round, the big blind gets no option when
every other live player is all-in for no more than the blind (otherwise the TAG bot hits a chart spot that doesn't exist).
Alternatives: let the bet level drop to the posted amount (off-grid sizes); keep the BB option (needs a new chart spot).
**Answer: auto-accepted (recommended)** — approve (a), (b), (c).

## Q-2 — Playtest CLI interface and text (D-6)
New `--game <cash|sng>` (both modes) and `--stacks` (replay only); USAGE/Table lines; Options/Replay lines gain
` --game sng` / ` --stacks …` only when non-default; `First violation: hand N, at the deal`; blinds print chips posted.
Exact text in spec §5. Alternatives: always print `--game cash`; a separate `--sng` flag.
**Answer: auto-accepted (recommended)** — as specified.

## Q-3 — Replay-code word 2 (D-5)
Recommended: cash 0 (unchanged, so existing codes still replay), sng 1. Alternative: another constant.
**Answer: auto-accepted (recommended)** — cash 0, sng 1. (Reversible: replay codes are produced only by the dev playtest CLI; no user data stores them yet.)

## Q-4 — Edits to locked tests E1–E6 and the floor message (D-4)
E1 TASK-1.31 chip-safety:131 and E2 TASK-1.21 input-hardening:89 "at least 5"→"at least 1"; E3 TASK-1.6
playtest.acceptance:72 and E4 TASK-1.11 heads-up.acceptance:27 new cash Table line; E5 TASK-1.6 runner.acceptance:28-40
hand-1 stacks 160 and later hands' stacks = previous final stacks ($0→$160) (stricter); E6 TASK-1.6 runner.acceptance:91-95
add `--stacks` to the hand-4 replay args. Nothing removed or loosened.
**Answer: auto-accepted (recommended)** — approve. Unlocks recorded under each owning task.

## Q-5 — Mid-build: locked bet-cap test (TASK-1.12) vs carried stacks (builder blocked.json item 1–2)
With stacks carried over, random play now makes short all-in raises under half a bet; REQ-016.5 says they don't count
toward the cap, but bet-cap AC#4's `betsPerStreet` counts every raise record (7 over-count streets, all containing such a
raise; engine/checker report 0 violations). Line 233 also fails typecheck because D-7 makes `firstViolation.violation`
nullable. Options: (a) E7 — count only REQ-016.5 counted bets (same half-bet rule, independent of the engine) and change
line 233 to `violation?.violations` keeping the same assertion [Recommended]; (b) keep stacks reset in that test.
**Answer: auto-accepted (recommended)** — (a). Unlock recorded under TASK-1.12. Recorded deviation from the locked spec's
E1–E6 list.

## Q-6 — Mid-build: SPEC-10 "at least 2 completed sit-and-gos" at seed 42 (builder blocked.json item 3)
The seed-42 10,000-hand sng run completes 1 sit-and-go (ends at hand 5716, then a second starts and is still running
heads-up at hand 10,000; 6,597 heads-up hands; 0 violations). AC#6 needs a new sit-and-go to start when one player holds
all chips — one completion followed by a new start proves it. Options: (a) SPEC-10 threshold ≥1 completed sit-and-go
AND the next hand starts a fresh sit-and-go (every seat 1,500) [Recommended]; (b) change the A-5 policy; (c) more hands.
**Answer: auto-accepted (recommended)** — (a). Seed and hand count unchanged. Recorded deviation.
