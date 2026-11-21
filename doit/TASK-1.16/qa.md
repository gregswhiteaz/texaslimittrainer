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
