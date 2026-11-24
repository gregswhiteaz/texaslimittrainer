# TASK-7.15 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — `--check-advice` CLI text as written in D-4 (options echo, `Advice check: <n> decision points, <m> mismatches`, `First advice mismatch: hand <k>, replay code <code>, player action <n> (<action>), <path> differs`, USAGE line 1 `[--check-styles] [--check-advice]` plus a new last line, two error lines), and update the USAGE text pinned in tests/playtest/cli.test.ts:108-114
**Answer: auto-accepted (recommended)** — user-visible CLI text listed for review. tests/playtest/cli.test.ts is not hook-locked by any task (only in test snapshots), so no owner unlock is needed; replace the pinned USAGE text one-for-one and keep the check count.

## Spec Detective notes
- A-1..A-6 accepted. AC#3 is proven at the API level; session wiring of observed stats stays with TASK-8.1.
- 10,000-hand --check-advice runs go in test:slow only (D-5); every push runs the same assertions at 100 hands.
