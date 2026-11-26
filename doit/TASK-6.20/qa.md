# TASK-6.20 — Questions and answers (user, 2026-11-26)

## Q-1 — Which rule for bot memory across hands?
Options: (B) bots decide from the current hand only; (A) allow memory later and store the context in each hand record; (C) allow memory later and relax REQ-028.2.
**Answer: B — bots decide from the current hand only (recommended)** — user choice. Add REQ-029.3 + change-log row, a fast guard test, a doc comment on PlayerView.earlierShowdowns, record a Backlog decision, and archive TASK-6.23 as not needed.
