# TASK-2.20 — Questions and answers (autopilot, 2026-11-25)

No ask items. Decisions required by the task's own ACs, recorded for review:
- D-3 (AC#3): landing on a Table history entry pushed during this page load while no Table is shown steps off it once with history.back(); entries from an earlier load are left alone.
- D-4 (AC#2): locked e2e/history.spec.ts (TASK-2.14) case (5) drops `{ pausedClock: false }` and its timeOrigin comment so it runs under the paused clock — a strengthening edit, no assertion removed.
**Answer: auto-accepted (recommended)** — unlocked under TASK-2.14.

Scope note for a possible follow-up: after a reload on the Table, entries from the earlier load stay in history; Back from Home then reloads the page (pre-existing, outside the ACs).
