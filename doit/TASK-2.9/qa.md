# TASK-2.9 — Questions and answers (autopilot, 2026-11-22; user's unattended-approval rule)

## Q-1 — Randomness: each bot seat independently uniform over the 4 styles (word % 4, exact); crypto.getRandomValues, one 1-word call per seat, only on press
**Answer: auto-accepted (recommended)**

## Q-2 — UI: outline button "Randomise line-up" beside the Opponents heading; no confirmation; preset radio unchanged; rows update in place
**Answer: auto-accepted (recommended)**

## Q-3 — Locked-test edits: add 'Randomise line-up' after '← Home' in four button lists
tests/ui/home.acceptance.test.tsx (TASK-2.1); tests/ui/game-config-game-type.acceptance.test.tsx (TASK-2.4);
tests/ui/game-config-stake.acceptance.test.tsx and e2e/stake-choice.spec.ts (TASK-2.3).
**Answer: auto-accepted (recommended)**
