# TASK-1.16 changes

- `src/engine/hand.ts`: $1 stack floor and all-in blinds (D-1: `added` = chips posted, `amount` = blind size). `bettingOver` deals a hand out at the deal (D-2) and ends a round mid-hand (D-3). New `nextButton`. Doc comments updated.
- `src/engine/invariants.ts`: new `checkDeal`, which runs checkState, the C5 returned-chips rule at the deal, and the AC#9 cross-hand chip check.
- `src/playtest/runner.ts`: adds `GameType`, `GAMES`, `SNG_STAKES`, `SNG_STARTING_CHIPS` and `HandSetup`.
  - Stacks carry over between hands; cash rebuys a busted seat; sng starts a new sit-and-go when one player has all the chips.
  - The button moves via `nextButton`; replay-code word 2 is set in `handReplayCode`; every hand gets the deal check; the default policy is chosen per hand from the seats dealt in.
  - New fields `dealViolations` and `HandRecord.game`/`size`.
- `src/playtest/cli.ts`: `--game`, and `--stacks` (replay only). New USAGE, Table, Options and Replay lines. Blinds print the chips posted (`added`). A deal violation is reported as "at the deal".
- `tests/engine/button-blinds.acceptance.test.ts`: new. AC#1–AC#5 (SPEC-01..07).
- `tests/engine/all-in-blinds.test.ts`: new. The lone-player rule, the floor, `nextButton`, and the small-stack grid (SPEC-08, SPEC-09).
- `tests/engine/check-deal.test.ts`: new. `checkDeal` cases (SPEC-14), including a C5-only returned-chips case (fix round 1).
- `tests/playtest/games.acceptance.test.ts`: new. AC#6–AC#9 (SPEC-10..13). SPEC-10 uses the Q-6 threshold: at least 1 completed sit-and-go, and the next hand is a fresh sit-and-go.
- `tests/playtest/cli.test.ts`: updated for the new fields, flags, lines and error cases. New "game and stacks options" test (SPEC-15).
- `tests/playtest/runner.test.ts`: new "carried stacks and restarts" test (SPEC-15); restart case flags the hand-completing action (fix round 1).
- `tests/engine/hand.test.ts`: floor cases now use stack 0 and the "at least 1" message.
- `tests/table/next-hand.test.ts`: same floor change, stack 4 → 0 (fix brief item 3, unlocked).
- `tests/engine/bet-cap.acceptance.test.ts`: E7 (Q-5, unlocked under TASK-1.12). `betsPerStreet` counts only REQ-016.5 counted bets. Line 233 now reads `violation?.violations`.
- `tests/engine/chip-safety.acceptance.test.ts`: E1 (locked, TASK-1.31). Message changed to "at least 1".
- `tests/engine/input-hardening.acceptance.test.ts`: E2 (locked, TASK-1.21). Message changed to "at least 1".
- `tests/playtest/playtest.acceptance.test.ts`: E3 (locked, TASK-1.6). New cash Table line.
- `tests/playtest/heads-up.acceptance.test.ts`: E4 (locked, TASK-1.11). New cash Table line.
- `tests/playtest/runner.acceptance.test.ts`: E5 and E6 (locked, TASK-1.6). E5 checks the carried-stack seats; E6 adds `--stacks` to the hand-4 replay.

No new dependencies.
