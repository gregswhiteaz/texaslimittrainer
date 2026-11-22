# TASK-3.27 — Questions and answers

## Q-1 — Rewrite AC#1 (original hypothesis refuted; "≥3 bots before the user" impossible in hand 1)
Options: (a) reorder meterBotAction's checks; self-test start-up in 1 ms steps until the deal shows; assert exactly 2
blinds posted and seat 3 to act [Recommended]; (b) also meter post-flop bots (≥3 samples); (c) fix the race only.
**Answer: user — (a).** AC#1 replaced in Backlog (old AC removed, new AC added).

## Q-2 — Cross-story edit to locked e2e/rapid-pace.spec.ts (owner TASK-3.13)
Strengthen-only: reorder meterBotAction checks (worker-post before the null return; also fixes the guard test's hidden
gap); self-test start-up in 1 ms steps capped at 2,000 fake ms; `actionCount > 0` → exactly 2 plus seat 3 "To act".
**Answer: user — approve.** Unlock recorded under TASK-3.13.
