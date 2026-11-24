# TASK-3.21 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Sit-and-go first bust without the top-up: A — stop the game (sitAndGoStopped helper, new 'stopped' step): no further hand dealt, last result stays, Leave table works; no new text, no record-format change; the stopped session's record is rejected on read so it is never offered for Resume (logs the existing "Session record could not be read" line on each Home load). Empty seats stay TASK-5.2, finishing stays TASK-5.7
**Answer: auto-accepted (recommended)** — user-visible interim behaviour listed for review.

## Q-2 — Re-pin two locked tests under their owners, one-for-one per spec §5, same expect count, expected values/titles/dead branch only: tests/table/next-hand.acceptance.test.ts (owner TASK-3.4) and tests/table/rebuy.acceptance.test.ts (owner TASK-3.11)
**Answer: auto-accepted (recommended)** — cross-story locked-test edits listed for review; unlocked under the owners with reason "TASK-3.21 Q-2".

## Spec Detective notes
- A-1..A-6 accepted. A-5 (playSession rebuys a busted user) keeps TASK-2.6's locked resume test passing unchanged.
- Unlocked unit tests tests/table/next-hand.test.ts and tests/table/game-type.test.ts: re-pin expected values, keep check counts.
