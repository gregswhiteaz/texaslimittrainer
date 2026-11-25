# TASK-6.19 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Edit the TASK-6.9-locked tests/playtest/style-bots.acceptance.test.ts (expects unfiltered earlier showdowns, contradicting AC#1)
Options: yes — change only how the expected list is built (forget seats in each hand's `replaced`), every other assertion unchanged [Recommended]; leave it (AC#1 can't pass); move to a no-replacement run (weaker).
**Answer: auto-accepted (recommended)** — unlocked under TASK-6.9. D-1 (keep seat keys, forget on replacement, no persisted-format change) accepted with it. AC added to TASK-6.23 for the app side.
