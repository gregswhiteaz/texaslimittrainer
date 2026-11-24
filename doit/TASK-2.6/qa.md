# TASK-2.6 — Questions and answers (autopilot, 2026-11-24; user's unattended rule)

## Q-1 — Ended-session format: optional `endedAt` (ISO string; absent/null = not ended), read-only in this story; sessionRecord does not write it; Leave table keeps going Home (session stays paused, Resume shows) until TASK-10.1 ends sessions with a saved report
**Answer: auto-accepted (recommended)** — persisted-format choice listed for review. Interim: Leave table behaves as a pause until TASK-10.1 (its AC#9 replaces this).

## Q-2 — Resume subtitle copy: storyboard text `Cash · 6 players · $4/$8 · 132 hands · paused` (Home.dc.html:36); singular `1 hand`; sit-and-go shows chip limits (`20/40`) until TASK-5.6 adds the level
**Answer: auto-accepted (recommended)** — user-visible copy listed for review.

## Spec Detective notes (no question needed)
- A-1..A-9 accepted as written. Old unended sessions accumulate until TASK-2.7 enforces one paused session (A-1 picks the latest); not new scope.
- nextBotName / rebuys caps: not in the ACs; not added.
