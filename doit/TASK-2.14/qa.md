# TASK-2.14 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Table header Home control: text button "Home" before Leave table, styled like Leave table (future order Home, Settings, Leave table); REQ-004.9 names it "Home"
**Answer: auto-accepted (recommended)** — user-visible label/placement listed for review.

## Q-2 — Browser Back/Forward: (a) opening the Table (Start game or Resume) pushes one history entry with a unique key; Back on the Table pauses to Home like the Home control; Forward never reopens the Table; Home/Game Config add no entries; leaving the Table in-app calls history.back(). Reverses TASK-2.1 A-2 for the Table only
**Answer: auto-accepted (recommended)** — user-visible navigation listed for review.

## Spec Detective notes
- A-1..A-6 accepted as written. A-2 (wait for in-flight table writes before Home reads the paused session) also applies to Leave table's return; same Home read, no change in meaning.
