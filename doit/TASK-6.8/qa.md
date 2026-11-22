# TASK-6.8 — Questions and answers (2026-11-22; autopilot paused for the user's decision on Q-4, all four asked together)

## Q-1 — Replacement style draw (randomness)
**Answer: user — seeded from the finished hand's replay code + seat (`replacementGenerator`), uniform over the distinct allowed styles (recommended).**

## Q-2 — Names for new bots
**Answer: user — REPLACEMENT_NAMES Jay…Zed, then "Jay 2"…; never reused within a session; names at the table skipped (recommended).**

## Q-3 — Playtest output and interface
**Answer: user — default runs byte-identical; --lineup cash runs replace and print `Bots replaced: N`; Replay line adds `--styles` when styles differ from the preset (recommended).**

## Q-4 — Edits to locked tests owned by other stories
(1) tests/table/next-hand.acceptance.test.ts:93-96 (TASK-3.4): expect a new bot at seat 1 (Jay, $160), seats 2-6 unchanged.
(2) same file :141: replace `topUps > 0` with: only a $0 bot or the user below $96 changes stack, and the $94 bot carries $94.
(3) tests/playtest/policy-lineup.acceptance.test.ts:18-27 (TASK-1.52): shorten the Tough comparison to 45 hands (still differs from all-TAG).
**Answer: user — approve all three (recommended).**
