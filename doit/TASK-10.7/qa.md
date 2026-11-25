# TASK-10.7 — Questions and answers (autopilot, 2026-11-24)

## Q-1 — What to store (persisted format)
Options: separate optional `hints: { hinted, decisions }` after leakCounts, present exactly when `errors` is [Recommended]; nest inside `errors` (breaks locked tests); store only `hinted` (unworkable).
**Answer: auto-accepted (recommended)** — separate `hints` field.

## Q-2 — Screen text and placement (user-visible)
Options: 4th tile "Hints used" / "40 of 320 decisions (12.5%)" in Volume and errors, singular "1 of 1 decision", "0 of 0 decisions (0.0%)", 18px value text, class report-hints [Recommended]; sentence under the tiles; "12.5%" with a smaller second line; "—" for no decisions.
**Answer: auto-accepted (recommended)** — 4th tile as specified. Listed for user review.
