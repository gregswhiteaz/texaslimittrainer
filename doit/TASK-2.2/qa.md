# TASK-2.2 — Questions and answers (2026-11-22)

## Q-1 — Players control: native <select> "Players at the table", options 2 (heads-up), 3, 4, 5, 6 (6-max), 7, 8, 9, 10 (full ring), default 6
**Answer: auto-accepted (recommended)**

## Q-2 — Note: "Advice will be approximate (based on 6-max)." for 3/4/5/7; "(based on full ring)." for 8; none at 2/6/9/10; aria-describedby
**Answer: auto-accepted (recommended)**

## Q-3 — Heads-up labels: button seat "Small blind", other seat "Big blind"; dealer disc still marks the button
**Answer: auto-accepted (recommended)**

## Q-4 — Seating for sizes ≠ 6 until TASK-2.5: user at seat min(5, n); bots ascending, BOT_NAMES in order, all TAG; button = seat after the user; n=6 identical to defaults
**Answer: auto-accepted (recommended)**

## Q-5 — Amend 5 locked tests (dropdown counts/selection only)
tests/ui/home.acceptance.test.tsx (TASK-2.1); tests/ui/game-config-stake.acceptance.test.tsx and e2e/stake-choice.spec.ts (TASK-2.3);
tests/ui/game-config-game-type.acceptance.test.tsx and e2e/game-type-choice.spec.ts (TASK-2.4).
**Answer: user — approve (recommended).**
