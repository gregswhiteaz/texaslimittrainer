# TASK-7.8 — Questions and answers (overnight autopilot, 2026-11-22; user's unattended-approval rule)

## Q-1 — Bot equity budget (A): bots stay on every-unseen-combo ranges, apply the value rule via recommend with
`equity: BOT_EQUITY` (exactLimit 2,500, trials 500, seeded like computeEquity), callingRange memo per board;
target ≤ 15 s per 10,000-hand playtest locally (A-8: lower trials, not below 200). Per the standing slow-tests rule,
if any every-push run still can't meet its locked limit, move only the heavy run to the opt-in slow group with a
smaller every-push version.
**Answer: auto-accepted (recommended)**

## Q-2 — Rule ids `value-bet` / `value-raise`; re-pin the locked TASK-7.3 fake id to `bluff`
**Answer: auto-accepted (recommended)**

## Q-3 — Cross-story locked-test edits re-pinning expected values (no assertion dropped, no time limit relaxed):
TASK-7.3 postflop.acceptance; TASK-7.22 postflop-coverage.acceptance; TASK-6.1 tag.acceptance; TASK-6.2 tag-mixing.acceptance;
TASK-6.3 calling-station.acceptance; TASK-6.4 maniac.acceptance; TASK-7.4 grade.acceptance; TASK-7.5 range-model.acceptance;
TASK-9.1 review.acceptance + review-panel.acceptance; TASK-3.4 next-hand.acceptance. Any further locked file that fails
only on re-pinnable values is approved the same way (unlock under its owner, logged here).
**Answer: auto-accepted (recommended)**
