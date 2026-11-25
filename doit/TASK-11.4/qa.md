# TASK-11.4 — Questions and answers (autopilot, 2026-11-25)

## Q-1 — Remember the filter selection?
Options: no, every opening starts at All / All [Recommended]; remember until reload; persist in localStorage.
**Answer: auto-accepted (recommended)** — not remembered.

## Q-2 — Sit-and-go table-size bucket: starting size or per-hand dealt-in count?
Options: session size = largest dealt-in count among its hands, mapped through referenceSizeOf [Recommended]; per hand by dealt-in seats; SessionRecord.config.players (needs fixture and store changes).
**Answer: auto-accepted (recommended)** — session size from the largest dealt-in count.
